import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.sandbox_runner import CodeSandboxRunner

def main():
    print("==================================================")
    print("MASTER CODING ASSESSMENT ENGINE TEST SUITE")
    print("==================================================")
    runner = CodeSandboxRunner()

    # TEST 1: Two Sum Java (Function Mode)
    print("\nTEST 1: Two Sum Java (Function Mode)...")
    two_sum_java = """import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[]{map.get(diff), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
"""
    tc1 = [{"input_data": "[2,7,11,15]\n9", "expected_output": "[0, 1]"}]
    res1 = runner.run_code("java", two_sum_java, tc1, {"function_name": "twoSum"})
    print(f"Status: {res1['status']} | Passed: {res1['passed_test_cases']}/{res1['total_test_cases']}")
    assert res1["status"] == "Accepted", f"Expected Accepted, got {res1['status']}: {res1.get('error_message')}"

    # TEST 2: 3Sum Java (Function Mode & Output Normalization)
    print("\nTEST 2: 3Sum Java (Function Mode & Normalization)...")
    three_sum_java = """import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l+1]) l++;
                    while (l < r && nums[r] == nums[r-1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
}
"""
    tc2 = [{"input_data": "[-1,0,1,2,-1,-4]", "expected_output": "[[-1,-1,2],[-1,0,1]]"}]
    res2 = runner.run_code("java", three_sum_java, tc2, {"function_name": "threeSum"})
    print(f"Status: {res2['status']} | Passed: {res2['passed_test_cases']}/{res2['total_test_cases']}")
    assert res2["status"] == "Accepted", f"Expected Accepted, got {res2['status']}: {res2.get('error_message')}"

    # TEST 3: Correct Java Solution (Accepted)
    print("\nTEST 3: Correct Java Solution...")
    assert res1["status"] == "Accepted"

    # TEST 4: Wrong Java Solution (Wrong Answer)
    print("\nTEST 4: Wrong Java Solution...")
    wrong_java = """class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[]{0, 0};
    }
}
"""
    res4 = runner.run_code("java", wrong_java, tc1, {"function_name": "twoSum"})
    print(f"Status: {res4['status']}")
    assert res4["status"] == "Wrong Answer", f"Expected Wrong Answer, got {res4['status']}"

    # TEST 5: Java Compilation Error
    print("\nTEST 5: Java Compilation Error...")
    broken_java = """class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[]{0, 0
    }
}
"""
    res5 = runner.run_code("java", broken_java, tc1, {"function_name": "twoSum"})
    print(f"Status: {res5['status']}")
    assert res5["status"] == "Compilation Error", f"Expected Compilation Error, got {res5['status']}"

    # TEST 6: Java Runtime Error (Array Index Out of Bounds)
    print("\nTEST 6: Java Runtime Error...")
    runtime_err_java = """class Solution {
    public int[] twoSum(int[] nums, int target) {
        int x = nums[100];
        return new int[]{0, 1};
    }
}
"""
    res6 = runner.run_code("java", runtime_err_java, tc1, {"function_name": "twoSum"})
    print(f"Status: {res6['status']}")
    assert res6["status"] == "Runtime Error", f"Expected Runtime Error, got {res6['status']}"

    # TEST 7: Java Infinite Loop / Timeout
    print("\nTEST 7: Java Infinite Loop / Timeout...")
    timeout_runner = CodeSandboxRunner(time_limit=1.0)
    timeout_java = """class Solution {
    public int[] twoSum(int[] nums, int target) {
        while (true) {}
    }
}
"""
    res7 = timeout_runner.run_code("java", timeout_java, tc1, {"function_name": "twoSum"})
    print(f"Status: {res7['status']}")
    assert res7["status"] == "Time Limit Exceeded", f"Expected Time Limit Exceeded, got {res7['status']}"

    # TEST 8: Python Function-Style Problem
    print("\nTEST 8: Python Function-Style Problem...")
    py_func = """class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
"""
    res8 = runner.run_code("python", py_func, tc1, {"function_name": "twoSum"})
    print(f"Status: {res8['status']}")
    assert res8["status"] == "Accepted", f"Expected Accepted, got {res8['status']}"

    # TEST 9: Python Standard-Input Problem
    print("\nTEST 9: Python Standard-Input Problem...")
    py_stdin = """n = int(input())
print(n * 2)
"""
    tc9 = [{"input_data": "5", "expected_output": "10"}]
    res9 = runner.run_code("python", py_stdin, tc9, {})
    print(f"Status: {res9['status']}")
    assert res9["status"] == "Accepted", f"Expected Accepted, got {res9['status']}"

    # TEST 10: C++ Function-Style Problem
    print("\nTEST 10: C++ Function-Style Problem...")
    cpp_func = """#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (seen.count(diff)) return {seen[diff], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};
"""
    res10 = runner.run_code("cpp", cpp_func, tc1, {"function_name": "twoSum"})
    print(f"Status: {res10['status']}")
    assert res10["status"] == "Accepted", f"Expected Accepted, got {res10['status']}"

    print("\n==================================================")
    print("ALL 10 TEST SUITE CASES PASSED PERFECTLY! 🎉")
    print("==================================================")

if __name__ == "__main__":
    main()
