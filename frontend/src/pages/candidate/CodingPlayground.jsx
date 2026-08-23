import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'

export const CodingPlayground = () => {
  const [activeTab, setActiveTab] = useState('practice') // 'practice' | 'assessments' | 'leaderboard' | 'profile'
  const [problems, setProblems] = useState([])
  const [loadingProblems, setLoadingProblems] = useState(false)
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
    javascript: (func) => `class Solution {\n    ${func || 'twoSum'}(nums, target) {\n        // Write your solution\n        return [];\n    }\n}\n`,
    java: (func) => `class Solution {\n    public int[] ${func || 'twoSum'}(int[] nums, int target) {\n        // Write your solution\n        return new int[]{};\n    }\n}\n`,
    cpp: (func) => `#include <vector>\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${func || 'twoSum'}(vector<int>& nums, int target) {\n        // Write your solution\n        return {};\n    }\n};\n`,
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
    setLoadingProblems(true)
    try {
      const params = {}
      if (category !== 'All') params.category = category
      if (difficulty !== 'All') params.difficulty = difficulty
      if (search) params.search = search

      const { data } = await api.get('/coding/problems', { params })
      const list = Array.isArray(data) ? data : []
      setProblems(list)
      if (list.length > 0) {
        if (!selectedQuestion || !list.some(p => p.id === selectedQuestion.id)) {
          loadProblemDetail(list[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingProblems(false)
    }
  }

  const loadProblemDetail = async (id) => {
    try {
      const { data } = await api.get(`/coding/problems/${id}`)
      setSelectedQuestion(data)

      if (data.saved_code) {
        if (data.saved_language && (['python', 'javascript', 'java', 'cpp'].includes(data.saved_language))) {
          setLanguage(data.saved_language)
        }
        setCode(data.saved_code)
      } else {
        const cacheKey = `${data.id}_${language}`
        const cached = localCodeCache[cacheKey]
        const starterKey = `starter_code_${language}`
        setCode(cached !== undefined ? cached : (data[starterKey] || (STARTER_CODES[language] ? STARTER_CODES[language](data?.function_name) : '')))
      }

      setEvalResult(null)
      setAiHint('')
      setHintLevel(1)
    } catch (err) {
      toast.error('Failed to load problem details')
    }
  }

  const handleResetCode = () => {
    if (!selectedQuestion) return
    const starterKey = `starter_code_${language}`
    const starter = selectedQuestion[starterKey] || (STARTER_CODES[language] ? STARTER_CODES[language](selectedQuestion?.function_name) : '')
    setCode(starter)
    toast.success('Reset editor to starter template')
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
      if (data.status === 'Accepted') toast.success('Sample test cases passed!')
      else toast.error(`Result: ${data.status}`)
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
        toast.success('Congratulations! All test cases passed!')
        setSelectedQuestion(prev => ({
          ...prev,
          is_solved: true,
          saved_code: code,
          saved_language: language,
        }))
        fetchProblems()
        fetchProfile()
        fetchLeaderboard()
      } else {
        toast.error(`Verdict: ${data.status}`)
        fetchProblems()
        fetchProfile()
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

      const elapsedSec = Math.floor((new Date() - new Date(startRes.data.started_at)) / 1000)
      const durationSec = assessment.time_limit_minutes * 60
      setTimeLeft(Math.max(0, durationSec - elapsedSec))

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
      toast.success('Coding Assessment Started. Good luck!')
    } catch (err) {
      toast.error('Failed to start assessment')
    }
  }

  const handleAssessmentProblemSelect = (index) => {
    const currentProbId = assessmentProblems[selectedAssessmentProbIndex].id
    setAssessmentAnswers(prev => ({
      ...prev,
      [currentProbId]: { language, code }
    }))

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
      const starterKey = `starter_code_${lang}`
      if (examMode) {
        setCode(prob[starterKey] || (STARTER_CODES[lang] ? STARTER_CODES[lang](prob?.function_name) : ''))
      } else {
        const cacheKey = `${prob.id}_${lang}`
        const cached = localCodeCache[cacheKey]
        setCode(cached !== undefined ? cached : (prob[starterKey] || (STARTER_CODES[lang] ? STARTER_CODES[lang](prob?.function_name) : '')))
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
      toast.success(`Assessment submitted! Score: ${data.score}%`)
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

  const diffBadge = (d) => d === 'Easy' ? 'badge-green' : d === 'Medium' ? 'badge-orange' : 'badge-red'

  // --- RENDERING ---

  if (examMode) {
    const currentProb = assessmentProblems[selectedAssessmentProbIndex]
    return (
      <div className="fixed inset-0 bg-page z-50 flex flex-col">
        {/* Exam Focused Header */}
        <header className="bg-white border-b border-line px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-err animate-pulse"></span>
            <div>
              <h1 className="text-[15px] font-bold text-ink">{currentAssessment?.title}</h1>
              <p className="text-[11px] text-ink-3">Do not close or refresh this tab</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm font-bold ${
              timeLeft < 300 ? 'bg-err-bg border-err/25 text-err' : 'bg-page border-line text-ink'
            }`}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmitExamManual} disabled={submittingExam} className="btn-primary btn-sm !px-5">
              {submittingExam ? 'Submitting...' : 'Finish & Submit'}
            </button>
          </div>
        </header>

        {/* Workspace Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel */}
          <div className="w-1/3 bg-white border-r border-line flex flex-col">
            <div className="p-4 border-b border-line space-y-2">
              <label className="block text-[10px] text-ink-3 uppercase font-semibold tracking-wider">Assessment Questions</label>
              <div className="flex flex-col gap-1.5">
                {assessmentProblems.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssessmentProblemSelect(idx)}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      selectedAssessmentProbIndex === idx
                        ? 'bg-brand-light border-brand/30 text-brand'
                        : 'bg-white border-line text-ink-2 hover:bg-page'
                    }`}
                  >
                    Q{idx + 1}: {p.title} ({p.difficulty})
                  </button>
                ))}
              </div>
            </div>

            {/* Problem description */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {currentProb && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-ink leading-snug">{currentProb.title}</h2>
                    <span className="skill-pill mt-2 inline-block">{currentProb.category}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-2 leading-relaxed whitespace-pre-line bg-page p-4 rounded-lg border border-line">
                    {currentProb.description}
                  </div>
                  {currentProb.constraints && (
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Constraints</h4>
                      <pre className="bg-page border border-line p-3 rounded-lg font-mono text-[11px] text-ink-2 whitespace-pre-wrap">{currentProb.constraints}</pre>
                    </div>
                  )}
                  {currentProb.sample_input && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">Sample Input</h4>
                        <pre className="bg-page border border-line p-3 rounded-lg font-mono text-[11px] text-ink">{currentProb.sample_input}</pre>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider mb-1">Sample Output</h4>
                        <pre className="bg-ok-bg border border-ok/15 p-3 rounded-lg font-mono text-[11px] text-ok">{currentProb.sample_output}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right panel: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-line px-6 py-2.5 flex items-center gap-4">
              <span className="text-xs text-ink-3">Language:</span>
              <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="input !w-auto !py-1.5 !text-xs">
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ (GCC)</option>
              </select>
            </div>

            <div className="flex-1 min-h-[300px]">
              <Editor
                key={`${currentProb?.id}_${language}`}
                height="100%"
                language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : language === 'cpp' ? 'cpp' : 'java'}
                theme="vs"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollbar: { verticalScrollbarSize: 8 },
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  suggestOnTriggerCharacters: true
                }}
              />
            </div>

            {/* Footer console */}
            <div className="bg-white border-t border-line p-4 space-y-3">
              {evalResult && (
                <div className={`p-4 rounded-lg border text-xs ${
                  evalResult.status === 'Accepted' ? 'bg-ok-soft border-ok/20' : 'bg-bad-soft border-bad/20'
                }`}>
                  <div className="flex items-center justify-between font-semibold mb-1.5">
                    <span className={evalResult.status === 'Accepted' ? 'text-ok' : 'text-bad'}>
                      {evalResult.status === 'Accepted' ? '✓' : '✗'} {evalResult.status}
                    </span>
                    <span className="text-ink-muted font-mono">{evalResult.execution_time}s</span>
                  </div>
                  {evalResult.error_message && (
                    <pre className="bg-white p-3 rounded-md font-mono text-[11px] text-bad whitespace-pre-wrap border border-line">{evalResult.error_message}</pre>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={handleRunCode} disabled={running} className="btn-secondary btn-sm">
                  {running ? 'Running…' : '⚙ Run Sample Tests'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- PRACTICE & NORMAL VIEWS ---

  const tabs = [
    { id: 'practice', label: 'Practice' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'profile', label: 'My Progress' },
  ]

  return (
    <div className="page-enter pb-8">

      {/* Header */}
      <header className="mb-5">
        <h1 className="page-title mb-1">Coding Practice</h1>
        <p className="text-sm text-ink-2">Solve problems in sandboxed Python & Java environments.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 -mb-px text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRACTICE */}
      {activeTab === 'practice' && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Problem list */}
          <div className="w-full lg:w-[340px] shrink-0 space-y-4">
            <div className="card !p-4 space-y-3">
              <input type="text" placeholder="Search problems..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
              <div className="grid grid-cols-2 gap-2">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input !py-2 !text-xs">
                  <option value="All">All Difficulties</option>
                  {DIFFICULTIES.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input !py-2 !text-xs">
                  <option value="All">All Topics</option>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-ink-3 font-medium">
              <span>{problems.length} problems</span>
              {(category !== 'All' || difficulty !== 'All' || search) && (
                <button onClick={() => { setCategory('All'); setDifficulty('All'); setSearch('') }} className="text-brand hover:underline">
                  Reset filters
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {loadingProblems ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16"></div>)}
                </div>
              ) : problems.length === 0 ? (
                <div className="card empty-state">
                  <h3>No Problems Found</h3>
                  <p className="text-[13px] mb-4">Try changing your search or filters.</p>
                  <button onClick={() => { setCategory('All'); setDifficulty('All'); setSearch('') }} className="btn-secondary btn-sm mx-auto">Clear Filters</button>
                </div>
              ) : (
                problems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProblemDetail(p.id)}
                    className={`w-full card-flat !p-3.5 text-left transition-all cursor-pointer ${
                      selectedQuestion?.id === p.id
                        ? '!bg-brand-light !border-brand/30'
                        : 'hover:!border-brand/25 hover:bg-page'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p.is_solved && <span className="text-ok font-bold text-xs shrink-0" title="Solved">✓</span>}
                        <span className="font-semibold text-[13px] text-ink truncate">{p.title}</span>
                      </div>
                      <span className={`badge ${diffBadge(p.difficulty)} shrink-0`}>{p.difficulty}</span>
                    </div>
                    <div className="text-[11px] text-ink-3">{p.category}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Workspace: description + editor */}
          <div className="flex-1 flex flex-col lg:flex-row gap-0 bg-white border border-line rounded-xl overflow-hidden shadow-card min-h-[640px]">

            {/* LEFT: description */}
            <div className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-line overflow-y-auto">
              {selectedQuestion && (
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedQuestion.is_solved && <span className="text-ok font-bold" title="Solved">✓</span>}
                      <h2 className="text-[15px] font-bold text-ink leading-snug">{selectedQuestion.title}</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`badge ${diffBadge(selectedQuestion.difficulty)}`}>{selectedQuestion.difficulty}</span>
                      <span className="badge badge-gray">{selectedQuestion.category}</span>
                      <span className="badge badge-blue">⏱ {selectedQuestion.time_limit_seconds || 2}s limit</span>
                    </div>
                  </div>

                  <div className="text-[12.5px] text-ink-2 leading-relaxed line-clamp-4">
                    {selectedQuestion.description}
                  </div>

                  {selectedQuestion.constraints && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider mb-1">Constraints</h4>
                      <pre className="bg-page border border-line p-2.5 rounded-lg font-mono text-[10.5px] text-ink-2 whitespace-pre-wrap leading-relaxed">{selectedQuestion.constraints}</pre>
                    </div>
                  )}

                  {selectedQuestion.sample_input && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">Example</h4>
                      <div className="bg-page border border-line rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
                        <div className="text-ink-3">Input:</div>
                        <div className="text-ink">{selectedQuestion.sample_input}</div>
                        <div className="text-ink-3 mt-1">Output:</div>
                        <div className="text-ok">{selectedQuestion.sample_output}</div>
                      </div>
                    </div>
                  )}

                  {/* AI Hint */}
                  <div className="pt-3 border-t border-line space-y-2">
                    <button
                      onClick={handleGetHint}
                      disabled={loadingHint}
                      className="btn-secondary btn-sm w-full"
                    >
                      {loadingHint ? 'Thinking…' : `💡 AI Hint (${hintLevel}/4)`}
                    </button>
                    {aiHint && (
                      <div className="bg-brand-light border border-brand/15 p-3 rounded-lg text-[12px] text-ink-2 leading-relaxed">
                        <strong className="text-brand block mb-1 text-[10px] uppercase tracking-wider">AI Hint</strong>
                        {aiHint}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedQuestion?.is_solved ? (
                <div className="bg-ok-bg border-b border-ok/15 px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-ok font-semibold">✓ Solved — your saved solution is loaded.</span>
                  <button onClick={handleResetCode} className="text-ink-3 hover:text-ink underline text-[11px]">Reset to starter code</button>
                </div>
              ) : selectedQuestion?.saved_code ? (
                <div className="bg-brand-light border-b border-brand/15 px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-brand font-semibold">📝 Previous submission loaded.</span>
                  <button onClick={handleResetCode} className="text-ink-3 hover:text-ink underline text-[11px]">Reset to starter code</button>
                </div>
              ) : null}

              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-white gap-2">
                <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="input !w-auto !py-1.5 !text-xs">
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node)</option>
                  <option value="java">Java 17</option>
                  <option value="cpp">C++ (GCC)</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleResetCode} className="btn-ghost btn-sm" title="Reset to starter template">↺ Reset</button>
                  <button onClick={handleRunCode} disabled={running || submitting} className="btn-primary btn-sm disabled:opacity-50">
                    {running ? 'Running…' : 'Run Code'}
                  </button>
                  <button onClick={handleSubmitCode} disabled={running || submitting} className="btn-primary btn-sm disabled:opacity-50">
                    {submitting ? 'Submitting…' : 'Submit Code'}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[420px]">
                <Editor
                  key={`${selectedQuestion?.id}_${language}`}
                  height="100%"
                  language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : language === 'cpp' ? 'cpp' : 'java'}
                  theme="vs"
                  value={code}
                  onChange={handleCodeChange}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollbar: { verticalScrollbarSize: 6 },
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    padding: { top: 12, bottom: 12 },
                    suggestOnTriggerCharacters: true,
                  }}
                />
              </div>

              {/* Test results console */}
              {evalResult && (
                <div className={`border-t px-4 py-3.5 text-xs ${
                  evalResult.status === 'Accepted'
                    ? 'bg-ok-soft border border-ok/20'
                    : 'bg-bad-soft border-b-0 border-l-0 border-r-0 border-bad/20'
                }`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className={`text-sm ${evalResult.status === 'Accepted' ? 'text-ok' : 'text-bad'}`}>
                      {evalResult.status === 'Accepted' ? '✓ Accepted' : '✗ Wrong Answer'}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-soft">
                      {evalResult.passed_test_cases}/{evalResult.total_test_cases} Test Cases Passed
                    </span>
                  </div>

                  {(evalResult.runtime || evalResult.execution_time || evalResult.memory || evalResult.coding_score != null || (evalResult.points_earned != null || evalResult.points != null)) && (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-ink-soft">
                      {(evalResult.runtime || evalResult.execution_time) && (
                        <span>Runtime: <strong className="text-ink font-mono">{evalResult.runtime || evalResult.execution_time}s</strong></span>
                      )}
                      {evalResult.memory != null && evalResult.memory !== '' && (
                        <span>Memory: <strong className="text-ink font-mono">{evalResult.memory}</strong></span>
                      )}
                      {evalResult.coding_score != null && (
                        <span>Coding Score: <strong className="text-ink font-mono">{evalResult.coding_score}</strong></span>
                      )}
                      {(evalResult.points_earned != null || evalResult.points != null) && (
                        <span>Points: <strong className="text-ink font-mono">+{evalResult.points_earned ?? evalResult.points}</strong></span>
                      )}
                    </div>
                  )}

                  {evalResult.error_message && (
                    <pre className="font-mono text-[10.5px] text-ink-soft whitespace-pre-wrap mt-2 max-h-24 overflow-y-auto bg-white rounded-md border border-line p-2.5">{evalResult.error_message}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        assignedAssessments.length === 0 ? (
          <div className="card empty-state">
            <svg className="w-12 h-12 mx-auto mb-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h3>No Assessments Assigned</h3>
            <p className="text-sm mb-4">Recruiter exams will appear here once assigned to you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignedAssessments.map((a) => (
              <div key={a.id} className="card card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge-blue">{a.difficulty}</span>
                    <span className="text-xs text-ink-3">⏱ {a.time_limit_minutes}m</span>
                  </div>
                  <h3 className="font-semibold text-ink text-[15px] mb-1">{a.title}</h3>
                  <p className="text-xs text-ink-2">Role: <strong className="text-ink">{a.target_role}</strong></p>
                  <p className="text-xs text-ink-2 mt-0.5">{a.problem_count} coding tasks</p>
                </div>
                <div className="pt-4 mt-4 border-t border-line">
                  <button onClick={() => handleStartExam(a)} className="btn-primary btn-sm w-full">
                    Start Assessment →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 3: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <h2 className="section-title !text-[17px]">Coding Leaderboard</h2>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Solved</th>
                  <th>Points</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.rank}>
                    <td className="font-bold text-ink">#{item.rank}</td>
                    <td className="font-semibold text-ink">{item.candidate_name}</td>
                    <td>
                      <span className="font-mono">{item.total_solved}</span>
                      <span className="text-[11px] text-ink-3 ml-1.5">(E:{item.easy_solved} M:{item.medium_solved} H:{item.hard_solved})</span>
                    </td>
                    <td><span className="badge badge-green">{item.total_score} pts</span></td>
                    <td className="font-mono">{item.streak}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MY PROGRESS */}
      {activeTab === 'profile' && profileStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="section-title !text-[16px] !mb-0">Coding Progress</h2>
              <span className="badge badge-blue">Rank #{profileStats.rank || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-page rounded-lg p-3.5">
                <div className="text-[11px] text-ink-3 uppercase font-semibold tracking-wide">Solved</div>
                <div className="text-2xl font-bold text-ink">{profileStats.problems_solved || profileStats.total_solved || 0}</div>
              </div>
              <div className="bg-page rounded-lg p-3.5">
                <div className="text-[11px] text-ink-3 uppercase font-semibold tracking-wide">Points</div>
                <div className="text-2xl font-bold text-brand">{profileStats.points || profileStats.total_score || 0}</div>
              </div>
              <div className="bg-page rounded-lg p-3.5">
                <div className="text-[11px] text-ink-3 uppercase font-semibold tracking-wide">Accuracy</div>
                <div className="text-2xl font-bold text-ok">{profileStats.accuracy || 0}%</div>
              </div>
              <div className="bg-page rounded-lg p-3.5">
                <div className="text-[11px] text-ink-3 uppercase font-semibold tracking-wide">Rank</div>
                <div className="text-2xl font-bold text-ink">#{profileStats.rank || '-'}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-ink-2">Easy</span><span className="badge badge-green">{profileStats.easy_solved || 0}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Medium</span><span className="badge badge-orange">{profileStats.medium_solved || 0}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">Hard</span><span className="badge badge-red">{profileStats.hard_solved || 0}</span></div>
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="section-title !text-[16px] mb-4">Recent Submissions</h2>
            <div className="space-y-2">
              {profileStats.recent_submissions?.length > 0 ? (
                profileStats.recent_submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-page rounded-lg px-4 py-3">
                    <div>
                      <p className="font-semibold text-[13px] text-ink">{s.problem_title}</p>
                      <p className="text-[11px] text-ink-3 capitalize">{s.language} · {new Date(s.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`badge ${s.status === 'ACCEPTED' ? 'badge-green' : 'badge-red'}`}>
                      {s.status === 'ACCEPTED' ? '✓ Accepted' : s.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state !py-8">
                  <h3>No Submissions Yet</h3>
                  <p className="text-[13px]">Start solving problems to build your coding profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default CodingPlayground
