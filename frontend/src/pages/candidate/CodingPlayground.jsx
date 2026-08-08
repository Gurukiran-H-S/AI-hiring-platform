import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const CodingPlayground = () => {
  const [activeTab, setActiveTab] = useState('practice') // 'practice' | 'weekly' | 'leaderboard' | 'recommendations'
  const [problems, setProblems] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [search, setSearch] = useState('')

  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [evalResult, setEvalResult] = useState(null)
  const [submissionHistory, setSubmissionHistory] = useState([])

  // AI Drawer & Hint States
  const [aiHint, setAiHint] = useState(null)
  const [aiReview, setAiReview] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [recommendations, setRecommendations] = useState([])

  // Leaderboard & User Stats
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState(null)

  const CATEGORIES = [
    'All', 'Arrays', 'Strings', 'Linked List', 'Trees', 'Graph',
    'Dynamic Programming', 'Greedy', 'Recursion', 'Backtracking',
    'Stack', 'Queue', 'Heap', 'Binary Search', 'SQL'
  ]
  const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

  const STARTER_CODES = {
    python: (func) => `class Solution:\n    def ${func || 'twoSum'}(self, nums: list[int], target: int) -> list[int]:\n        # Write your algorithm here\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []\n`,
    cpp: (func) => `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${func || 'twoSum'}(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) return {seen[diff], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`,
    java: (func) => `import java.util.HashMap;\n\nclass Solution {\n    public int[] ${func || 'twoSum'}(int[] nums, int target) {\n        HashMap<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (seen.containsKey(diff)) {\n                return new int[]{seen.get(diff), i};\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}\n`,
    javascript: (func) => `class Solution {\n    ${func || 'twoSum'}(nums, target) {\n        const seen = new Map();\n        for (let i = 0; i < nums.length; i++) {\n            const diff = target - nums[i];\n            if (seen.has(diff)) return [seen.get(diff), i];\n            seen.set(nums[i], i);\n        }\n        return [];\n    }\n}\n`
  }

  useEffect(() => {
    fetchProblems()
    fetchLeaderboard()
    fetchUserStats()
    fetchRecommendations()
  }, [category, difficulty, search])

  const fetchProblems = async () => {
    try {
      const params = {}
      if (category !== 'All') params.category = category
      if (difficulty !== 'All') params.difficulty = difficulty
      if (search) params.search = search

      const { data } = await api.get('/coding/problems', { params })
      setProblems(data)
      if (data.length > 0 && !selectedQuestion) {
        loadProblemDetail(data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadProblemDetail = async (id) => {
    try {
      const { data } = await api.get(`/coding/problems/${id}`)
      setSelectedQuestion(data)
      setCode(STARTER_CODES[language](data.function_name))
      setOutput('')
      setEvalResult(null)
      setAiHint(null)
      setAiReview(null)
    } catch (err) {
      toast.error('Failed to load problem details')
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    if (selectedQuestion) {
      setCode(STARTER_CODES[lang](selectedQuestion.function_name))
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/coding/leaderboard')
      setLeaderboard(data)
    } catch (err) {}
  }

  const fetchUserStats = async () => {
    try {
      const { data } = await api.get('/coding/stats/me')
      setUserStats(data)
    } catch (err) {}
  }

  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get('/coding/recommendations')
      setRecommendations(data)
    } catch (err) {}
  }

  const handleRunSample = async () => {
    if (!selectedQuestion) return
    setRunning(true)
    setOutput('Compiling & executing sample test cases via Judge0 / Isolated Sandbox...')
    setEvalResult(null)

    try {
      const { data } = await api.post('/coding/run', {
        problem_id: selectedQuestion.id,
        language,
        code,
        input_data: selectedQuestion.sample_input || ''
      })

      setRunning(false)
      setEvalResult(data)

      if (data.status === 'Accepted') {
        setOutput(`✔ Sample Test Cases Verified!\n\nPassed ${data.passed_test_cases}/${data.total_test_cases} Samples.\nRuntime: ${data.execution_time}s`)
        toast.success('Sample Test Cases Passed!')
      } else {
        setOutput(`❌ Sample Test Failed: ${data.status}\n\nPassed ${data.passed_test_cases}/${data.total_test_cases} Samples.`)
        toast.error(`Run Failed: ${data.status}`)
      }
    } catch (err) {
      setRunning(false)
      setOutput('Error connecting to code execution sandbox.')
    }
  }

  const handleSubmitCode = async () => {
    if (!selectedQuestion) return
    setRunning(true)
    setOutput('Submitting code to Judge0 Online Judge engine & running hidden test cases...')
    setEvalResult(null)

    try {
      const { data } = await api.post('/coding/submit', {
        problem_id: selectedQuestion.id,
        language,
        code,
      })

      setRunning(false)
      setEvalResult(data)
      if (data.ai_review) {
        setAiReview(data.ai_review)
      }

      if (data.status === 'Accepted') {
        setOutput(`🎉 VERDICT: ACCEPTED!\n\nAll ${data.passed_test_cases}/${data.total_test_cases} Hidden Test Cases Passed!\nRuntime: ${data.execution_time}s | Points Earned: +100`)
        toast.success('🎉 Solution Accepted! Points added to global rank.')
        fetchUserStats()
        fetchLeaderboard()
      } else {
        setOutput(`❌ VERDICT: ${data.status}\n\nPassed ${data.passed_test_cases}/${data.total_test_cases} Test Cases.\nError: ${data.error_message || 'Wrong Answer'}`)
        toast.error(`Submission Failed: ${data.status}`)
      }
    } catch (err) {
      setRunning(false)
      setOutput('Error submitting code to execution engine.')
    }
  }

  const handleGetAiHint = async (level = 1) => {
    if (!selectedQuestion) return
    setLoadingAi(true)
    try {
      const { data } = await api.post('/coding/ai/hint', {
        problem_id: selectedQuestion.id,
        code,
        hint_level: level
      })
      setAiHint(data)
      toast.success(`Level ${level} AI Hint Generated!`)
    } catch (err) {
      toast.error('Failed to generate AI hint.')
    } finally {
      setLoadingAi(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl text-white pt-2 pb-12">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            AI Coding Assessment & Evaluation Platform
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            LeetCode-Style Online Judge, Judge0 Sandbox Execution, Deterministic Judging & AI Review Engine.
          </p>
        </div>

        {userStats && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">SOLVED</div>
              <div className="text-base font-bold text-indigo-400 font-mono">{userStats.total_solved}</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">POINTS</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{userStats.total_score}</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">GLOBAL RANK</div>
              <div className="text-base font-bold text-amber-400 font-mono">#{userStats.global_rank || '1'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'practice'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Practice Problems
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ✨ AI Recommendations
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🏆 Global Leaderboard
        </button>
      </div>

      {/* PRACTICE PROBLEMS TAB */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Problem Bank Selection */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filters */}
            <div className="glass-card p-4 border border-white/10 rounded-2xl bg-white/5 space-y-3">
              <input
                type="text"
                placeholder="Search 300+ problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0b14]/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-1/2 bg-[#0a0b14] border border-white/15 text-xs text-white rounded-xl p-2 font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-1/2 bg-[#0a0b14] border border-white/15 text-xs text-white rounded-xl p-2 font-semibold"
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problem List Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {problems.map((p) => {
                const isSelected = selectedQuestion?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => loadProblemDetail(p.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs font-display flex items-center gap-2">
                        <span>{p.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            p.difficulty === 'Easy'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : p.difficulty === 'Medium'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Category: {p.category} • Acceptance: {p.acceptance_rate || 78}%
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-bold">Solve →</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Problem Details & Monaco Code Editor */}
          <div className="lg:col-span-7 space-y-4">
            {selectedQuestion ? (
              <div className="space-y-4">
                {/* Problem Statement Card */}
                <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-xl font-bold font-display text-white">{selectedQuestion.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Time Limit: {selectedQuestion.time_limit_seconds}s</span>
                      <button
                        onClick={() => handleGetAiHint(1)}
                        disabled={loadingAi}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        💡 AI Hint
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{selectedQuestion.description}</p>

                  {/* Sample Input/Output */}
                  {selectedQuestion.sample_input && (
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Sample Input</div>
                        <pre className="font-mono text-emerald-400">{selectedQuestion.sample_input}</pre>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Sample Output</div>
                        <pre className="font-mono text-indigo-400">{selectedQuestion.sample_output}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Hint Drawer Banner */}
                {aiHint && (
                  <div className="bg-purple-500/15 border border-purple-500/30 p-4 rounded-2xl text-xs space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between font-bold text-purple-300">
                      <span>💡 AI Hint (Level {aiHint.hint_level})</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleGetAiHint(2)} className="hover:underline text-[10px]">Level 2 →</button>
                        <button onClick={() => handleGetAiHint(3)} className="hover:underline text-[10px]">Level 3 →</button>
                      </div>
                    </div>
                    <p className="text-slate-200">{aiHint.hint}</p>
                  </div>
                )}

                {/* Monaco Style Code Editor */}
                <div className="glass-card border border-white/10 rounded-2xl bg-[#0d0e19] overflow-hidden shadow-2xl">
                  {/* Editor Header Bar */}
                  <div className="p-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">LANGUAGE:</span>
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-[#0a0b14] border border-white/20 text-xs text-white rounded-lg px-3 py-1 font-semibold"
                      >
                        <option value="python">Python 3</option>
                        <option value="cpp">C++ (GCC)</option>
                        <option value="java">Java 17</option>
                        <option value="javascript">JavaScript (Node)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCode(STARTER_CODES[language](selectedQuestion.function_name))}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1"
                      >
                        ↺ Reset
                      </button>
                      <button
                        onClick={handleRunSample}
                        disabled={running}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                      >
                        Run Sample
                      </button>
                      <button
                        onClick={handleSubmitCode}
                        disabled={running}
                        className="btn-primary text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-indigo-500/25"
                      >
                        {running ? 'Judging...' : 'Submit Code'}
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Input Textarea */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={14}
                    className="w-full bg-[#0a0b14] p-4 text-xs font-mono text-emerald-300 focus:outline-none resize-none leading-relaxed"
                    spellCheck="false"
                  ></textarea>

                  {/* Execution Output Panel */}
                  <div className="p-4 bg-black/60 border-t border-white/10 font-mono text-xs space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">TEST CASE EXECUTION & VERDICT OUTPUT</div>
                    <pre className="text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {output || 'Click "Run Sample" to test sample cases or "Submit Code" to run hidden test cases via Judge0.'}
                    </pre>
                  </div>
                </div>

                {/* AI Code Review Drawer */}
                {aiReview && (
                  <div className="glass-card p-6 border border-emerald-500/40 rounded-2xl bg-emerald-500/10 space-y-4 animate-scale-up">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <h3 className="font-bold text-sm font-display text-emerald-300 flex items-center gap-2">
                        <span>🤖 AI Code Review & Complexity Analysis</span>
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
                        Quality Score: {aiReview.code_quality_score}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/30">
                        <span className="text-slate-400 block text-[10px] uppercase">Time Complexity</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{aiReview.time_complexity}</span>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/30">
                        <span className="text-slate-400 block text-[10px] uppercase">Space Complexity</span>
                        <span className="font-mono font-bold text-indigo-400 text-sm">{aiReview.space_complexity}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-400">Strengths:</strong>
                        <ul className="list-disc list-inside text-slate-300 mt-1 space-y-0.5">
                          {aiReview.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-amber-400">Optimization Suggestions:</strong>
                        <p className="text-slate-300 mt-1">{aiReview.optimization_suggestions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-400 text-xs">Select a problem to start coding.</div>
            )}
          </div>
        </div>
      )}

      {/* AI RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-2">
            <h2 className="text-lg font-bold font-display text-white">✨ AI Weak-Skill Problem Recommendations</h2>
            <p className="text-xs text-slate-400">Personalized algorithmic recommendation engine prioritizing topics to boost accuracy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.problem_slug} className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white font-display">{rec.title}</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded font-mono font-bold">{rec.difficulty}</span>
                </div>
                <p className="text-xs text-slate-300">{rec.reason}</p>
                <button
                  onClick={() => {
                    setActiveTab('practice')
                    fetchProblems()
                  }}
                  className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl"
                >
                  Solve Recommended Problem →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GLOBAL LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
          <h2 className="text-lg font-bold font-display text-white">🏆 Global Candidate Coding Leaderboard</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Total Solved</th>
                  <th className="p-3">Easy</th>
                  <th className="p-3">Medium</th>
                  <th className="p-3">Hard</th>
                  <th className="p-3">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((item) => (
                  <tr key={item.rank} className="hover:bg-white/5">
                    <td className="p-3 font-bold font-mono text-amber-400">#{item.rank}</td>
                    <td className="p-3 font-semibold text-white">{item.candidate_name}</td>
                    <td className="p-3 font-mono font-bold text-indigo-400">{item.total_solved}</td>
                    <td className="p-3 text-emerald-400">{item.easy_solved}</td>
                    <td className="p-3 text-amber-400">{item.medium_solved}</td>
                    <td className="p-3 text-rose-400">{item.hard_solved}</td>
                    <td className="p-3 font-bold font-mono text-emerald-300">{item.total_score} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
