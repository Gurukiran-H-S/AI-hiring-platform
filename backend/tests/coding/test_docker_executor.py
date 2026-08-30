"""
Code Execution Sandbox Tests (Python, JavaScript, Java, C++).
"""

import os
import sys
import pytest

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.code_execution.docker_executor import DockerExecutor
from app.services.code_execution.result_evaluator import ResultEvaluator


@pytest.fixture
def executor():
    return DockerExecutor(time_limit_seconds=3.0)


def test_python_two_sum(executor):
    code = """class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen:
                return [seen[diff], i]
            seen[n] = i
        return []
"""
    test_cases = [
        {"input_data": "nums = [2,7,11,15], target = 9", "expected_output": "[0, 1]"},
        {"input_data": "2 7 11 15\n9", "expected_output": "0 1"},
    ]
    res = executor.run_code("python", code, test_cases, "twoSum")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 2


def test_javascript_two_sum(executor):
    code = """class Solution {
    twoSum(nums, target) {
        const seen = {};
        for (let i = 0; i < nums.length; i++) {
            const diff = target - nums[i];
            if (seen[diff] !== undefined) {
                return [seen[diff], i];
            }
            seen[nums[i]] = i;
        }
        return [];
    }
}
"""
    test_cases = [
        {"input_data": "nums = [2,7,11,15], target = 9", "expected_output": "[0, 1]"},
    ]
    res = executor.run_code("javascript", code, test_cases, "twoSum")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 1


def test_python_reverse_linked_list(executor):
    code = """class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev
"""
    test_cases = [
        {"input_data": "1 2 3 4 5", "expected_output": "5 4 3 2 1"},
        {"input_data": "[1,2,3,4,5]", "expected_output": "[5,4,3,2,1]"},
    ]
    res = executor.run_code("python", code, test_cases, "reverseList")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 2


def test_python_tree_problems(executor):
    code = """class Solution:
    def maxDepth(self, root) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))
"""
    test_cases = [
        {"input_data": "3 9 20 null null 15 7", "expected_output": "3"},
    ]
    res = executor.run_code("python", code, test_cases, "maxDepth")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 1


def test_python_invert_tree(executor):
    code = """class Solution:
    def invertTree(self, root):
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
"""
    test_cases = [
        {"input_data": "4 2 7 1 3 6 9", "expected_output": "4 7 2 9 6 3 1"},
    ]
    res = executor.run_code("python", code, test_cases, "invertTree")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 1


def test_javascript_invert_tree(executor):
    code = """class Solution {
    invertTree(root) {
        if (!root) return null;
        const temp = root.left;
        root.left = this.invertTree(root.right);
        root.right = this.invertTree(temp);
        return root;
    }
}
"""
    test_cases = [
        {"input_data": "4 2 7 1 3 6 9", "expected_output": "4 7 2 9 6 3 1"},
    ]
    res = executor.run_code("javascript", code, test_cases, "invertTree")
    assert res["status"] == "Accepted"
    assert res["passed_test_cases"] == 1


def test_empty_code_rejection(executor):
    res = executor.run_code("python", "", [{"input_data": "1", "expected_output": "1"}])
    assert res["status"] == "Compilation Error"
    assert "cannot be empty" in res["error_message"].lower()


def test_evaluator_preserves_1d_order():
    # Reverse Linked List order check
    assert ResultEvaluator.evaluate("5 4 3 2 1", "5 4 3 2 1") is True
    assert ResultEvaluator.evaluate("[5, 4, 3, 2, 1]", "5 4 3 2 1") is True
    assert ResultEvaluator.evaluate("1 2 3 4 5", "5 4 3 2 1") is False


def test_evaluator_handles_2d_combinations():
    # 3Sum 2D list check
    assert ResultEvaluator.evaluate("[[-1,-1,2],[-1,0,1]]", "-1 -1 2\n-1 0 1") is True
    assert ResultEvaluator.evaluate("[[-1,0,1],[-1,-1,2]]", "[[-1,-1,2],[-1,0,1]]") is True


if __name__ == "__main__":
    pytest.main([__file__])
