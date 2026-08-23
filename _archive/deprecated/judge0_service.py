import requests
import time
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.services.sandbox_runner import CodeSandboxRunner

logger = logging.getLogger(__name__)

LANGUAGE_ID_MAP = {
    "python": 71,       # Python (3.8.1)
    "py": 71,
    "cpp": 54,          # C++ (GCC 9.2.0)
    "c++": 54,
    "java": 62,         # Java (OpenJDK 13.0.1)
    "javascript": 63,   # JavaScript (Node.js 12.14.0)
    "js": 63,
}

class Judge0Service:
    """Official Judge0 Execution Engine Service with Token Polling & Fallback."""

    def __init__(self):
        self.base_url = (getattr(settings, "JUDGE0_URL", None) or "http://localhost:2358").rstrip("/")
        self.api_key = getattr(settings, "JUDGE0_API_KEY", None)
        self.fallback_runner = CodeSandboxRunner()

    def get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-Auth-Token"] = self.api_key
            headers["X-RapidAPI-Key"] = self.api_key
        return headers

    def is_available(self) -> bool:
        """Check if Judge0 service is reachable."""
        try:
            res = requests.get(f"{self.base_url}/system_info", headers=self.get_headers(), timeout=1.5)
            return res.status_code == 200
        except Exception:
            return False

    def submit_and_poll(
        self,
        language: str,
        source_code: str,
        stdin: str = "",
        expected_output: str = "",
        cpu_time_limit: float = 2.0,
        memory_limit_mb: int = 256
    ) -> Dict[str, Any]:
        """Submit job to Judge0 API, poll token, and return normalized execution result."""
        lang_id = LANGUAGE_ID_MAP.get(language.lower(), 71)

        # Check if Judge0 is active; if not, use local sandbox
        if not self.is_available():
            logger.info("Judge0 service not reachable; falling back to local CodeSandboxRunner.")
            test_case = [{"input_data": stdin, "expected_output": expected_output}]
            return self.fallback_runner.run_code(language, source_code, test_case)

        url = f"{self.base_url}/submissions/?base64_encoded=false"
        payload = {
            "source_code": source_code,
            "language_id": lang_id,
            "stdin": stdin,
            "expected_output": expected_output,
            "cpu_time_limit": cpu_time_limit,
            "memory_limit": memory_limit_mb * 1024,
        }

        try:
            response = requests.post(url, json=payload, headers=self.get_headers(), timeout=5)
            if response.status_code not in [200, 201]:
                logger.error(f"Judge0 submit failed: {response.text}")
                test_case = [{"input_data": stdin, "expected_output": expected_output}]
                return self.fallback_runner.run_code(language, source_code, test_case)

            token = response.json().get("token")
            if not token:
                test_case = [{"input_data": stdin, "expected_output": expected_output}]
                return self.fallback_runner.run_code(language, source_code, test_case)

            # Poll result with token (max 10 retries = 5s)
            poll_url = f"{self.base_url}/submissions/{token}?base64_encoded=false"
            for _ in range(10):
                time.sleep(0.5)
                poll_res = requests.get(poll_url, headers=self.get_headers(), timeout=3)
                if poll_res.status_code == 200:
                    data = poll_res.json()
                    status_id = data.get("status", {}).get("id")
                    # Status IDs: 1 = In Queue, 2 = Processing
                    if status_id not in [1, 2]:
                        return self._format_judge0_response(data, token)

            # Polling timeout fallback
            test_case = [{"input_data": stdin, "expected_output": expected_output}]
            return self.fallback_runner.run_code(language, source_code, test_case)

        except Exception as e:
            logger.error(f"Judge0 execution exception: {e}")
            test_case = [{"input_data": stdin, "expected_output": expected_output}]
            return self.fallback_runner.run_code(language, source_code, test_case)

    def _format_judge0_response(self, data: Dict[str, Any], token: str) -> Dict[str, Any]:
        status_desc = data.get("status", {}).get("description", "Accepted")
        stdout = data.get("stdout") or ""
        stderr = data.get("stderr") or data.get("compile_output") or ""
        exec_time = float(data.get("time") or 0.0)
        memory_used = float(data.get("memory") or 0.0) / 1024.0  # KB to MB

        verdict = "Accepted"
        if "Time Limit Exceeded" in status_desc:
            verdict = "Time Limit Exceeded"
        elif "Compilation Error" in status_desc or "Compile" in status_desc:
            verdict = "Compilation Error"
        elif "Wrong Answer" in status_desc:
            verdict = "Wrong Answer"
        elif status_desc != "Accepted":
            verdict = "Runtime Error"

        return {
            "status": verdict,
            "judge_token": token,
            "execution_time": round(exec_time, 3),
            "memory_mb": round(memory_used, 1),
            "stdout": stdout.strip(),
            "stderr": stderr.strip(),
            "error_message": stderr.strip() if verdict != "Accepted" else None,
        }
