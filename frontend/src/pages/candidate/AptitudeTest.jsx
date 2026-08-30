import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import { api } from '../../context/AuthContext'

// Comprehensive question database for Practice Mode
const PRACTICE_QUESTIONS = {
  numerical: [
    {
      id: 1,
      category: 'Numerical Ability',
      question: 'A train 125 m long passes a telegraph post in 10 seconds. What is the speed of the train in km/h?',
      options: ['36 km/h', '45 km/h', '54 km/h', '60 km/h'],
      correct: 1,
      correctText: '45 km/h',
      explanation: 'Speed = Distance / Time = 125 / 10 = 12.5 m/s. Convert to km/h: 12.5 * 18 / 5 = 45 km/h.'
    },
    {
      id: 2,
      category: 'Numerical Ability',
      question: 'A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. What is the sum?',
      options: ['Rs. 650', 'Rs. 690', 'Rs. 698', 'Rs. 700'],
      correct: 2,
      correctText: 'Rs. 698',
      explanation: 'Interest for 1 year = Rs. (854 - 815) = Rs. 39. Interest for 3 years = Rs. (39 * 3) = Rs. 117. Principal = Rs. (815 - 117) = Rs. 698.'
    },
    {
      id: 3,
      category: 'Numerical Ability',
      question: 'If 12 men or 18 women can do a work in 14 days, in how many days will 8 men and 16 women do the same work?',
      options: ['7 days', '8 days', '9 days', '10 days'],
      correct: 2,
      correctText: '9 days',
      explanation: '12 men = 18 women => 1 man = 1.5 women. 8 men + 16 women = 28 women. Days = (18 * 14) / 28 = 9 days.'
    },
    {
      id: 4,
      category: 'Numerical Ability',
      question: 'The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?',
      options: ['76 kg', '82 kg', '84 kg', '85 kg'],
      correct: 3,
      correctText: '85 kg',
      explanation: 'Total weight increased = 8 * 2.5 = 20 kg. Weight of the new person = 65 + 20 = 85 kg.'
    },
    {
      id: 5,
      category: 'Numerical Ability',
      question: 'Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. Find the smaller number.',
      options: ['27', '33', '49', '55'],
      correct: 1,
      correctText: '33',
      explanation: 'Let numbers be 3x and 5x. (3x - 9) / (5x - 9) = 12 / 23. Solving gives x = 11. Smaller number is 33.'
    }
  ],
  verbal: [
    {
      id: 6,
      category: 'Verbal Ability',
      question: 'Choose the word which is most opposite in meaning to "Spurious".',
      options: ['Genuine', 'Fake', 'Phony', 'Spiritual'],
      correct: 0,
      correctText: 'Genuine',
      explanation: 'Spurious means false or fake. Therefore, its antonym is Genuine.'
    },
    {
      id: 7,
      category: 'Verbal Ability',
      question: 'Complete the sentence: The department head was ______ because the team failed to meet the deadline.',
      options: ['elated', 'indifferent', 'exasperated', 'placated'],
      correct: 2,
      correctText: 'exasperated',
      explanation: 'Exasperated means intensely irritated or frustrated.'
    },
    {
      id: 8,
      category: 'Verbal Ability',
      question: 'Identify the grammatically correct sentence:',
      options: [
        'He is one of those men who does not tell lies.',
        'He is one of those men who do not tell lies.',
        'He is one of those man who does not tell lies.',
        'He is one of those men who did not told lies.'
      ],
      correct: 1,
      correctText: 'He is one of those men who do not tell lies.',
      explanation: 'The relative pronoun refers to the plural noun (men), so verb is plural (do).'
    }
  ],
  reasoning: [
    {
      id: 9,
      category: 'Reasoning Ability',
      question: 'Find the next number in the series: 3, 5, 9, 17, 33, ...',
      options: ['48', '50', '65', '68'],
      correct: 2,
      correctText: '65',
      explanation: 'Difference doubles: 2, 4, 8, 16, 32. 33 + 32 = 65.'
    },
    {
      id: 10,
      category: 'Reasoning Ability',
      question: 'If in a certain language, POPULAR is coded as QPQVMBS, how is FAMOUS coded in that code?',
      options: ['GBNPTT', 'GBNPVR', 'GCOPWV', 'GBNPVT'],
      correct: 3,
      correctText: 'GBNPVT',
      explanation: 'Each letter is shifted by +1.'
    }
  ]
}

