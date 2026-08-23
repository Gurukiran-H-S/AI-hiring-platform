# AI Hiring Platform - Code Execution & Sandbox Engine

## Overview

The Code Execution Engine is a sandboxed evaluation system capable of running candidate submissions against sample and hidden test cases with strict resource limits and automated result validation.

---

## Supported Languages & Environments

| Language | Standard | Docker Image | Subprocess Fallback Binary |
| :--- | :--- | :--- | :--- |
| **Python** | Python 3.10+ | `python:3.10-slim` | `sys.executable` |
| **JavaScript** | ES6 / Node.js 18+ | `node:18-slim` | `node` |
| **Java** | OpenJDK 17 | `openjdk:17-slim` | `javac` & `java` |
| **C++** | C++17 (GCC) | `gcc:latest` | `g++` |

---

## Architectural Components

### 1. `DockerExecutor` (`backend/app/services/code_execution/docker_executor.py`)
- Manages sandbox lifecycle and execution commands.
- Wraps candidate code in language-specific driver harnesses that:
  - Inject `ListNode` and `TreeNode` serializers
  - Parse single-line comma-delimited named arguments (`nums = [2,7,11,15], target = 9`)
  - Parse multiline space-separated values (`2 7 11 15\n9`)
  - Parse matrix/grid inputs
  - Safely invoke target class method or standalone function

### 2. `ResultEvaluator` (`backend/app/services/code_execution/result_evaluator.py`)
- Evaluates candidate stdout against expected outputs:
  - **1D Lists / Sequences**: Preserves exact element order (e.g. Reverse Linked List `[5, 4, 3, 2, 1]`)
  - **2D Lists / Combinations**: Deterministically normalizes sub-lists and outer collections (e.g. 3Sum `[[-1,-1,2],[-1,0,1]]`)
  - **Primitives**: Compares boolean literals (`true`/`false`), integers, and floating-point values with 1e-4 tolerance

---

## Security Safeguards

- **Timeout Limit**: 2.0s wall-clock time limit per test case (`TimeoutExpired` triggers `Time Limit Exceeded`).
- **Memory Limit**: 256MB per execution sandbox.
- **Network Isolation**: `--net none` flag in Docker containers prevents outbound socket connections.
