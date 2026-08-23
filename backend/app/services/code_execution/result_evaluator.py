import json
import math
import re
from typing import Any

class ResultEvaluator:
    """Normalizes output and evaluates actual vs expected test case results."""

    @staticmethod
    def _parse_val(val: str) -> Any:
        if not val:
            return ""
        val = val.strip()

        # Boolean conversion
        if val.lower() in ("true", "false"):
            return val.lower() == "true"

        # Try JSON parsing
        try:
            parsed = json.loads(val)
            return parsed
        except Exception:
            pass

        # Handle Python literal formats (e.g. None, True, False, tuple)
        try:
            import ast
            parsed = ast.literal_eval(val)
            return parsed
        except Exception:
            pass

        # Handle multiline numbers as 2D list:
        # e.g.
        # -1 -1 2
        # -1 0 1
        lines = [l.strip() for l in val.splitlines() if l.strip()]
        if len(lines) > 1:
            parsed_lines = []
            all_int_lines = True
            for l in lines:
                tokens = l.split()
                if tokens and all(re.match(r'^-?\d+$', t) for t in tokens):
                    parsed_lines.append([int(t) for t in tokens])
                else:
                    all_int_lines = False
                    break
            if all_int_lines and parsed_lines:
                return parsed_lines

        # Handle space-separated integer list on single line (e.g. "0 1" → [0, 1] or "5 4 3 2 1" -> [5, 4, 3, 2, 1])
        tokens = val.split()
        if len(tokens) > 1 and all(re.match(r'^-?\d+$', t) for t in tokens):
            try:
                return [int(t) for t in tokens]
            except Exception:
                pass

        # Handle single integer or float
        try:
            return int(val)
        except ValueError:
            pass
        try:
            return float(val)
        except ValueError:
            pass

        return val

    @classmethod
    def normalize(cls, val: str) -> str:
        if val is None:
            return ""
        if not isinstance(val, str):
            val = str(val)

        parsed = cls._parse_val(val)

        if isinstance(parsed, bool):
            return "true" if parsed else "false"

        if isinstance(parsed, (int, float)):
            return str(parsed)

        if isinstance(parsed, list):
            # Check if this is a 2D list (e.g. 3Sum, Subsets)
            if all(isinstance(sub, (list, tuple)) for sub in parsed) and parsed:
                # Normalize 2D list: sort inner items if numbers, and sort outer list for deterministic order
                try:
                    norm_2d = []
                    for sub in parsed:
                        sub_list = list(sub)
                        try:
                            sub_list = sorted(sub_list)
                        except Exception:
                            pass
                        norm_2d.append(sub_list)
                    norm_2d = sorted(norm_2d, key=lambda x: json.dumps(x, sort_keys=True))
                    return json.dumps(norm_2d)
                except Exception:
                    pass
            # 1D list: preserve original sequence! (e.g. [0, 1] or [5, 4, 3, 2, 1])
            return json.dumps(parsed)

        if isinstance(parsed, dict):
            return json.dumps(parsed, sort_keys=True)

        # Fallback: strip whitespace
        return "".join(str(parsed).split())

    @classmethod
    def evaluate(cls, actual: str, expected: str, precision: float = 1e-5) -> bool:
        if actual is None:
            actual = ""
        if expected is None:
            expected = ""

        # Direct string equality (ignoring leading/trailing whitespace)
        if actual.strip() == expected.strip():
            return True

        norm_actual = cls.normalize(actual)
        norm_expected = cls.normalize(expected)

        if norm_actual == norm_expected:
            return True

        # Try float comparison for numeric results
        try:
            act_float = float(norm_actual)
            exp_float = float(norm_expected)
            return math.isclose(act_float, exp_float, abs_tol=precision)
        except Exception:
            pass

        return False
