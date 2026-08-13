import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'

export const CodingPlayground = () => {
  const [activeTab, setActiveTab] = useState('practice') // 'practice' | 'assessments' | 'leaderboard' | 'profile'
  const [problems, setProblems] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [search, setSearch] = useState('')

  // Coding Workspace States
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [evalResult, setEvalResult] = useState(null)
  const [localCodeCache, setLocalCodeCache] = useState({})
  
  // Recruiter Assessments States
  const [assignedAssessments, setAssignedAssessments] = useState([])
  const [examMode, setExamMode] = useState(false)
  const [currentAssessment, setCurrentAssessment] = useState(null)
  const [assessmentProblems, setAssessmentProblems] = useState([])
  const [selectedAssessmentProbIndex, setSelectedAssessmentProbIndex] = useState(0)
  const [assessmentAnswers, setAssessmentAnswers] = useState({}) // { problem_id: { language, code } }
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [attemptId, setAttemptId] = useState(null)
  const [submittingExam, setSubmittingExam] = useState(false)

  // AI Hint States
  const [hintLevel, setHintLevel] = useState(1)
  const [aiHint, setAiHint] = useState('')
  const [loadingHint, setLoadingHint] = useState(false)

  // Leaderboard & User Stats
  const [leaderboard, setLeaderboard] = useState([])
  const [profileStats, setProfileStats] = useState(null)

  const CATEGORIES = [
    'All', 'Arrays', 'Strings', 'Linked List', 'Trees', 'Graph',
    'Dynamic Programming', 'Greedy', 'Recursion', 'Backtracking',
    'Stack', 'Queue', 'Binary Search', 'SQL'
  ]
  const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

  const STARTER_CODES = {
    python: (func) => `class Solution:\n    def ${func || 'twoSum'}(self, nums: list[int], target: int) -> list[int]:\n        # Write your algorithm here\n        pass\n`,
    java: (func) => `class Solution {\n    public int[] ${func || 'twoSum'}(int[] nums, int target) {\n        // Write your solution\n        return new int[]{};\n    }\n}\n`,
  }

  useEffect(() => {
    fetchProblems()
    fetchLeaderboard()
    fetchProfile()
    fetchAssignedAssessments()
  }, [category, difficulty, search])

  // Count down assessment timer
  useEffect(() => {
    if (!examMode || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleForceSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examMode, timeLeft])

  const fetchProblems = async () => {
    try {
      const params = {}
      if (category !== 'All') params.category = category
      if (difficulty !== 'All') params.difficulty = difficulty
      if (search) params.search = search

      const { data } = await api.get('/coding/problems', { params })
      setProblems(data || [])
      if (data && data.length > 0 && !selectedQuestion) {
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
      
      const cacheKey = `${data.id}_${language}`
      const cached = localCodeCache[cacheKey]
      const starterKey = language === 'python' ? 'starter_code_python' : 'starter_code_java'
      setCode(cached !== undefined ? cached : data[starterKey])
      
      setEvalResult(null)
      setAiHint('')
      setHintLevel(1)
    } catch (err) {
      toast.error('Failed to load problem details')
    }
  }

  const fetchAssignedAssessments = async () => {
    try {
      const { data } = await api.get('/coding/assessments')
      setAssignedAssessments(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/coding/leaderboard')
      setLeaderboard(data || [])
    } catch (err) {}
  }

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/coding/profile')
      setProfileStats(data || null)
    } catch (err) {}
  }

  const handleRunCode = async () => {
    if (!selectedQuestion) return
    setRunning(true)
    setEvalResult(null)
    try {
      const { data } = await api.post('/coding/run', {
        problem_id: selectedQuestion.id,
        language,
        code
      })
      setEvalResult(data)
      if (data.status === 'Accepted') {
        toast.success('Sample Test Cases Passed!')
      } else {
        toast.error(`Result: ${data.status}`)
      }
    } catch (err) {
      toast.error('Failed to compile code')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    if (!selectedQuestion) return
    setSubmitting(true)
    setEvalResult(null)
    try {
      const { data } = await api.post('/coding/submit', {
        problem_id: selectedQuestion.id,
        language,
        code
      })
      setEvalResult(data)
      if (data.status === 'Accepted') {
        toast.success('Congratulations! All Hidden Test Cases Passed!')
        fetchProfile()
        fetchLeaderboard()
      } else {
        toast.error(`Verdict: ${data.status}`)
      }
    } catch (err) {
      toast.error('Code submission error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGetHint = async () => {
    if (!selectedQuestion) return
    setLoadingHint(true)
    try {
      const { data } = await api.post('/coding/ai/hint', {
        problem_id: selectedQuestion.id,
        code,
        hint_level: hintLevel
      })
      setAiHint(data.hint || data)
      setHintLevel(prev => Math.min(prev + 1, 4))
    } catch (err) {
      toast.error('AI is busy. Please try again.')
    } finally {
      setLoadingHint(false)
    }
  }

  // Recruiter Exam Actions
  const handleStartExam = async (assessment) => {
    try {
      const startRes = await api.post(`/coding/assessments/${assessment.id}/start`)
      const detailRes = await api.get(`/coding/assessments/${assessment.id}`)
      
      setCurrentAssessment(assessment)
      setAttemptId(startRes.data.attempt_id)
      setAssessmentProblems(detailRes.data.problems)
      setSelectedAssessmentProbIndex(0)
      
      // Calculate remaining time
      const elapsedSec = Math.floor((new Date() - new Date(startRes.data.started_at)) / 1000)
      const durationSec = assessment.time_limit_minutes * 60
      setTimeLeft(Math.max(0, durationSec - elapsedSec))
      
      // Load first starter code
      const firstProb = detailRes.data.problems[0]
      const initialAnswers = {}
      detailRes.data.problems.forEach(p => {
        initialAnswers[p.id] = {
          language: 'python',
          code: STARTER_CODES['python'](p.function_name)
        }
      })
      setAssessmentAnswers(initialAnswers)
      setCode(initialAnswers[firstProb.id].code)
      setLanguage('python')
      
      setExamMode(true)
      toast.success('Coding Assessment Started. Focus and do your best!')
    } catch (err) {
      toast.error('Failed to start assessment')
    }
  }

  const handleAssessmentProblemSelect = (index) => {
    // Save current editor state
    const currentProbId = assessmentProblems[selectedAssessmentProbIndex].id
    setAssessmentAnswers(prev => ({
      ...prev,
      [currentProbId]: { language, code }
    }))

    // Load next editor state
    const nextProb = assessmentProblems[index]
    setSelectedAssessmentProbIndex(index)
    setCode(assessmentAnswers[nextProb.id]?.code || STARTER_CODES['python'](nextProb.function_name))
    setLanguage(assessmentAnswers[nextProb.id]?.language || 'python')
    setEvalResult(null)
  }

  const handleCodeChange = (newVal) => {
    setCode(newVal || '')
    if (selectedQuestion && !examMode) {
      const cacheKey = `${selectedQuestion.id}_${language}`
      setLocalCodeCache(prev => ({
        ...prev,
        [cacheKey]: newVal || ''
      }))
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    const prob = examMode ? assessmentProblems[selectedAssessmentProbIndex] : selectedQuestion
    if (prob) {
      const starterKey = lang === 'python' ? 'starter_code_python' : 'starter_code_java'
      if (examMode) {
        setCode(prob[starterKey] || STARTER_CODES[lang](prob?.function_name))
      } else {
        const cacheKey = `${prob.id}_${lang}`
        const cached = localCodeCache[cacheKey]
        setCode(cached !== undefined ? cached : (prob[starterKey] || STARTER_CODES[lang](prob?.function_name)))
      }
    }
  }

  const handleForceSubmitExam = async () => {
    toast.error('Time is up! Submitting your solutions automatically...')
    setSubmittingExam(true)
    try {
      const finalAnswersList = Object.entries(assessmentAnswers).map(([probId, data]) => ({
        problem_id: probId,
        language: data.language,
        code: data.code
      }))
      await api.post(`/coding/assessments/${currentAssessment.id}/submit`, {
        attempt_id: attemptId,
        answers: finalAnswersList
      })
      toast.success('Assessment solutions graded and recorded!')
      setExamMode(false)
      setActiveTab('profile')
      fetchProfile()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingExam(false)
    }
  }

  const handleSubmitExamManual = async () => {
    // Save current workspace state
    const currentProbId = assessmentProblems[selectedAssessmentProbIndex].id
    const updatedAnswers = {
      ...assessmentAnswers,
      [currentProbId]: { language, code }
    }

    if (!window.confirm('Are you sure you want to finish and submit the assessment?')) return

    setSubmittingExam(true)
    try {
      const finalAnswersList = Object.entries(updatedAnswers).map(([probId, data]) => ({
        problem_id: probId,
        language: data.language,
        code: data.code
      }))
      const { data } = await api.post(`/coding/assessments/${currentAssessment.id}/submit`, {
        attempt_id: attemptId,
        answers: finalAnswersList
      })
      toast.success(`Assessment submitted! Earned Score: ${data.score}%`)
      setExamMode(false)
      setActiveTab('profile')
      fetchProfile()
    } catch (err) {
      toast.error('Failed to submit assessment')
    } finally {
      setSubmittingExam(false)
    }
  }

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // --- RENDERING ---

  if (examMode) {
    const currentProb = assessmentProblems[selectedAssessmentProbIndex]
    return (
      <div className="fixed inset-0 bg-[#0a0b14] text-white z-50 flex flex-col">
        {/* Exam Focused Header */}
        <header className="bg-[#0f1020] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <div>
              <h1 className="text-base font-bold text-white font-display">{currentAssessment?.title}</h1>
              <p className="text-[11px] text-slate-400">DO NOT close or refresh this tab</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 px-4 py-2 rounded-xl text-rose-400 font-mono text-sm font-bold">
              ⏱️ {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleSubmitExamManual}
              disabled={submittingExam}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              {submittingExam ? 'Submitting...' : 'Finish & Submit Exam'}
            </button>
          </div>
        </header>

        {/* Workspace Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: problem picker + problem detail */}
          <div className="w-1/3 bg-[#0d0e1b] border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/5 space-y-2">
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Assessment Question</label>
              <div className="flex flex-col gap-1.5">
                {assessmentProblems.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssessmentProblemSelect(idx)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      selectedAssessmentProbIndex === idx
                        ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Question #{idx + 1}: {p.title} ({p.difficulty})
                  </button>
                ))}
              </div>
            </div>

            {/* Selected problem detail description */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentProb && (
                <>
                  <div>
                    <h2 className="text-xl font-bold font-display">{currentProb.title}</h2>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded mt-2 inline-block">
                      {currentProb.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/25 p-4 rounded-xl border border-white/5">
                    {currentProb.description}
                  </div>
                  {currentProb.constraints && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Constraints</h4>
                      <pre className="bg-black/30 border border-white/5 p-3 rounded-xl font-mono text-[10px] text-slate-300 whitespace-pre-wrap">{currentProb.constraints}</pre>
                    </div>
                  )}
                  {currentProb.sample_input && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Sample Input</h4>
                        <pre className="bg-black/40 p-3 rounded-xl font-mono text-[10px] text-slate-300 border border-white/5">{currentProb.sample_input}</pre>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase">Sample Output</h4>
                        <pre className="bg-black/40 p-3 rounded-xl font-mono text-[10px] text-slate-300 border border-white/5">{currentProb.sample_output}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right panel: Editor Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="bg-[#0f1020] border-b border-white/5 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400">Language:</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java 17</option>
                </select>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-[300px]">
              <Editor
                key={`${currentProb?.id}_${language}`}
                height="100%"
                language={language === 'python' ? 'python' : 'java'}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollbar: { verticalScrollbarSize: 8 },
                  fontFamily: 'Fira Code, Menlo, Monaco, monospace',
                  suggestOnTriggerCharacters: true
                }}
              />
            </div>

            {/* Footer console */}
            <div className="bg-[#0d0e1b] border-t border-white/10 p-4 space-y-4">
              {evalResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  evalResult.status === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-2">
                    <span className={evalResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>
                      Status: {evalResult.status}
                    </span>
                    <span className="text-slate-400 font-mono">⏱️ {evalResult.execution_time}s</span>
                  </div>
                  {evalResult.error_message && (
                    <pre className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-rose-300 whitespace-pre-wrap">{evalResult.error_message}</pre>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 rounded-xl text-xs font-semibold"
                >
                  {running ? 'Running Tests...' : '⚙️ Run Sample Tests'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- PRACTICE & NORMAL VIEWS ---

  return (
    <div className="space-y-8 w-full max-w-7xl text-white pt-2 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-300 to-emerald-300 bg-clip-text text-transparent mb-1 font-display">
          AI-Hiring Coding Assessment
        </h1>
        <p className="text-slate-400 text-sm">
          Solve LeetCode challenges in sandboxed Java/Python containers and showcase your technical competence.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-1">
        {[
          { id: 'practice', label: 'Practice Arena', icon: '💻' },
          { id: 'assessments', label: 'Assigned Exams', icon: '📝' },
          { id: 'leaderboard', label: 'Rankings', icon: '🏆' },
          { id: 'profile', label: 'My Progress', icon: '👤' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content panes */}
      <div className="space-y-6">

        {/* TAB 1: PRACTICE ARENA */}
        {activeTab === 'practice' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar list */}
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="glass-card p-4 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none"
                  >
                    <option value="All">All Difficulties</option>
                    {DIFFICULTIES.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none"
                  >
                    <option value="All">All Topics</option>
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {problems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProblemDetail(p.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedQuestion?.id === p.id
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs text-white">{p.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        p.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {p.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{p.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Details & Editor split — narrow description | wide editor */}
            <div className="flex-1 flex flex-col lg:flex-row gap-0 bg-[#0c0d19] border border-white/10 rounded-3xl overflow-hidden min-h-[640px]">

              {/* LEFT: Compact problem description panel — fixed narrow width */}
              <div className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto flex flex-col">
                {selectedQuestion && (
                  <div className="p-5 space-y-4">
                    {/* Title + badges */}
                    <div>
                      <h2 className="text-base font-bold font-display text-white leading-snug">{selectedQuestion.title}</h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          selectedQuestion.difficulty === 'Easy' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : selectedQuestion.difficulty === 'Hard' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}>{selectedQuestion.difficulty}</span>
                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 font-bold">{selectedQuestion.category}</span>
                        <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded text-indigo-300 font-bold">⏱ {selectedQuestion.time_limit_seconds || 2}s</span>
                      </div>
                    </div>

                    {/* Short description — 4-line clamp */}
                    <div className="text-[11px] text-slate-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5 line-clamp-4">
                      {selectedQuestion.description}
                    </div>

                    {/* Constraints — compact */}
                    {selectedQuestion.constraints && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Constraints</h4>
                        <pre className="bg-black/30 border border-white/5 p-2.5 rounded-xl font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">{selectedQuestion.constraints}</pre>
                      </div>
                    )}

                    {/* Sample I/O */}
                    {selectedQuestion.sample_input && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Example</h4>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 space-y-1.5 font-mono text-[10px]">
                          <div className="text-slate-500">Input:</div>
                          <div className="text-slate-300">{selectedQuestion.sample_input}</div>
                          <div className="text-slate-500 mt-1">Output:</div>
                          <div className="text-emerald-400">{selectedQuestion.sample_output}</div>
                        </div>
                      </div>
                    )}

                    {/* AI Hint */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <button
                        onClick={handleGetHint}
                        disabled={loadingHint}
                        className="w-full py-2 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        {loadingHint ? '⏳ Thinking...' : `💡 Hint (Level ${hintLevel} / 4)`}
                      </button>
                      {aiHint && (
                        <div className="bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
                          <strong className="text-white block mb-1 text-[10px] uppercase tracking-wider">AI Hint:</strong>
                          {aiHint}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Editor Workspace — takes all remaining width */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0f1020]">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="python">Python 3</option>
                    <option value="java">Java 17</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={running || submitting}
                      className="px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-semibold transition-all"
                    >
                      {running ? '⏳ Running...' : '⚙️ Run'}
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={running || submitting}
                      className="px-5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
                    >
                      {submitting ? '⏳ Evaluating...' : '🚀 Submit'}
                    </button>
                  </div>
                </div>

                {/* Monaco Editor — fills available height */}
                <div className="flex-1 min-h-[480px]">
                  <Editor
                    key={`${selectedQuestion?.id}_${language}`}
                    height="100%"
                    language={language === 'python' ? 'python' : 'java'}
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollbar: { verticalScrollbarSize: 6 },
                      fontFamily: 'Fira Code, Menlo, Monaco, monospace',
                      lineNumbers: 'on',
                      renderLineHighlight: 'line',
                      padding: { top: 12, bottom: 12 },
                      suggestOnTriggerCharacters: true,
                    }}
                  />
                </div>

                {/* Result console */}
                {evalResult && (
                  <div className={`border-t px-4 py-3 text-xs ${
                    evalResult.status === 'Accepted'
                      ? 'bg-emerald-900/20 border-emerald-500/30'
                      : 'bg-rose-900/20 border-rose-500/30'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className={evalResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}>
                        {evalResult.status === 'Accepted' ? '✅' : '❌'} {evalResult.status}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Passed {evalResult.passed_test_cases}/{evalResult.total_test_cases} · {evalResult.execution_time}s
                      </span>
                    </div>
                    {evalResult.error_message && (
                      <pre className="font-mono text-[10px] text-rose-300 whitespace-pre-wrap mt-1 max-h-24 overflow-y-auto">{evalResult.error_message}</pre>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ASSIGNED EXAMS */}
        {activeTab === 'assessments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedAssessments.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center text-slate-400 border border-white/10 rounded-2xl">
                No recruiter exams have been assigned to you. Keep applying to jobs!
              </div>
            ) : (
              assignedAssessments.map((a) => (
                <div key={a.id} className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                        {a.difficulty}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">⏱️ {a.time_limit_minutes}m</span>
                    </div>
                    <h3 className="font-bold text-lg font-display mb-1 text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400">Linked to Role: <strong className="text-slate-200">{a.target_role}</strong></p>
                    <p className="text-xs text-slate-400 mt-1">Problems: <strong className="text-indigo-400">{a.problem_count} coding tasks</strong></p>
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-4">
                    <button
                      onClick={() => handleStartExam(a)}
                      className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all"
                    >
                      🚀 Start Assessment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
            <h2 className="text-lg font-bold font-display text-white">Global Coding Rankings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white font-semibold">
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Developer</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4 text-center">Solved</th>
                    <th className="py-2.5 px-4 text-center">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item.rank} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-indigo-400">#{item.rank}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{item.candidate_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{item.total_score} pts</td>
                      <td className="py-3 px-4 text-center font-mono">{item.total_solved} (E:{item.easy_solved} M:{item.medium_solved} H:{item.hard_solved})</td>
                      <td className="py-3 px-4 text-center font-mono">🔥 {item.streak}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MY PROFILE */}
        {activeTab === 'profile' && profileStats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-6 lg:col-span-1">
              <h2 className="text-lg font-bold font-display">Competence Statistics</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Total Code Points:</span>
                  <span className="font-bold text-emerald-400">{profileStats.total_score} pts</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Total Solved:</span>
                  <span className="font-bold text-white">{profileStats.total_solved}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Easy Solved:</span>
                  <span className="font-bold text-emerald-400">{profileStats.easy_solved}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="text-slate-400">Medium Solved:</span>
                  <span className="font-bold text-amber-400">{profileStats.medium_solved}</span>
                </div>
                <div className="flex justify-between pb-2 text-xs">
                  <span className="text-slate-400">Hard Solved:</span>
                  <span className="font-bold text-rose-400">{profileStats.hard_solved}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4 lg:col-span-2">
              <h2 className="text-lg font-bold font-display">Recent Solution Submissions</h2>
              <div className="space-y-2">
                {profileStats.recent_submissions?.map((s) => (
                  <div key={s.id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{s.problem_title}</p>
                      <p className="text-[10px] text-slate-500">{s.language} | {new Date(s.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      s.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
export default CodingPlayground