export const AptitudeTest = () => {
  // Main Tab: 'job_assessments' | 'practice_arena' | 'leaderboard'
  const [activeTab, setActiveTab] = useState('job_assessments')

  // Job Assessments State
  const [jobAssessments, setJobAssessments] = useState([])
  const [loadingAssessments, setLoadingAssessments] = useState(false)

  // Waiting Room State
  const [waitingAssessment, setWaitingAssessment] = useState(null)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [launchCodeInput, setLaunchCodeInput] = useState('')
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [startingExam, setStartingExam] = useState(false)

  // Active Job Exam State
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [savedAnswers, setSavedAnswers] = useState({})
  const [remainingSeconds, setRemainingSeconds] = useState(1800)
  const [submittingExam, setSubmittingExam] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [examResult, setExamResult] = useState(null)

  // Practice Mode State (Preserved)
  const [practiceStats, setPracticeStats] = useState({
    personal_rank: 1,
    total_candidates: 1,
    personal_highest_percentage: 0,
    has_attempts: false
  })
  const [leaderboard, setLeaderboard] = useState([])
  const [practiceRunning, setPracticeRunning] = useState(false)
  const [practiceAnswers, setPracticeAnswers] = useState({})
  const [practiceTimeLeft, setPracticeTimeLeft] = useState(1800)
  const [practiceResult, setPracticeResult] = useState(null)

  // 1. Fetch Candidate's Job Assessments
  const fetchJobAssessments = async () => {
    setLoadingAssessments(true)
    try {
      const { data } = await api.get('/candidate/aptitude-assessments')
      setJobAssessments(data || [])
    } catch (err) {
      console.error('Error fetching candidate job assessments:', err)
    } finally {
      setLoadingAssessments(false)
    }
  }

  // 2. Fetch Practice Stats & Leaderboard
  const fetchPracticeStats = async () => {
    try {
      const [statsRes, lbRes] = await Promise.allSettled([
        api.get('/aptitude/stats'),
        api.get('/aptitude/leaderboard')
      ])
      if (statsRes.status === 'fulfilled') {
        setPracticeStats(statsRes.value.data)
      }
      if (lbRes.status === 'fulfilled') {
        setLeaderboard(lbRes.value.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchJobAssessments()
    fetchPracticeStats()
  }, [])

  // Check for any ongoing active attempt on mount
  useEffect(() => {
    const checkActiveAttempt = async () => {
      try {
        const { data } = await api.get('/candidate/aptitude-assessments')
        const active = (data || []).find(a => a.has_active_attempt && a.active_attempt_id)
        if (active) {
          const attemptRes = await api.get(`/candidate/aptitude-attempts/${active.active_attempt_id}`)
          if (attemptRes.data && attemptRes.data.status === 'IN_PROGRESS') {
            setActiveAttempt(attemptRes.data)
            setRemainingSeconds(attemptRes.data.remaining_seconds)
            setSavedAnswers(attemptRes.data.saved_answers || {})
            toast.success(`Resumed active exam: ${attemptRes.data.assessment_title}`)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    checkActiveAttempt()
  }, [])

  // Server-Side Timer Countdown Tick
  useEffect(() => {
    if (!activeAttempt || activeAttempt.status !== 'IN_PROGRESS') return

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto-submit on time expiry
          handleFinalSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeAttempt])

  // Waiting Room Handler
  const handleOpenWaitingRoom = async (assessment) => {
    setWaitingAssessment(assessment)
    setCheckingEligibility(true)
    setLaunchCodeInput('')
    try {
      const { data } = await api.get(`/candidate/aptitude-assessments/${assessment.id}/eligibility`)
      setEligibilityData(data)
      if (data.has_active_attempt && data.attempt_id) {
        // Resume active attempt
        const attemptRes = await api.get(`/candidate/aptitude-attempts/${data.attempt_id}`)
        setActiveAttempt(attemptRes.data)
        setRemainingSeconds(attemptRes.data.remaining_seconds)
        setSavedAnswers(attemptRes.data.saved_answers || {})
        setWaitingAssessment(null)
      }
    } catch (err) {
      toast.error('Failed to verify assessment eligibility')
    } finally {
      setCheckingEligibility(false)
    }
  }

  // Start Exam Handler
  const handleStartExam = async () => {
    if (!launchCodeInput.trim()) {
      toast.error('Please enter the 6-digit Launch Code')
      return
    }

    setStartingExam(true)
    try {
      const { data } = await api.post(`/candidate/aptitude-assessments/${waitingAssessment.id}/start`, {
        launch_code: launchCodeInput.trim()
      })
      setActiveAttempt(data)
      setRemainingSeconds(data.remaining_seconds)
      setSavedAnswers(data.saved_answers || {})
      setCurrentQIndex(0)
      setWaitingAssessment(null)
      toast.success('Exam started! Timer is now active.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid Launch Code or ineligible to start.')
    } finally {
      setStartingExam(false)
    }
  }

  // Answer Select & Auto-Save Handler
  const handleSelectAnswer = async (questionId, optionIndex) => {
    const updated = { ...savedAnswers, [questionId]: String(optionIndex) }
    setSavedAnswers(updated)

    try {
      await api.post(`/candidate/aptitude-attempts/${activeAttempt.attempt_id}/answer`, {
        question_id: questionId,
        selected_answer: String(optionIndex)
      })
    } catch (err) {
      console.error('Auto-save error:', err)
    }
  }

  // Final Exam Submission Handler
  const handleFinalSubmit = async (isAuto = false) => {
    setShowSubmitConfirm(false)
    setSubmittingExam(true)
    try {
      const { data } = await api.post(`/candidate/aptitude-attempts/${activeAttempt.attempt_id}/submit`)
      setExamResult(data)
      setActiveAttempt(null)
      fetchJobAssessments()
      fetchPracticeStats()
      if (isAuto) {
        toast('Time expired! Your assessment has been automatically submitted.', { icon: '⏰' })
      } else {
        toast.success('Assessment submitted and evaluated successfully!')
      }
    } catch (err) {
      toast.error('Failed to submit assessment')
    } finally {
      setSubmittingExam(false)
    }
  }

  // Practice Exam Handler (Preserved)
  const allPracticeQ = [...PRACTICE_QUESTIONS.numerical, ...PRACTICE_QUESTIONS.verbal, ...PRACTICE_QUESTIONS.reasoning]
  const handleStartPractice = () => {
    setPracticeAnswers({})
    setPracticeTimeLeft(1800)
    setPracticeRunning(true)
    setPracticeResult(null)
  }

  const handlePracticeSubmit = async () => {
    let score = 0
    allPracticeQ.forEach(q => {
      if (practiceAnswers[q.id] === q.correct) {
        score += 4
      }
    })
    const pct = roundTo(score / (allPracticeQ.length * 4) * 100, 2)
    try {
      await api.post('/aptitude/submit', {
        assessment_id: 'PRACTICE_SET_A',
        score,
        total_questions: allPracticeQ.length,
        percentage: pct
      })
      toast.success('Practice score saved!')
      fetchPracticeStats()
    } catch (err) {
      console.error(err)
    }
    setPracticeResult({ score, total: allPracticeQ.length * 4, pct })
    setPracticeRunning(false)
  }

  const roundTo = (num, decimals) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: ACTIVE LIVE EXAM SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (activeAttempt && activeAttempt.status === 'IN_PROGRESS') {
    const currentQ = activeAttempt.questions[currentQIndex]
    const isAnswered = (qId) => savedAnswers[qId] !== undefined && savedAnswers[qId] !== ''
    const answeredCount = Object.keys(savedAnswers).filter(k => savedAnswers[k] !== '').length

    return (
      <div className="page-enter pb-16 space-y-6 max-w-6xl mx-auto">
        
        {/* Top Floating Exam Header Bar */}
        <div className="card p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-20 z-30">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Active Assessment Examination
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              {activeAttempt.assessment_title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Server-Side Enforced Timer */}
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono font-extrabold text-base ${
              remainingSeconds < 300
                ? 'bg-rose-50 border border-rose-200 text-rose-600 animate-pulse'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              <span>⏱️</span>
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="btn-primary text-xs font-bold py-2 px-4 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-xs"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Exam Layout: Question Area (Left) + Question Palette (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Question Panel */}
          <div className="lg:col-span-8 space-y-5">
            <div className="card p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              
              {/* Question Header Info */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    Question {currentQIndex + 1} of {activeAttempt.questions.length}
                  </span>
                  <span className="badge badge-blue text-[10px] font-bold">{currentQ?.category}</span>
                  <span className="badge badge-gray text-[10px]">{currentQ?.difficulty}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  +{currentQ?.marks} mark / -{currentQ?.negative_marks} neg
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                {currentQ?.question_text}
              </div>

              {/* Options Selection */}
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((optionText, optIdx) => {
                  const isSelected = savedAnswers[currentQ.id] === String(optIdx)
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-xs sm:text-sm">{optionText}</span>
                    </div>
                  )
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  className="btn-secondary text-xs font-bold py-2 px-4 disabled:opacity-40"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {savedAnswers[currentQ?.id] !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleSelectAnswer(currentQ.id, '')}
                      className="text-xs text-rose-600 hover:underline font-semibold px-2"
                    >
                      Clear Choice
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (currentQIndex < activeAttempt.questions.length - 1) {
                        setCurrentQIndex(prev => prev + 1)
                      } else {
                        setShowSubmitConfirm(true)
                      }
                    }}
                    className="btn-primary text-xs font-bold py-2 px-4"
                  >
                    {currentQIndex < activeAttempt.questions.length - 1 ? 'Save & Next →' : 'Review & Submit'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Question Palette */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Question Palette
                </h3>
                <span className="text-xs font-bold text-teal-700">
                  {answeredCount} / {activeAttempt.questions.length} Answered
                </span>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-teal-600"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300"></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Numbers Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {activeAttempt.questions.map((q, idx) => {
                  const answered = isAnswered(q.id)
                  const isCurrent = currentQIndex === idx
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'ring-2 ring-blue-600 ring-offset-1 font-extrabold ' + (answered ? 'bg-teal-600 text-white' : 'bg-blue-100 text-blue-800')
                          : answered
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="btn-primary w-full py-2.5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                >
                  ✓ Submit Assessment Test
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-6 space-y-4 rounded-2xl shadow-xl bg-white border border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">Submit Assessment Test?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have answered <strong>{answeredCount}</strong> out of <strong>{activeAttempt.questions.length}</strong> questions.
                Unanswered questions will receive 0 marks. Negative marking applies for incorrect answers.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Answered</span>
                  <span className="font-extrabold text-emerald-600">{answeredCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining</span>
                  <span className="font-extrabold text-slate-700">{activeAttempt.questions.length - answeredCount}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="btn-secondary text-xs font-bold"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  disabled={submittingExam}
                  onClick={() => handleFinalSubmit(false)}
                  className="btn-primary text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                >
                  {submittingExam ? 'Submitting & Evaluating...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: EXAM RESULT REPORT VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (examResult) {
    return (
      <div className="page-enter pb-16 space-y-6 max-w-4xl mx-auto">
        <div className="card bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="badge badge-blue text-xs font-bold">Official Assessment Result</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1 font-display">
                {examResult.assessment_title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Submitted at {examResult.submitted_at || 'Recently'}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-extrabold border ${
                examResult.is_passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {examResult.is_passed ? '✓ PASSED' : '✕ FAILED'}
              </span>
            </div>
          </div>

          {/* Primary Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Score</span>
              <span className="text-2xl font-extrabold text-blue-600 font-mono">{examResult.score} / {examResult.total_marks}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
              <span className="text-2xl font-extrabold text-teal-700 font-mono">{examResult.percentage}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
              <span className="text-2xl font-extrabold text-slate-800 font-mono">{examResult.accuracy}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Taken</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">{examResult.time_taken_formatted}</span>
            </div>
          </div>

          {/* Correct / Wrong Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Correct</span>
              <span className="text-base font-extrabold text-emerald-600">+{examResult.correct_count}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Incorrect</span>
              <span className="text-base font-extrabold text-rose-600">-{examResult.wrong_count}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Unanswered</span>
              <span className="text-base font-extrabold text-slate-500">{examResult.unanswered_count}</span>
            </div>
          </div>

          {/* Section-Wise Breakdown */}
          {examResult.section_breakdown && Object.keys(examResult.section_breakdown).length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Section-Wise Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(examResult.section_breakdown).map(([secName, secData]) => (
                  <div key={secName} className="p-3.5 rounded-xl border border-slate-200 space-y-1.5 bg-white">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{secName}</span>
                      <span className="text-teal-700 font-mono">{secData.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${secData.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                      <span>{secData.correct} Correct · {secData.wrong} Wrong</span>
                      <span>{secData.earned_marks} / {secData.possible_marks} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setExamResult(null)
                fetchJobAssessments()
              }}
              className="btn-primary text-xs font-bold py-2.5 px-6"
            >
              ← Back to Assessments Hub
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 3: MAIN ASSESSMENT DASHBOARD & WAITING ROOM
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter pb-16 space-y-8 max-w-7xl mx-auto">
      
      {/* Hero Banner */}
      <div className="card bg-gradient-to-r from-teal-50/70 via-indigo-50/50 to-blue-50/60 border border-teal-100/90 p-6 sm:p-8 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/90 px-3 py-0.5 rounded-full border border-teal-200">
                Skill Arena · Aptitude Track
              </span>
              <span className="badge badge-emerald font-bold">Secure Job-Linked Assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              🧠 Aptitude Assessment & Practice Arena
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Take formal, scheduled aptitude tests for jobs you have applied to, or practice in the open aptitude arena with numerical, verbal, and logical reasoning sets.
            </p>
          </div>

          {/* Overall Stats summary */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-white border border-teal-100 text-center shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Personal Rank</span>
              <span className="text-lg font-extrabold text-teal-700 font-mono">#{practiceStats.personal_rank}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-teal-100 text-center shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Score</span>
              <span className="text-lg font-extrabold text-blue-600 font-mono">{practiceStats.personal_highest_percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('job_assessments')}
          className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'job_assessments'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🏢</span> Job-Specific Assessments ({jobAssessments.length})
        </button>

        <button
          onClick={() => setActiveTab('practice_arena')}
          className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'practice_arena'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🎯</span> Practice Arena (TCS NQT Sets)
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-2 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'text-teal-700 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🏆</span> Leaderboard & Cohort Rank
        </button>
      </div>

      {/* TAB 1: JOB-SPECIFIC ASSESSMENTS */}
      {activeTab === 'job_assessments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="section-title !mb-0 text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>📋</span> Assessments for Your Applied Jobs
            </h2>
            <span className="text-xs text-slate-400 font-medium">Application-based eligibility</span>
          </div>

          {loadingAssessments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton h-44 rounded-2xl"></div>
              <div className="skeleton h-44 rounded-2xl"></div>
            </div>
          ) : jobAssessments.length === 0 ? (
            <div className="card py-12 text-center space-y-3">
              <div className="text-4xl">💼</div>
              <h3 className="text-base font-bold text-slate-800">No Job Assessments Available</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You do not have any active aptitude tests for your job applications yet. Apply to open jobs to receive recruiter assessments or practice below.
              </p>
              <button
                onClick={() => setActiveTab('practice_arena')}
                className="btn-primary btn-sm text-xs font-bold"
              >
                Go to Practice Arena
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobAssessments.map((a) => (
                <div
                  key={a.id}
                  className="card border-2 border-slate-200 hover:border-teal-300 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-blue text-[10px] font-bold">{a.company}</span>
                      <span className={`badge ${a.is_completed ? 'badge-emerald' : 'badge-amber'} text-[10px] font-bold`}>
                        {a.is_completed ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-semibold">{a.job_title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                        <span className="font-bold text-slate-800">{a.duration_minutes} Mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                        <span className="font-bold text-slate-800">{a.total_marks} Marks</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Negative Mark</span>
                        <span className="font-bold text-rose-600">-{a.negative_marking} mark</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                        <span className="font-bold text-teal-700 font-mono">
                          {a.percentage !== null && a.percentage !== undefined ? `${a.percentage}%` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenWaitingRoom(a)}
                      className={`btn-primary w-full py-2.5 text-xs font-bold ${
                        a.is_completed
                          ? '!bg-slate-700 hover:!bg-slate-800'
                          : '!bg-teal-600 hover:!bg-teal-700 !border-teal-600'
                      }`}
                    >
                      {a.is_completed ? '📄 Retake / View Waiting Room' : '🚀 Enter Waiting Room & Launch'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRACTICE ARENA (PRESERVED) */}
      {activeTab === 'practice_arena' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">General Aptitude Practice Set</h3>
                <p className="text-xs text-slate-500">Practice standard aptitude test with Numerical, Verbal, and Logical questions.</p>
              </div>
              <button
                onClick={handleStartPractice}
                className="btn-primary text-xs font-bold py-2 px-5 !bg-teal-600 hover:!bg-teal-700"
              >
                {practiceRunning ? 'Restart Practice Test' : '▶ Start Practice Test'}
              </button>
            </div>

            {practiceRunning ? (
              <div className="space-y-6 pt-2">
                <div className="space-y-5">
                  {allPracticeQ.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900">Q{idx + 1}. {q.question}</span>
                        <span className="badge badge-blue text-[10px]">{q.category}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            onClick={() => setPracticeAnswers({ ...practiceAnswers, [q.id]: optIdx })}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              practiceAnswers[q.id] === optIdx
                                ? 'bg-teal-100 border-teal-500 font-bold text-teal-900'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="mr-2 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handlePracticeSubmit}
                    className="btn-primary text-xs font-bold py-2.5 px-6 !bg-emerald-600 hover:!bg-emerald-700"
                  >
                    Submit Practice Test
                  </button>
                </div>
              </div>
            ) : practiceResult ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <span className="text-2xl">🎉</span>
                <h4 className="font-bold text-slate-900">Practice Test Completed!</h4>
                <div className="text-xl font-extrabold text-emerald-700 font-mono">
                  Score: {practiceResult.score} / {practiceResult.total} ({practiceResult.pct}%)
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Click "Start Practice Test" to begin practicing standard industry aptitude questions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD & COHORT RANK */}
      {activeTab === 'leaderboard' && (
        <div className="card p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">🏆 Candidate Assessment Leaderboard</h3>
            <p className="text-xs text-slate-500">Real-time ranking of candidates across all practice assessments.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Best Score</th>
                  <th className="p-3">Percentile</th>
                  <th className="p-3">Last Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((item) => (
                  <tr key={item.rank} className={item.is_current_user ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'}>
                    <td className="p-3 font-mono font-bold">
                      {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : `#${item.rank}`}
                    </td>
                    <td className="p-3">
                      {item.name} {item.is_current_user && <span className="badge badge-blue text-[9px] ml-1.5">You</span>}
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-600">{item.percentage}%</td>
                    <td className="p-3 font-mono text-slate-600">{item.percentile}th</td>
                    <td className="p-3 text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WAITING ROOM & LAUNCH CODE MODAL */}
      {waitingAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 space-y-5 rounded-2xl shadow-xl bg-white border border-slate-200">
            
            {/* Waiting Room Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">Assessment Waiting Room</span>
                <h3 className="text-lg font-extrabold text-slate-900">{waitingAssessment.title}</h3>
              </div>
              <button
                onClick={() => setWaitingAssessment(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {checkingEligibility ? (
              <div className="py-8 text-center text-xs text-slate-400">Verifying application eligibility...</div>
            ) : eligibilityData && !eligibilityData.eligible ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <span className="font-bold block">Ineligible to Take Assessment:</span>
                <p>{eligibilityData.reason}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* 5-Minute Launch Code Display Box */}
                {eligibilityData?.launch_code_revealed ? (
                  <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-center space-y-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-teal-800 block">Exam Launch Code</span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-900 tracking-widest">
                      {eligibilityData.revealed_launch_code || '847291'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLaunchCodeInput(eligibilityData.revealed_launch_code || '847291')}
                      className="text-[11px] text-teal-700 font-bold hover:underline"
                    >
                      Click to Auto-Fill Launch Code
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-1">
                    <span className="font-bold block">Launch Code Available Soon</span>
                    <p className="text-[11px]">
                      The 6-digit Launch Code will be displayed here 5 minutes before the exam window begins.
                    </p>
                  </div>
                )}

                {/* Launch Code Input */}
                <div>
                  <label className="label font-bold text-slate-700">Enter 6-Digit Launch Code *</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={launchCodeInput}
                    onChange={(e) => setLaunchCodeInput(e.target.value)}
                    placeholder="e.g. 847291"
                    className="input text-center font-mono font-extrabold text-lg tracking-widest uppercase"
                  />
                </div>

                {/* Test Rules Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div>• Duration: <strong>{eligibilityData?.duration_minutes || 30} minutes</strong> (Server-enforced timer)</div>
                  <div>• Negative Marking: <strong>-{eligibilityData?.negative_marking || 0.5}</strong> marks per wrong answer</div>
                  <div>• Auto-Save: Answers are saved in real-time as you select them</div>
                  <div>• Refresh-Proof: Reopening this page resumes your active exam</div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={startingExam || !launchCodeInput.trim()}
                    onClick={handleStartExam}
                    className="btn-primary w-full py-2.5 text-xs font-bold !bg-teal-600 hover:!bg-teal-700 disabled:opacity-50"
                  >
                    {startingExam ? 'Verifying & Starting Exam...' : '▶ Start Examination Now'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
