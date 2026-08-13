import os
import time
import subprocess
import tempfile
import shutil
import logging
import sys
from typing import Dict, Any, List
from app.services.code_execution.result_evaluator import ResultEvaluator

logger = logging.getLogger(__name__)

class DockerExecutor:
    """Secure Sandbox Execution Engine for Candidate Code supporting Docker and Local Subprocess Fallback."""

    def __init__(self, time_limit_seconds: float = 2.0, memory_limit_mb: int = 256):
        self.time_limit = time_limit_seconds
        self.memory_limit = memory_limit_mb
        # Check if docker is installed and active
        self.use_docker = shutil.which("docker") is not None
        if not self.use_docker:
            logger.warning("Docker was not found in PATH. Falling back to secure local subprocess runner.")

    def run_code(
        self,
        language: str,
        code: str,
        test_cases: List[Dict[str, Any]],
        function_name: str = "twoSum"
    ) -> Dict[str, Any]:
        """Executes candidate code against test cases in isolated Docker or local secure sandbox."""
        language = language.lower().strip()
        if language not in ["python", "py", "java"]:
            return {
                "status": "Compilation Error",
                "error_message": f"Unsupported language: {language}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
            }

        temp_dir = tempfile.mkdtemp(prefix="hireai_sandbox_")
        
        # Prepare path for Docker volume mounting if applicable
        mount_dir = temp_dir
        if os.name == "nt":
            mount_dir = temp_dir.replace("\\", "/")
            if ":" in mount_dir:
                drive, path = mount_dir.split(":", 1)
                mount_dir = f"//{drive.lower()}{path}"

        try:
            if language in ["python", "py"]:
                return self._run_python(temp_dir, mount_dir, code, test_cases, function_name)
            elif language == "java":
                return self._run_java(temp_dir, mount_dir, code, test_cases, function_name)
        except Exception as e:
            logger.exception("Sandbox Execution crashed:")
            return {
                "status": "Internal Error",
                "error_message": f"Sandbox manager error: {str(e)}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _run_python(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Dict[str, Any]], func_name: str) -> Dict[str, Any]:
        # Python Driver Harness
        driver_harness = f"""import sys
import json

# --- CANDIDATE SOLUTION ---
{code}

# --- DRIVER HARNESS ---
if __name__ == "__main__":
    raw_input = sys.stdin.read().strip()
    if raw_input:
        lines = [line.strip() for line in raw_input.splitlines() if line.strip()]
        parsed_args = []
        for line in lines:
            if "=" in line:
                line = line.split("=", 1)[1].strip()
            try:
                parsed_args.append(json.loads(line))
            except Exception:
                try:
                    parsed_args.append(eval(line))
                except Exception:
                    parts = line.split()
                    if len(parts) > 1:
                        try:
                            parsed_args.append([int(x) for x in parts])
                        except ValueError:
                            parsed_args.append(parts)
                    else:
                        try:
                            parsed_args.append(int(line))
                        except ValueError:
                            parsed_args.append(line)

        sol = Solution() if 'Solution' in globals() else None
        method = getattr(sol, "{func_name}", None) if sol else globals().get("{func_name}")

        if not method and 'Solution' in globals():
            methods = [m for m in dir(Solution) if not m.startswith('__')]
            if methods:
                method = getattr(sol, methods[0])

        if not method:
            raise AttributeError("Could not find required solution method.")

        result = method(*parsed_args)
        if isinstance(result, (list, dict, tuple)):
            print(json.dumps(result))
        elif isinstance(result, bool):
            print("true" if result else "false")
        else:
            print(result)
"""
        file_path = os.path.join(temp_dir, "solution.py")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(driver_harness)

        if self.use_docker:
            cmd = [
                "docker", "run", "--rm", "-i",
                "--net", "none",
                "--memory", f"{self.memory_limit}m",
                "--cpus", "1.0",
                "-v", f"{mount_dir}:/app",
                "-w", "/app",
                "python:3.10-slim",
                "python", "solution.py"
            ]
        else:
            cmd = [sys.executable, file_path]

        return self._execute_tests(cmd, test_cases)

    def _run_java(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Dict[str, Any]], func_name: str) -> Dict[str, Any]:
        solution_path = os.path.join(temp_dir, "Solution.java")
        runner_path = os.path.join(temp_dir, "Runner.java")

        with open(solution_path, "w", encoding="utf-8") as f:
            f.write(code)

        runner_harness = f"""import java.io.*;
import java.util.*;
import java.lang.reflect.*;

public class Runner {{
    public static void main(String[] args) {{
        try {{
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {{
                if (!line.trim().isEmpty()) {{
                    sb.append(line.trim()).append("\\n");
                }}
            }}
            String inputStr = sb.toString().trim();
            if (inputStr.isEmpty()) return;

            String[] lines = inputStr.split("\\n");
            Solution solution = new Solution();
            Method targetMethod = null;
            for (Method m : Solution.class.getDeclaredMethods()) {{
                if (m.getName().equals("{func_name}")) {{
                    targetMethod = m;
                    break;
                }}
            }}
            if (targetMethod == null) {{
                Method[] methods = Solution.class.getDeclaredMethods();
                if (methods.length > 0) targetMethod = methods[0];
            }}

            Class<?>[] paramTypes = targetMethod.getParameterTypes();
            Object[] argsList = new Object[paramTypes.length];

            for (int i = 0; i < paramTypes.length && i < lines.length; i++) {{
                String l = lines[i].trim();
                if (l.contains("=")) {{
                    l = l.split("=", 2)[1].trim();
                }}
                argsList[i] = parseArg(l, paramTypes[i]);
            }}

            Object result = targetMethod.invoke(solution, argsList);
            printResult(result);
        }} catch (InvocationTargetException ite) {{
            Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
            cause.printStackTrace(System.err);
            System.exit(1);
        }} catch (Throwable t) {{
            t.printStackTrace(System.err);
            System.exit(1);
        }}
    }}

    private static Object parseArg(String str, Class<?> type) {{
        str = str.trim();
        if (type == int[].class) {{
            if (str.startsWith("[")) str = str.substring(1);
            if (str.endsWith("]")) str = str.substring(0, str.length() - 1);
            str = str.trim();
            if (str.isEmpty()) return new int[0];
            String[] parts = str.contains(",") ? str.split(",") : str.split("\\\\s+");
            int[] arr = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {{
                arr[i] = Integer.parseInt(parts[i].trim());
            }}
            return arr;
        }} else if (type == int.class || type == Integer.class) {{
            return Integer.parseInt(str);
        }} else if (type == String.class) {{
            return str.replace("\\"", "");
        }}
        return str;
    }}

    private static void printResult(Object result) {{
        if (result == null) {{
            System.out.println("null");
        }} else if (result instanceof int[]) {{
            System.out.println(Arrays.toString((int[]) result));
        }} else if (result instanceof Collection) {{
            System.out.println(result.toString());
        }} else {{
            System.out.println(result.toString());
        }}
    }}
}}
"""
        with open(runner_path, "w", encoding="utf-8") as f:
            f.write(runner_harness)

        # Compilation stage
        if self.use_docker:
            compile_cmd = [
                "docker", "run", "--rm",
                "-v", f"{mount_dir}:/app",
                "-w", "/app",
                "openjdk:17-slim",
                "javac", "Solution.java", "Runner.java"
            ]
        else:
            javac_bin = shutil.which("javac") or "javac"
            compile_cmd = [javac_bin, solution_path, runner_path]

        comp_proc = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
        if comp_proc.returncode != 0:
            return {
                "status": "Compilation Error",
                "compile_output": comp_proc.stderr or comp_proc.stdout,
                "error_message": comp_proc.stderr or "Java Compilation Failed",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
            }

        # Execution stage
        if self.use_docker:
            cmd = [
                "docker", "run", "--rm", "-i",
                "--net", "none",
                "--memory", f"{self.memory_limit}m",
                "--cpus", "1.0",
                "-v", f"{mount_dir}:/app",
                "-w", "/app",
                "openjdk:17-slim",
                "java", "Runner"
            ]
        else:
            java_bin = shutil.which("java") or "java"
            # cp is the temp directory containing compiled runner
            cmd = [java_bin, "-cp", temp_dir, "Runner"]

        return self._execute_tests(cmd, test_cases)

    def _execute_tests(self, cmd: List[str], test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        passed = 0
        total_time = 0.0
        overall_status = "Accepted"
        first_error = None
        last_stdout = ""
        last_stderr = ""
        results_list = []

        for idx, tc in enumerate(test_cases):
            if hasattr(tc, "input_data"):
                inp = (tc.input_data or "").strip()
                expected = (tc.expected_output or "").strip()
            elif isinstance(tc, dict):
                inp = (tc.get("input_data") or "").strip()
                expected = (tc.get("expected_output") or "").strip()
            else:
                inp = ""
                expected = ""

            start_t = time.time()
            try:
                proc = subprocess.run(
                    cmd,
                    input=inp,
                    capture_output=True,
                    text=True,
                    timeout=self.time_limit,
                )
                elapsed = time.time() - start_t
                total_time += elapsed

                last_stdout = proc.stdout.strip()
                last_stderr = proc.stderr.strip()

                if proc.returncode != 0:
                    overall_status = "Runtime Error"
                    first_error = last_stderr or f"Runtime error code {proc.returncode}"
                    results_list.append({
                        "status": "Runtime Error",
                        "passed": False,
                        "actual": last_stdout,
                        "stderr": last_stderr
                    })
                    break

                if ResultEvaluator.evaluate(last_stdout, expected):
                    passed += 1
                    results_list.append({
                        "status": "Accepted",
                        "passed": True,
                        "actual": last_stdout
                    })
                else:
                    overall_status = "Wrong Answer"
                    first_error = f"Test case failed. Expected: {expected}, Got: {last_stdout}"
                    results_list.append({
                        "status": "Wrong Answer",
                        "passed": False,
                        "actual": last_stdout
                    })
                    break

            except subprocess.TimeoutExpired:
                overall_status = "Time Limit Exceeded"
                first_error = f"Execution exceeded timeout limit of {self.time_limit}s."
                results_list.append({
                    "status": "Time Limit Exceeded",
                    "passed": False
                })
                break
            except Exception as e:
                overall_status = "Runtime Error"
                first_error = str(e)
                break

        return {
            "status": overall_status,
            "error_message": first_error,
            "passed_test_cases": passed,
            "total_test_cases": len(test_cases),
            "execution_time": round(total_time, 3),
            "stdout": last_stdout,
            "stderr": last_stderr,
            "test_results": results_list
        }
