import os
import json
import glob
import re
import uuid
from sqlalchemy.orm import Session
from app.models.coding import CodingProblem, TestCase, ProblemDifficulty

# Comprehensive Problem Bank spanning ALL categories & difficulties
SEED_PROBLEMS = [
    # --- ARRAYS ---
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Arrays",
        "tags": ["Array", "Hash Table"],
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
        "sample_input": "nums = [2,7,11,15], target = 9",
        "sample_output": "[0,1]",
        "test_cases": [
            {"input_data": "2 7 11 15\n9", "expected_output": "0 1", "is_hidden": False},
            {"input_data": "3 2 4\n6", "expected_output": "1 2", "is_hidden": True},
            {"input_data": "3 3\n6", "expected_output": "0 1", "is_hidden": True},
        ]
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "slug": "best-time-to-buy-and-sell-stock",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Arrays",
        "tags": ["Array", "Dynamic Programming"],
        "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day. Return the maximum profit you can achieve.",
        "constraints": "1 <= prices.length <= 10^5",
        "sample_input": "[7,1,5,3,6,4]",
        "sample_output": "5",
        "test_cases": [
            {"input_data": "7 1 5 3 6 4", "expected_output": "5", "is_hidden": False},
            {"input_data": "7 6 4 3 1", "expected_output": "0", "is_hidden": True},
        ]
    },
    {
        "title": "3Sum",
        "slug": "3sum",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Arrays",
        "tags": ["Array", "Two Pointers", "Sorting"],
        "description": "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
        "constraints": "3 <= nums.length <= 3000",
        "sample_input": "[-1,0,1,2,-1,-4]",
        "sample_output": "[[-1,-1,2],[-1,0,1]]",
        "test_cases": [
            {"input_data": "-1 0 1 2 -1 -4", "expected_output": "-1 -1 2\n-1 0 1", "is_hidden": False},
        ]
    },

    # --- STRINGS ---
    {
        "title": "Valid Anagram",
        "slug": "valid-anagram",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Strings",
        "tags": ["Hash Table", "String", "Sorting"],
        "description": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
        "constraints": "1 <= s.length, t.length <= 5 * 10^4",
        "sample_input": "s = \"anagram\", t = \"nagaram\"",
        "sample_output": "true",
        "test_cases": [
            {"input_data": "anagram\nnagaram", "expected_output": "true", "is_hidden": False},
            {"input_data": "rat\ncar", "expected_output": "false", "is_hidden": True},
        ]
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-without-repeating-characters",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Strings",
        "tags": ["Hash Table", "String", "Sliding Window"],
        "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
        "constraints": "0 <= s.length <= 5 * 10^4",
        "sample_input": "abcabcbb",
        "sample_output": "3",
        "test_cases": [
            {"input_data": "abcabcbb", "expected_output": "3", "is_hidden": False},
            {"input_data": "bbbbb", "expected_output": "1", "is_hidden": True},
            {"input_data": "pwwkew", "expected_output": "3", "is_hidden": True},
        ]
    },

    # --- LINKED LIST ---
    {
        "title": "Reverse Linked List",
        "slug": "reverse-linked-list",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Linked List",
        "tags": ["Linked List", "Recursion"],
        "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        "constraints": "The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000",
        "sample_input": "[1,2,3,4,5]",
        "sample_output": "[5,4,3,2,1]",
        "test_cases": [
            {"input_data": "1 2 3 4 5", "expected_output": "5 4 3 2 1", "is_hidden": False},
            {"input_data": "1 2", "expected_output": "2 1", "is_hidden": True},
        ]
    },
    {
        "title": "Merge Two Sorted Lists",
        "slug": "merge-two-sorted-lists",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Linked List",
        "tags": ["Linked List", "Recursion"],
        "description": "Merge two sorted linked lists and return it as a sorted list.",
        "constraints": "0 <= list.length <= 50",
        "sample_input": "l1 = [1,2,4], l2 = [1,3,4]",
        "sample_output": "[1,1,2,3,4,4]",
        "test_cases": [
            {"input_data": "1 2 4\n1 3 4", "expected_output": "1 1 2 3 4 4", "is_hidden": False},
        ]
    },

    # --- TREES ---
    {
        "title": "Maximum Depth of Binary Tree",
        "slug": "maximum-depth-of-binary-tree",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Trees",
        "tags": ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
        "description": "Given the root of a binary tree, return its maximum depth.",
        "constraints": "0 <= number of nodes <= 10^4",
        "sample_input": "[3,9,20,null,null,15,7]",
        "sample_output": "3",
        "test_cases": [
            {"input_data": "3 9 20 null null 15 7", "expected_output": "3", "is_hidden": False},
        ]
    },
    {
        "title": "Invert Binary Tree",
        "slug": "invert-binary-tree",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Trees",
        "tags": ["Tree", "DFS", "BFS", "Binary Tree"],
        "description": "Given the root of a binary tree, invert the tree, and return its root.",
        "constraints": "0 <= number of nodes <= 100",
        "sample_input": "[4,2,7,1,3,6,9]",
        "sample_output": "[4,7,2,9,6,3,1]",
        "test_cases": [
            {"input_data": "4 2 7 1 3 6 9", "expected_output": "4 7 2 9 6 3 1", "is_hidden": False},
        ]
    },

    # --- GRAPH ---
    {
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Graph",
        "tags": ["Array", "DFS", "BFS", "Union Find", "Matrix"],
        "description": "Given an `m x n` 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.",
        "constraints": "m == grid.length\nn == grid[i].length\n1 <= m, n <= 300",
        "sample_input": "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
        "sample_output": "1",
        "test_cases": [
            {"input_data": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "expected_output": "1", "is_hidden": False},
        ]
    },
    {
        "title": "Course Schedule",
        "slug": "course-schedule",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Graph",
        "tags": ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort"],
        "description": "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. Return `true` if you can finish all courses.",
        "constraints": "1 <= numCourses <= 2000",
        "sample_input": "numCourses = 2, prerequisites = [[1,0]]",
        "sample_output": "true",
        "test_cases": [
            {"input_data": "2\n1 0", "expected_output": "true", "is_hidden": False},
        ]
    },

    # --- DYNAMIC PROGRAMMING ---
    {
        "title": "Climbing Stairs",
        "slug": "climbing-stairs",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Dynamic Programming",
        "tags": ["Math", "Dynamic Programming", "Memoization"],
        "description": "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        "constraints": "1 <= n <= 45",
        "sample_input": "3",
        "sample_output": "3",
        "test_cases": [
            {"input_data": "2", "expected_output": "2", "is_hidden": False},
            {"input_data": "3", "expected_output": "3", "is_hidden": True},
            {"input_data": "5", "expected_output": "8", "is_hidden": True},
        ]
    },
    {
        "title": "Coin Change",
        "slug": "coin-change",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Dynamic Programming",
        "tags": ["Array", "Dynamic Programming", "BFS"],
        "description": "Given an integer array `coins` representing coins of different denominations and an integer `amount`, return the fewest number of coins that you need to make up that amount.",
        "constraints": "1 <= coins.length <= 12\n1 <= amount <= 10^4",
        "sample_input": "coins = [1,2,5], amount = 11",
        "sample_output": "3",
        "test_cases": [
            {"input_data": "1 2 5\n11", "expected_output": "3", "is_hidden": False},
            {"input_data": "2\n3", "expected_output": "-1", "is_hidden": True},
        ]
    },

    # --- GREEDY ---
    {
        "title": "Jump Game",
        "slug": "jump-game",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Greedy",
        "tags": ["Array", "Dynamic Programming", "Greedy"],
        "description": "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return `true` if you can reach the last index.",
        "constraints": "1 <= nums.length <= 10^4",
        "sample_input": "[2,3,1,1,4]",
        "sample_output": "true",
        "test_cases": [
            {"input_data": "2 3 1 1 4", "expected_output": "true", "is_hidden": False},
            {"input_data": "3 2 1 0 4", "expected_output": "false", "is_hidden": True},
        ]
    },

    # --- RECURSION & BACKTRACKING ---
    {
        "title": "Subsets",
        "slug": "subsets",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Backtracking",
        "tags": ["Array", "Backtracking", "Bit Manipulation"],
        "description": "Given an integer array `nums` of unique elements, return all possible subsets (the power set).",
        "constraints": "1 <= nums.length <= 10",
        "sample_input": "[1,2,3]",
        "sample_output": "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
        "test_cases": [
            {"input_data": "1 2 3", "expected_output": "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]", "is_hidden": False},
        ]
    },

    # --- STACK & QUEUE ---
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Stack",
        "tags": ["String", "Stack"],
        "description": "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        "constraints": "1 <= s.length <= 10^4",
        "sample_input": "()[]{}",
        "sample_output": "true",
        "test_cases": [
            {"input_data": "()[]{}", "expected_output": "true", "is_hidden": False},
            {"input_data": "(]", "expected_output": "false", "is_hidden": True},
        ]
    },

    # --- BINARY SEARCH ---
    {
        "title": "Binary Search",
        "slug": "binary-search",
        "difficulty": ProblemDifficulty.EASY,
        "category": "Binary Search",
        "tags": ["Array", "Binary Search"],
        "description": "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.",
        "constraints": "1 <= nums.length <= 10^4",
        "sample_input": "nums = [-1,0,3,5,9,12], target = 9",
        "sample_output": "4",
        "test_cases": [
            {"input_data": "-1 0 3 5 9 12\n9", "expected_output": "4", "is_hidden": False},
        ]
    },

    # --- SQL ---
    {
        "title": "Combine Two Tables",
        "slug": "combine-two-tables",
        "difficulty": ProblemDifficulty.EASY,
        "category": "SQL",
        "tags": ["Database", "SQL"],
        "description": "Write a solution to report the firstName, lastName, city, and state of each person in the Person table.",
        "constraints": "Person table and Address table",
        "sample_input": "Person and Address tables",
        "sample_output": "Combined view",
        "test_cases": [
            {"input_data": "SELECT Person.firstName, Person.lastName, Address.city, Address.state FROM Person LEFT JOIN Address ON Person.personId = Address.personId;", "expected_output": "OK", "is_hidden": False},
        ]
    },
    {
        "title": "Maximum Subarray",
        "slug": "maximum-subarray",
        "difficulty": ProblemDifficulty.MEDIUM,
        "category": "Arrays",
        "tags": ["Array", "Divide and Conquer", "Dynamic Programming"],
        "description": "Given an integer array `nums`, find the subarray with the largest sum and return its sum.",
        "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        "sample_input": "[-2,1,-3,4,-1,2,1,-5,4]",
        "sample_output": "6",
        "function_name": "maxSubArray",
        "test_cases": [
            {"input_data": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6", "is_hidden": False},
            {"input_data": "5 4 -1 7 8", "expected_output": "23", "is_hidden": True},
        ]
    }
]

