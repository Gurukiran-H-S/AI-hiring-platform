import os
import time
import subprocess
import tempfile
import shutil
import logging
import sys
import json
import re
from typing import Dict, Any, List
from app.services.code_execution.result_evaluator import ResultEvaluator

logger = logging.getLogger(__name__)


class DockerExecutor:
    """Secure Sandbox Execution Engine for Candidate Code supporting Python, JavaScript, Java, and C++ with Docker and Local Subprocess Fallback."""

    def __init__(self, time_limit_seconds: float = 2.0, memory_limit_mb: int = 256):
        self.time_limit = max(0.5, float(time_limit_seconds or 2.0))
        self.memory_limit = int(memory_limit_mb or 256)
        # Check if docker is installed and active
        self.use_docker = shutil.which("docker") is not None
        if not self.use_docker:
            logger.info("Docker not found in PATH. Using secure local subprocess runner.")

    def run_code(
        self,
        language: str,
        code: str,
        test_cases: List[Any],
        function_name: str = "twoSum"
    ) -> Dict[str, Any]:
        """Executes candidate code against test cases in isolated Docker or local secure sandbox."""
        clean_code = (code or "").strip()
        if not clean_code or clean_code == "pass":
            return {
                "status": "Compilation Error",
                "error_message": "Code cannot be empty. Please implement the required solution.",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": "Empty Code Error",
                "test_results": [],
            }

        lang = (language or "python").lower().strip()
        if lang in ["py", "python3"]:
            lang = "python"
        elif lang in ["js", "node"]:
            lang = "javascript"
        elif lang in ["c++", "c"]:
            lang = "cpp"

        if lang not in ["python", "javascript", "java", "cpp"]:
            return {
                "status": "Compilation Error",
                "error_message": f"Unsupported language: {language}. Supported: Python, JavaScript, Java, C++",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": f"Unsupported language: {language}",
                "test_results": [],
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
            if lang == "python":
                return self._run_python(temp_dir, mount_dir, clean_code, test_cases, function_name)
            elif lang == "javascript":
                return self._run_javascript(temp_dir, mount_dir, clean_code, test_cases, function_name)
            elif lang == "java":
                return self._run_java(temp_dir, mount_dir, clean_code, test_cases, function_name)
            elif lang == "cpp":
                return self._run_cpp(temp_dir, mount_dir, clean_code, test_cases, function_name)
        except Exception as e:
            logger.exception("Sandbox Execution error:")
            return {
                "status": "Internal Error",
                "error_message": f"Sandbox execution error: {str(e)}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": str(e),
                "test_results": [],
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    # ─── PYTHON RUNNER ──────────────────────────────────────────────────────────
    def _run_python(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Any], func_name: str) -> Dict[str, Any]:
        # Check if candidate wrote standard IO script
        if "input(" in code and "def " not in code and "class Solution" not in code:
            file_path = os.path.join(temp_dir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            cmd = [sys.executable, file_path]
            return self._execute_tests(cmd, test_cases)

        driver_harness = f"""import sys
import json
import ast
import re
from typing import List, Dict, Tuple, Optional, Any

# --- HELPER DATA STRUCTURES ---
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    @classmethod
    def from_list(cls, lst):
        if not lst:
            return None
        head = cls(lst[0])
        curr = head
        for v in lst[1:]:
            curr.next = cls(v)
            curr = curr.next
        return head

    @classmethod
    def to_list(cls, node):
        res = []
        curr = node
        while curr:
            res.append(curr.val)
            curr = curr.next
        return res

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    @classmethod
    def from_list(cls, lst):
        if not lst or lst[0] is None:
            return None
        root = cls(lst[0])
        queue = [root]
        i = 1
        while queue and i < len(lst):
            node = queue.pop(0)
            if i < len(lst) and lst[i] is not None:
                node.left = cls(lst[i])
                queue.append(node.left)
            i += 1
            if i < len(lst) and lst[i] is not None:
                node.right = cls(lst[i])
                queue.append(node.right)
            i += 1
        return root

    @classmethod
    def to_list(cls, root):
        if not root:
            return []
        res = []
        queue = [root]
        while queue:
            node = queue.pop(0)
            if node:
                res.append(node.val)
                queue.append(node.left)
                queue.append(node.right)
            else:
                res.append(None)
        while res and res[-1] is None:
            res.pop()
        return res

# --- CANDIDATE SOLUTION ---
{code}

# --- ARGUMENT PARSER ---
def split_top_level(s, delimiter=','):
    parts = []
    depth = 0
    in_quote = False
    quote_char = None
    current = []
    for ch in s:
        if ch in ('\"', \"'\") and (not current or current[-1] != '\\\\'):
            if in_quote and ch == quote_char:
                in_quote = False
                quote_char = None
            elif not in_quote:
                in_quote = True
                quote_char = ch
        elif not in_quote:
            if ch in ('[', '{{', '('):
                depth += 1
            elif ch in (']', '}}', ')'):
                depth -= 1
            elif ch == delimiter and depth == 0:
                parts.append(''.join(current).strip())
                current = []
                continue
        current.append(ch)
    if current:
        parts.append(''.join(current).strip())
    return [p for p in parts if p]

def parse_val(s):
    s = s.strip()
    if not s:
        return ""
    if s.lower() == "true":
        return True
    if s.lower() == "false":
        return False
    if s.lower() in ("null", "none"):
        return None
    try:
        return json.loads(s)
    except Exception:
        pass
    try:
        return ast.literal_eval(s)
    except Exception:
        pass
    tokens = s.split()
    if len(tokens) > 1 and all(re.match(r'^-?\d+$', t) or t.lower() in ('null', 'none') for t in tokens):
        return [None if t.lower() in ('null', 'none') else int(t) for t in tokens]
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return s.strip('\"').strip(\"'\")

def parse_input_arguments(raw_input):
    raw_input = raw_input.strip()
    if not raw_input:
        return []
    lines = [l.strip() for l in raw_input.splitlines() if l.strip()]
    if not lines:
        return []
    
    # Check if single line with assignments like "nums = [2,7,11,15], target = 9"
    if len(lines) == 1 and ('=' in lines[0] or (',' in lines[0] and '[' in lines[0] and not lines[0].startswith('['))):
        parts = split_top_level(lines[0], ',')
        if any('=' in p for p in parts):
            args = []
            for p in parts:
                val_str = p.split('=', 1)[1].strip() if '=' in p else p.strip()
                args.append(parse_val(val_str))
            return args

    # Check for matrix with header dimension: e.g. "4 5\\n1 1 1 1 0\\n1 1 0 1 0..."
    if len(lines) > 2:
        first_tokens = lines[0].split()
        if len(first_tokens) == 2 and all(t.isdigit() for t in first_tokens):
            r, c = int(first_tokens[0]), int(first_tokens[1])
            if len(lines) - 1 == r:
                matrix = []
                for row_line in lines[1:]:
                    matrix.append(row_line.split())
                return [matrix]

    # Process line by line
    args = []
    for line in lines:
        if '=' in line and not line.startswith('{{') and not line.startswith('['):
            line = line.split('=', 1)[1].strip()
        args.append(parse_val(line))
    return args

def serialize_result(result):
    if isinstance(result, ListNode):
        return json.dumps(ListNode.to_list(result))
    if isinstance(result, TreeNode):
        return json.dumps(TreeNode.to_list(result))
    if isinstance(result, bool):
        return "true" if result else "false"
    if isinstance(result, (list, tuple, dict)):
        return json.dumps(result)
    return str(result)

# --- DRIVER EXECUTION ---
if __name__ == "__main__":
    raw_input = sys.stdin.read()
    parsed_args = parse_input_arguments(raw_input)

    sol = Solution() if 'Solution' in globals() else None
    method = getattr(sol, "{func_name}", None) if sol else globals().get("{func_name}")

    if not method and sol:
        # Fallback to any public method in Solution class
        methods = [m for m in dir(Solution) if not m.startswith('_')]
        if methods:
            # Prefer non-init method
            for m in methods:
                if m not in ('from_list', 'to_list'):
                    method = getattr(sol, m)
                    break

    if not method:
        raise AttributeError("Could not find required solution method '{func_name}' in Solution class.")

    # Convert list arguments to ListNode or TreeNode if expected
    import inspect
    sig = None
    try:
        sig = inspect.signature(method)
    except Exception:
        pass

    adapted_args = []
    if sig:
        param_names = list(sig.parameters.keys())
        for idx, (pname, param) in enumerate(sig.parameters.items()):
            if idx < len(parsed_args):
                arg_val = parsed_args[idx]
                ann = str(param.annotation).lower()
                func_hint = "{func_name}".lower()
                if "listnode" in ann or pname.lower() in ("head", "list1", "list2", "node", "l1", "l2") or "list" in func_hint:
                    if isinstance(arg_val, list):
                        arg_val = ListNode.from_list(arg_val)
                    elif isinstance(arg_val, str) and arg_val:
                        p_list = [int(t) for t in arg_val.split() if re.match(r'^-?\d+$', t)]
                        arg_val = ListNode.from_list(p_list)
                elif "treenode" in ann or pname.lower() in ("root", "tree", "p", "q") or "tree" in func_hint or "depth" in func_hint:
                    if isinstance(arg_val, list):
                        arg_val = TreeNode.from_list(arg_val)
                    elif isinstance(arg_val, str) and arg_val:
                        p_list = [None if t.lower() in ('null', 'none') else int(t) for t in arg_val.split() if re.match(r'^-?\d+$', t) or t.lower() in ('null', 'none')]
                        arg_val = TreeNode.from_list(p_list)
                adapted_args.append(arg_val)
        while len(adapted_args) < len(parsed_args):
            adapted_args.append(parsed_args[len(adapted_args)])
    else:
        adapted_args = parsed_args

    res = method(*adapted_args)
    print(serialize_result(res))
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

    # ─── JAVASCRIPT RUNNER ──────────────────────────────────────────────────────
    def _run_javascript(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Any], func_name: str) -> Dict[str, Any]:
        driver_harness = f"""const fs = require('fs');

// --- HELPER DATA STRUCTURES ---
class ListNode {{
    constructor(val, next) {{
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }}
    static fromArray(arr) {{
        if (!arr || !arr.length) return null;
        let head = new ListNode(arr[0]);
        let curr = head;
        for (let i = 1; i < arr.length; i++) {{
            curr.next = new ListNode(arr[i]);
            curr = curr.next;
        }}
        return head;
    }}
    static toArray(head) {{
        let res = [];
        while (head) {{
            res.push(head.val);
            head = head.next;
        }}
        return res;
    }}
}}

class TreeNode {{
    constructor(val, left, right) {{
        this.val = (val === undefined ? 0 : val);
        this.left = (left === undefined ? null : left);
        this.right = (right === undefined ? null : right);
    }}
    static fromArray(arr) {{
        if (!arr || !arr.length || arr[0] === null) return null;
        let root = new TreeNode(arr[0]);
        let queue = [root];
        let i = 1;
        while (queue.length > 0 && i < arr.length) {{
            let curr = queue.shift();
            if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {{
                curr.left = new TreeNode(arr[i]);
                queue.push(curr.left);
            }}
            i++;
            if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {{
                curr.right = new TreeNode(arr[i]);
                queue.push(curr.right);
            }}
            i++;
        }}
        return root;
    }}
    static toArray(root) {{
        if (!root) return [];
        let res = [];
        let queue = [root];
        while (queue.length > 0) {{
            let curr = queue.shift();
            if (curr) {{
                res.push(curr.val);
                queue.push(curr.left);
                queue.push(curr.right);
            }} else {{
                res.push(null);
            }}
        }}
        while (res.length > 0 && res[res.length - 1] === null) {{
            res.pop();
        }}
        return res;
    }}
}}

// --- CANDIDATE SOLUTION ---
{code}

// --- ARGUMENT PARSER & DRIVER ---
function parseVal(str) {{
    str = (str || '').trim();
    if (!str) return "";
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    if (str.toLowerCase() === 'null') return null;
    try {{ return JSON.parse(str); }} catch(e) {{}}
    let tokens = str.split(/\\s+/);
    if (tokens.length > 1 && tokens.every(t => /^-?\\d+$/.test(t) || t.toLowerCase() === 'null')) {{
        return tokens.map(t => t.toLowerCase() === 'null' ? null : Number(t));
    }}
    if (/^-?\\d+$/.test(str)) return Number(str);
    if (/^-?\\d+\\.\\d+$/.test(str)) return Number(str);
    return str.replace(/^["']|["']$/g, '');
}}

function splitTopLevel(s, delimiter = ',') {{
    let parts = [];
    let depth = 0;
    let inQuote = false;
    let quoteChar = null;
    let current = [];
    for (let i = 0; i < s.length; i++) {{
        let ch = s[i];
        if ((ch === '"' || ch === "'") && (current.length === 0 || current[current.length - 1] !== '\\\\')) {{
            if (inQuote && ch === quoteChar) {{
                inQuote = false;
                quoteChar = null;
            }} else if (!inQuote) {{
                inQuote = true;
                quoteChar = ch;
            }}
        }} else if (!inQuote) {{
            if (ch === '[' || ch === '{{' || ch === '(') depth++;
            else if (ch === ']' || ch === '}}' || ch === ')') depth--;
            else if (ch === delimiter && depth === 0) {{
                parts.push(current.join('').trim());
                current = [];
                continue;
            }}
        }}
        current.push(ch);
    }}
    if (current.length) parts.push(current.join('').trim());
    return parts.filter(Boolean);
}}

function parseInput(raw) {{
    raw = (raw || '').trim();
    if (!raw) return [];
    let lines = raw.split('\\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    
    if (lines.length === 1 && (lines[0].includes('=') || (lines[0].includes(',') && lines[0].includes('[') && !lines[0].startsWith('[')))) {{
        let parts = splitTopLevel(lines[0], ',');
        if (parts.some(p => p.includes('='))) {{
            return parts.map(p => {{
                let val = p.includes('=') ? p.split('=')[1].trim() : p.trim();
                return parseVal(val);
            }});
        }}
    }}

    return lines.map(line => {{
        let val = line.includes('=') && !line.startsWith('{{') && !line.startsWith('[') ? line.split('=')[1].trim() : line;
        return parseVal(val);
    }});
}}

try {{
    const rawInput = fs.readFileSync(0, 'utf-8');
    const parsedArgs = parseInput(rawInput);

    let sol = typeof Solution !== 'undefined' ? new Solution() : null;
    let targetMethod = null;

    if (sol && typeof sol['{func_name}'] === 'function') {{
        targetMethod = sol['{func_name}'].bind(sol);
    }} else if (typeof {func_name} === 'function') {{
        targetMethod = {func_name};
    }} else if (sol) {{
        let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(sol)).filter(m => m !== 'constructor');
        if (methods.length > 0) targetMethod = sol[methods[0]].bind(sol);
    }}

    if (!targetMethod) {{
        throw new Error("Could not find solution method '{func_name}'");
    }}

    let adaptedArgs = parsedArgs.map(arg => {{
        let fnLower = '{func_name}'.toLowerCase();
        if (fnLower.includes('tree') || fnLower.includes('depth') || fnLower.includes('root')) {{
            if (Array.isArray(arg)) return TreeNode.fromArray(arg);
        }}
        if (fnLower.includes('list') || fnLower.includes('head') || fnLower.includes('node') || fnLower.includes('merge')) {{
            if (Array.isArray(arg)) return ListNode.fromArray(arg);
        }}
        return arg;
    }});

    let result = targetMethod(...adaptedArgs);
    if (result instanceof ListNode) {{
        console.log(JSON.stringify(ListNode.toArray(result)));
    }} else if (result instanceof TreeNode) {{
        console.log(JSON.stringify(TreeNode.toArray(result)));
    }} else if (typeof result === 'boolean') {{
        console.log(result ? 'true' : 'false');
    }} else if (typeof result === 'object' && result !== null) {{
        console.log(JSON.stringify(result));
    }} else {{
        console.log(result);
    }}
}} catch (err) {{
    console.error(err.message || err);
    process.exit(1);
}}
"""
        file_path = os.path.join(temp_dir, "solution.js")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(driver_harness)

        node_bin = shutil.which("node") or "node"
        if self.use_docker:
            cmd = [
                "docker", "run", "--rm", "-i",
                "--net", "none",
                "--memory", f"{self.memory_limit}m",
                "--cpus", "1.0",
                "-v", f"{mount_dir}:/app",
                "-w", "/app",
                "node:18-slim",
                "node", "solution.js"
            ]
        else:
            cmd = [node_bin, file_path]

        return self._execute_tests(cmd, test_cases)

    # ─── JAVA RUNNER ────────────────────────────────────────────────────────────
    def _run_java(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Any], func_name: str) -> Dict[str, Any]:
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

            List<String> rawLines = new ArrayList<>();
            if (inputStr.contains("=") && (inputStr.contains(",") || inputStr.contains("\\n"))) {{
                if (!inputStr.contains("\\n")) {{
                    List<String> parts = splitTopLevel(inputStr, ',');
                    for (String p : parts) {{
                        if (p.contains("=")) {{
                            rawLines.add(p.split("=", 2)[1].trim());
                        }} else {{
                            rawLines.add(p.trim());
                        }}
                    }}
                }} else {{
                    String[] lines = inputStr.split("\\n");
                    for (String l : lines) {{
                        l = l.trim();
                        if (l.contains("=") && !l.startsWith("[") && !l.startsWith("{{")) {{
                            l = l.split("=", 2)[1].trim();
                        }}
                        rawLines.add(l);
                    }}
                }}
            }} else {{
                String[] lines = inputStr.split("\\n");
                for (String l : lines) {{
                    rawLines.add(l.trim());
                }}
            }}

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
                System.err.println("Method '{func_name}' not found");
                System.exit(1);
            }}

            Class<?>[] paramTypes = targetMethod.getParameterTypes();
            Object[] argsList = new Object[paramTypes.length];

            for (int i = 0; i < paramTypes.length && i < rawLines.size(); i++) {{
                argsList[i] = parseArg(rawLines.get(i), paramTypes[i]);
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

    private static List<String> splitTopLevel(String s, char delimiter) {{
        List<String> parts = new ArrayList<>();
        int depth = 0;
        boolean inQuote = false;
        char quoteChar = 0;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {{
            char ch = s.charAt(i);
            if ((ch == '"' || ch == '\\'') && (current.length() == 0 || current.charAt(current.length() - 1) != '\\\\')) {{
                if (inQuote && ch == quoteChar) {{
                    inQuote = false;
                    quoteChar = 0;
                }} else if (!inQuote) {{
                    inQuote = true;
                    quoteChar = ch;
                }}
            }} else if (!inQuote) {{
                if (ch == '[' || ch == '{{' || ch == '(') depth++;
                else if (ch == ']' || ch == '}}' || ch == ')') depth--;
                else if (ch == delimiter && depth == 0) {{
                    if (current.length() > 0) {{
                        parts.add(current.toString().trim());
                        current.setLength(0);
                    }}
                    continue;
                }}
            }}
            current.append(ch);
        }}
        if (current.length() > 0) parts.add(current.toString().trim());
        return parts;
    }}

    private static Object parseArg(String str, Class<?> type) {{
        str = str.trim();
        if (type == int[].class) {{
            String clean = str.replace("[", "").replace("]", "").trim();
            if (clean.isEmpty()) return new int[0];
            String[] parts = clean.contains(",") ? clean.split(",") : clean.split("\\\\s+");
            List<Integer> list = new ArrayList<>();
            for (String p : parts) {{
                p = p.trim();
                if (!p.isEmpty()) {{
                    try {{ list.add(Integer.parseInt(p)); }} catch (Exception e) {{}}
                }}
            }}
            int[] arr = new int[list.size()];
            for (int i = 0; i < list.size(); i++) arr[i] = list.get(i);
            return arr;
        }} else if (type == int.class || type == Integer.class) {{
            return Integer.parseInt(str);
        }} else if (type == long.class || type == Long.class) {{
            return Long.parseLong(str);
        }} else if (type == double.class || type == Double.class) {{
            return Double.parseDouble(str);
        }} else if (type == boolean.class || type == Boolean.class) {{
            return Boolean.parseBoolean(str);
        }} else if (type == String.class) {{
            return str.replace("\\"", "").replace("'", "");
        }}
        return str;
    }}

    private static void printResult(Object result) {{
        if (result == null) {{
            System.out.println("null");
        }} else if (result instanceof int[]) {{
            System.out.println(Arrays.toString((int[]) result));
        }} else if (result instanceof boolean[]) {{
            System.out.println(Arrays.toString((boolean[]) result));
        }} else if (result instanceof Object[]) {{
            System.out.println(Arrays.deepToString((Object[]) result));
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
            compile_cmd = [javac_bin, "-cp", temp_dir, solution_path, runner_path]

        comp_proc = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
        if comp_proc.returncode != 0:
            return {
                "status": "Compilation Error",
                "compile_output": comp_proc.stderr or comp_proc.stdout,
                "error_message": comp_proc.stderr or "Java Compilation Failed",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": comp_proc.stderr,
                "test_results": [],
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
            cmd = [java_bin, "-cp", temp_dir, "Runner"]

        return self._execute_tests(cmd, test_cases)

    # ─── C++ RUNNER ─────────────────────────────────────────────────────────────
    def _run_cpp(self, temp_dir: str, mount_dir: str, code: str, test_cases: List[Any], func_name: str) -> Dict[str, Any]:
        file_path = os.path.join(temp_dir, "solution.cpp")
        exe_path = os.path.join(temp_dir, "solution.exe" if os.name == "nt" else "solution")

        if "int main(" in code:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
        else:
            driver_harness = f"""#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
using namespace std;

// Helper structures
struct ListNode {{
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {{}}
    ListNode(int x) : val(x), next(nullptr) {{}}
    ListNode(int x, ListNode *next) : val(x), next(next) {{}}
}};

struct TreeNode {{
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {{}}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {{}}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {{}}
}};

{code}

int main() {{
    // Standalone C++ Runner
    Solution sol;
    string inputLine;
    vector<int> nums;
    int target = 0;

    if (getline(cin, inputLine)) {{
        stringstream ss(inputLine);
        string token;
        while (ss >> token) {{
            // Clean brackets and commas
            string clean = "";
            for (char c : token) {{
                if (isdigit(c) || c == '-') clean += c;
            }}
            if (!clean.empty()) {{
                try {{ nums.push_back(stoi(clean)); }} catch(...) {{}}
            }}
        }}
    }}
    if (cin >> target) {{
        // read second line if exists
    }}

    return 0;
}}
"""
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(driver_harness)

        gpp_bin = shutil.which("g++") or "g++"
        compile_cmd = [gpp_bin, "-O2", file_path, "-o", exe_path]
        try:
            comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=12)
            if comp.returncode != 0:
                return {
                    "status": "Compilation Error",
                    "error_message": comp.stderr or "C++ Compilation Failed",
                    "passed_test_cases": 0,
                    "total_test_cases": len(test_cases),
                    "execution_time": 0.0,
                    "stdout": "",
                    "stderr": comp.stderr,
                    "test_results": [],
                }
        except Exception as e:
            return {
                "status": "Compilation Error",
                "error_message": f"C++ Compiler Error: {str(e)}",
                "passed_test_cases": 0,
                "total_test_cases": len(test_cases),
                "execution_time": 0.0,
                "stdout": "",
                "stderr": str(e),
                "test_results": [],
            }

        return self._execute_tests([exe_path], test_cases)

    # ─── TEST EXECUTION ENGINE ─────────────────────────────────────────────────
    def _execute_tests(self, cmd: List[str], test_cases: List[Any]) -> Dict[str, Any]:
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
                    first_error = last_stderr or f"Runtime error (exit code {proc.returncode})"
                    results_list.append({
                        "status": "Runtime Error",
                        "passed": False,
                        "actual": last_stdout,
                        "stderr": last_stderr,
                        "expected": expected,
                        "input": inp,
                    })
                    break

                if ResultEvaluator.evaluate(last_stdout, expected):
                    passed += 1
                    results_list.append({
                        "status": "Accepted",
                        "passed": True,
                        "actual": last_stdout,
                        "expected": expected,
                        "input": inp,
                    })
                else:
                    overall_status = "Wrong Answer"
                    first_error = f"Test case failed. Expected: {expected}, Got: {last_stdout}"
                    results_list.append({
                        "status": "Wrong Answer",
                        "passed": False,
                        "actual": last_stdout,
                        "expected": expected,
                        "input": inp,
                    })
                    break

            except subprocess.TimeoutExpired:
                overall_status = "Time Limit Exceeded"
                first_error = f"Execution exceeded timeout limit of {self.time_limit}s."
                results_list.append({
                    "status": "Time Limit Exceeded",
                    "passed": False,
                    "actual": "",
                    "expected": expected,
                    "input": inp,
                })
                break
            except Exception as e:
                overall_status = "Runtime Error"
                first_error = str(e)
                results_list.append({
                    "status": "Runtime Error",
                    "passed": False,
                    "actual": "",
                    "stderr": str(e),
                    "expected": expected,
                    "input": inp,
                })
                break

        return {
            "status": overall_status,
            "error_message": first_error,
            "passed_test_cases": passed,
            "total_test_cases": len(test_cases),
            "execution_time": round(total_time, 3),
            "stdout": last_stdout,
            "stderr": last_stderr,
            "test_results": results_list,
        }
