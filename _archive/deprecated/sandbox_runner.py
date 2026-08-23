import os
import sys
import time
import json
import tempfile
import subprocess
import shutil
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CodeSandboxRunner:
    """LeetCode-Style Online Judge Execution Engine supporting Function Mode & Standard Input Mode."""

    def __init__(self, time_limit: float = 2.0, memory_limit_mb: int = 256):
        self.time_limit = time_limit
        self.memory_limit_mb = memory_limit_mb

    def run_code(
        self,
        language: str,
        code: str,
        test_cases: List[Dict[str, str]],
        problem_meta: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        clean_code = (code or "").strip()
        if not clean_code or clean_code == "pass":
            return {
                "status": "Compilation Error",
                "error_message": "Code cannot be empty. Please implement the required class/function solution.",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": "Empty Code Error",
            }

        language = language.lower()
        if language not in ["python", "py", "cpp", "c++", "java", "javascript", "js"]:
            return {
                "status": "Compilation Error",
                "error_message": f"Unsupported language: {language}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": "Unsupported Language",
            }

        temp_dir = tempfile.mkdtemp(prefix="leetcode_sandbox_")
        try:
            if language in ["python", "py"]:
                return self._run_python(temp_dir, clean_code, test_cases, problem_meta)
            elif language in ["javascript", "js"]:
                return self._run_javascript(temp_dir, clean_code, test_cases, problem_meta)
            elif language in ["cpp", "c++"]:
                return self._run_cpp(temp_dir, clean_code, test_cases, problem_meta)
            elif language in ["java"]:
                return self._run_java(temp_dir, clean_code, test_cases, problem_meta)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _run_python(self, temp_dir: str, code: str, test_cases: List[Dict[str, str]], meta: Dict[str, Any]) -> Dict[str, Any]:
        func_name = (meta or {}).get("function_name", "twoSum")

        # If user wrote standalone script with input()
        if "input(" in code and "def " not in code and "class Solution" not in code:
            file_path = os.path.join(temp_dir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            return self._execute_test_cases([sys.executable, file_path], test_cases)

        # Python Function Mode Driver Harness
        driver_harness = f"""
import sys
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
                    parsed_args.append(line)

        sol = Solution() if 'Solution' in globals() else None
        method = getattr(sol, "{func_name}", None) if sol else globals().get("{func_name}")

        if not method and 'Solution' in globals():
            methods = [m for m in dir(Solution) if not m.startswith('__')]
            if methods:
                method = getattr(sol, methods[0])

        if not method:
            raise AttributeError("Could not find required solution method in Solution class.")

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

        cmd = [sys.executable, file_path]
        return self._execute_test_cases(cmd, test_cases)

    def _run_javascript(self, temp_dir: str, code: str, test_cases: List[Dict[str, str]], meta: Dict[str, Any]) -> Dict[str, Any]:
        func_name = (meta or {}).get("function_name", "twoSum")

        driver_harness = f"""
const fs = require('fs');

// --- CANDIDATE SOLUTION ---
{code}

// --- DRIVER HARNESS ---
const rawInput = fs.readFileSync(0, 'utf-8').trim();
if (rawInput) {{
    const lines = rawInput.split('\\n').map(l => l.trim()).filter(Boolean);
    const parsedArgs = lines.map(line => {{
        let str = line.includes('=') ? line.split('=')[1].trim() : line;
        try {{ return JSON.parse(str); }} catch(e) {{ return str; }}
    }});

    let sol = typeof Solution !== 'undefined' ? new Solution() : null;
    let res;
    if (sol && typeof sol['{func_name}'] === 'function') {{
        res = sol['{func_name}'](...parsedArgs);
    }} else if (typeof {func_name} === 'function') {{
        res = {func_name}(...parsedArgs);
    }} else {{
        throw new Error("Method '{func_name}' not found");
    }}

    console.log(typeof res === 'object' ? JSON.stringify(res) : res);
}}
"""
        file_path = os.path.join(temp_dir, "solution.js")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(driver_harness)

        node_bin = shutil.which("node") or "node"
        cmd = [node_bin, file_path]
        return self._execute_test_cases(cmd, test_cases)

    def _run_cpp(self, temp_dir: str, code: str, test_cases: List[Dict[str, str]], meta: Dict[str, Any]) -> Dict[str, Any]:
        file_path = os.path.join(temp_dir, "solution.cpp")
        exe_path = os.path.join(temp_dir, "solution.exe" if os.name == "nt" else "solution")

        if "int main(" in code:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
        else:
            driver_harness = f"""
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
using namespace std;

{code}

int main() {{
    // Standalone C++ Driver
    Solution sol;
    return 0;
}}
"""
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(driver_harness)

        compile_cmd = ["g++", "-O2", file_path, "-o", exe_path]
        try:
            comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=10)
            if comp.returncode != 0:
                return {
                    "status": "Compilation Error",
                    "error_message": comp.stderr or "C++ Compilation Failed",
                    "passed_test_cases": 0,
                    "total_test_cases": len(test_cases),
                    "execution_time": 0.0,
                    "stdout": "",
                    "stderr": comp.stderr,
                }
        except Exception as e:
            return {
                "status": "Compilation Error",
                "error_message": str(e),
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": str(e),
            }

        return self._execute_test_cases([exe_path], test_cases)

    def _run_java(self, temp_dir: str, code: str, test_cases: List[Dict[str, str]], meta: Dict[str, Any]) -> Dict[str, Any]:
        func_name = (meta or {}).get("function_name", "threeSum")

        # STANDARD_INPUT_MODE: If candidate code already has main()
        if "public static void main(" in code:
            file_path = os.path.join(temp_dir, "Solution.java")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            compile_cmd = ["javac", file_path]
            try:
                comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=10)
                if comp.returncode != 0:
                    return {
                        "status": "Compilation Error",
                        "error_message": comp.stderr or "Java Compilation Error",
                        "passed_test_cases": 0,
                        "total_test_cases": len(test_cases),
                        "execution_time": 0.0,
                        "stdout": "",
                        "stderr": comp.stderr,
                    }
            except Exception as e:
                return {
                    "status": "Compilation Error",
                    "error_message": str(e),
                    "passed_test_cases": 0,
                    "total_test_cases": len(test_cases),
                    "execution_time": 0.0,
                    "stdout": "",
                    "stderr": str(e),
                }

            run_cmd = ["java", "-cp", temp_dir, "Solution"]
            return self._execute_test_cases(run_cmd, test_cases)

        # FUNCTION_MODE: Candidate submits Solution class without main()
        solution_path = os.path.join(temp_dir, "Solution.java")
        runner_path = os.path.join(temp_dir, "Runner.java")

        with open(solution_path, "w", encoding="utf-8") as f:
            f.write(code)

        runner_code = f"""import java.io.*;
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
            if (targetMethod == null) {{
                System.err.println("Method '{func_name}' not found in Solution class.");
                System.exit(1);
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
            str = str.replace("[", "").replace("]", "").replace(" ", "");
            if (str.isEmpty()) return new int[0];
            String[] parts = str.split(",");
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
            f.write(runner_code)

        javac_bin = shutil.which("javac") or "javac"
        java_bin = shutil.which("java") or "java"

        compile_cmd = [javac_bin, "-cp", temp_dir, solution_path, runner_path]
        try:
            comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
            if comp.returncode != 0:
                return {
                    "status": "Compilation Error",
                    "error_message": comp.stderr or "Java Compilation Failed",
                    "passed_test_cases": 0,
                    "total_test_cases": len(test_cases),
                    "execution_time": 0.0,
                    "stdout": "",
                    "stderr": comp.stderr,
                }
        except Exception as e:
            return {
                "status": "Compilation Error",
                "error_message": f"Java Compiler Error: {str(e)}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": str(e),
            }

        run_cmd = [java_bin, "-cp", temp_dir, "Runner"]
        return self._execute_test_cases(run_cmd, test_cases)

    def _execute_test_cases(self, cmd: List[str], test_cases: List[Dict[str, str]]) -> Dict[str, Any]:
        passed = 0
        total_time = 0.0
        overall_status = "Accepted"
        first_error = None
        last_stdout = ""
        last_stderr = ""

        for idx, tc in enumerate(test_cases):
            inp = (tc.get("input_data") or "").strip()
            expected_raw = (tc.get("expected_output") or "").strip()

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
                    first_error = last_stderr or f"Runtime Error (Exit Code {proc.returncode})"
                    break

                actual_norm = self._normalize_output(last_stdout)
                expected_norm = self._normalize_output(expected_raw)

                if actual_norm == expected_norm:
                    passed += 1
                else:
                    overall_status = "Wrong Answer"
                    first_error = f"Test Case {idx + 1} Failed:\nInput: {inp}\nExpected: {expected_norm}\nGot: {actual_norm}"
                    break

            except subprocess.TimeoutExpired:
                overall_status = "Time Limit Exceeded"
                first_error = f"Test Case {idx + 1} Exceeded Time Limit ({self.time_limit}s)."
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
        }

    def _normalize_output(self, val: str) -> str:
        """Normalizes spaces, brackets, and inner sublist ordering for deterministic LeetCode-style comparison."""
        if not val:
            return ""
        val = val.strip().replace("\r\n", "\n")
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                try:
                    sorted_list = [sorted(sub) if isinstance(sub, list) and all(isinstance(x, (int, float, str)) for x in sub) else sub for sub in parsed]
                    if all(isinstance(x, list) for x in sorted_list):
                        sorted_list = sorted(sorted_list)
                    return json.dumps(sorted_list)
                except Exception:
                    pass
            return json.dumps(parsed)
        except Exception:
            return val.replace(" ", "")