def seed_default_problems(db: Session):
    """Seed comprehensive problem set into database."""
    for item in SEED_PROBLEMS:
        tc_data = item.pop("test_cases", [])
        existing = db.query(CodingProblem).filter(CodingProblem.slug == item["slug"]).first()
        if not existing:
            problem = CodingProblem(**item)
            db.add(problem)
            db.flush()

            for tc in tc_data:
                testcase = TestCase(
                    problem_id=problem.id,
                    input_data=tc["input_data"],
                    expected_output=tc["expected_output"],
                    is_hidden=tc.get("is_hidden", True),
                )
                db.add(testcase)

    db.commit()

def import_huggingface_dataset(db: Session, folder_path: str = r"D:\huggingface") -> int:
    """Ingests dataset parquet files from local HuggingFace cache folder D:\\huggingface."""
    if not os.path.exists(folder_path):
        return 0

    import pandas as pd
    parquet_files = glob.glob(os.path.join(folder_path, "**", "*.parquet"), recursive=True)
    count = 0

    for fpath in parquet_files[:5]:
        try:
            df = pd.read_parquet(fpath)
            for _, row in df.iterrows():
                try:
                    name = str(row.get("name") or row.get("question", "")[:30]).strip()
                    if not name:
                        continue
                    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
                    if not slug:
                        slug = f"prob-{str(uuid.uuid4())[:8]}"

                    # Ensure unique slug
                    slug = f"{slug}-{str(uuid.uuid4())[:6]}"

                    diff_raw = str(row.get("difficulty", "EASY")).upper()
                    diff = ProblemDifficulty.EASY
                    if "MEDIUM" in diff_raw:
                        diff = ProblemDifficulty.MEDIUM
                    elif "HARD" in diff_raw:
                        diff = ProblemDifficulty.HARD

                    raw_src = str(row.get("source", "Arrays")).strip()
                    cat = "Arrays"
                    if "dp" in raw_src.lower() or "dynamic" in raw_src.lower():
                        cat = "Dynamic Programming"
                    elif "graph" in raw_src.lower():
                        cat = "Graph"
                    elif "tree" in raw_src.lower():
                        cat = "Trees"
                    elif "string" in raw_src.lower():
                        cat = "Strings"
                    elif "link" in raw_src.lower():
                        cat = "Linked List"
                    elif "sql" in raw_src.lower():
                        cat = "SQL"

                    problem = CodingProblem(
                        title=name[:250],
                        slug=slug[:250],
                        difficulty=diff,
                        category=cat,
                        description=str(row.get("question", "")),
                        constraints=str(row.get("constraints", "")),
                        sample_input="",
                        sample_output="",
                    )
                    db.add(problem)
                    db.commit()
                    count += 1
                    if count >= 300:
                        break
                except Exception:
                    db.rollback()
                    continue
        except Exception as e:
            print("Import error on file:", fpath, e)
            continue

    return count
