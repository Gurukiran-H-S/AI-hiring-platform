import json
import math
import re

class ResultEvaluator:
    """Normalizes output and evaluates actual vs expected test case results."""

    @staticmethod
    def normalize(val: str) -> str:
        if not val:
            return ""
        # Remove trailing/leading spaces and carriage returns
        val = val.strip().replace("\r\n", "\n").replace("\r", "\n")

        # Try JSON parsing (handles [0, 1], {"a": 1}, true, false, etc.)
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                try:
                    # Normalise inner lists (for 2D array problems)
                    normalized = [
                        sorted(sub) if isinstance(sub, list) and all(isinstance(x, (int, float, str)) for x in sub)
                        else sub for sub in parsed
                    ]
                    if all(isinstance(x, list) for x in normalized):
                        normalized = sorted(normalized, key=str)
                    return json.dumps(normalized)
                except Exception:
                    pass
            return json.dumps(parsed, sort_keys=True)
        except Exception:
            pass

        # Handle space-separated integer list (e.g. "0 1" → [0, 1])
        tokens = val.split()
        if len(tokens) > 1 and all(re.match(r'^-?\d+$', t) for t in tokens):
            try:
                as_list = [int(t) for t in tokens]
                return json.dumps(sorted(as_list))
            except Exception:
                pass

        # Handle single integer or float
        try:
            return json.dumps(int(val))
        except ValueError:
            pass
        try:
            return json.dumps(float(val))
        except ValueError:
            pass

        # Final fallback: strip all whitespace for character-level comparison
        return "".join(val.split())

    @classmethod
    def evaluate(cls, actual: str, expected: str, precision: float = 1e-5) -> bool:
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
