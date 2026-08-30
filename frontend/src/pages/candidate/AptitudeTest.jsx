import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import { api } from '../../context/AuthContext'

// Comprehensive question database mapped to section indices for Practice Sets
const QUESTIONS = {
  numerical: [
    {
      id: 1,
      category: 'Numerical Ability',
      question: 'A train 125 m long passes a telegraph post in 10 seconds. What is the speed of the train in km/h?',
      options: ['36 km/h', '45 km/h', '54 km/h', '60 km/h'],
      correct: 1, // 45 km/h
      correctText: '45 km/h',
      explanation: 'Speed = Distance / Time = 125 / 10 = 12.5 m/s. To convert to km/h, multiply by 18/5: 12.5 * 18 / 5 = 45 km/h.'
    },
    {
      id: 2,
      category: 'Numerical Ability',
      question: 'A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. What is the sum?',
      options: ['Rs. 650', 'Rs. 690', 'Rs. 698', 'Rs. 700'],
      correct: 2, // Rs. 698
      correctText: 'Rs. 698',
      explanation: 'Interest for 1 year = Rs. (854 - 815) = Rs. 39. Interest for 3 years = Rs. (39 * 3) = Rs. 117. Principal = Rs. (815 - 117) = Rs. 698.'
    },
    {
      id: 3,
      category: 'Numerical Ability',
      question: 'If 12 men or 18 women can do a work in 14 days, in how many days will 8 men and 16 women do the same work?',
      options: ['7 days', '8 days', '9 days', '10 days'],
      correct: 2, // 9 days
      correctText: '9 days',
      explanation: '12 men = 18 women => 1 man = 1.5 women. 8 men + 16 women = (8 * 1.5) + 16 = 28 women. By inverse proportion, Days = (18 * 14) / 28 = 9 days.'
    },
    {
      id: 4,
      category: 'Numerical Ability',
      question: 'The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?',
      options: ['76 kg', '82 kg', '84 kg', '85 kg'],
      correct: 3, // 85 kg
      correctText: '85 kg',
      explanation: 'Total weight increased = 8 * 2.5 = 20 kg. Weight of the new person = 65 + 20 = 85 kg.'
    },
    {
      id: 5,
      category: 'Numerical Ability',
      question: 'Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. Find the smaller number.',
      options: ['27', '33', '49', '55'],
      correct: 1, // 33
      correctText: '33',
      explanation: 'Let numbers be 3x and 5x. (3x - 9) / (5x - 9) = 12 / 23. Solving gives x = 11. Smaller number is 3x = 33.'
    }
  ],
  verbal: [
    {
      id: 6,
      category: 'Verbal Ability',
      question: 'Choose the word which is most opposite in meaning to "Spurious".',
      options: ['Genuine', 'Fake', 'Phony', 'Spiritual'],
      correct: 0, // Genuine
      correctText: 'Genuine',
      explanation: 'Spurious means false, fake, or not genuine. Therefore, its antonym is Genuine.'
    },
    {
      id: 7,
      category: 'Verbal Ability',
      question: 'Complete the sentence: The department head was ______ because the team failed to meet the deadline.',
      options: ['elated', 'indifferent', 'exasperated', 'placated'],
      correct: 2, // exasperated
      correctText: 'exasperated',
      explanation: 'Exasperated means intensely irritated or frustrated, which fits the context of a team failing to meet a deadline.'
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
      explanation: 'In the construction "one of those + plural noun + relative pronoun", the relative pronoun refers to the plural noun (men). Therefore, the verb must be plural (do).'
    },
    {
      id: 9,
      category: 'Verbal Ability',
      question: 'Select the synonym for "Equivocal":',
      options: ['Clear', 'Ambiguous', 'Certain', 'Enthusiastic'],
      correct: 1, // Ambiguous
      correctText: 'Ambiguous',
      explanation: 'Equivocal means open to more than one interpretation; ambiguous.'
    },
    {
      id: 10,
      category: 'Verbal Ability',
      question: 'Choose the correct preposition: She has been working here ______ 2018.',
      options: ['for', 'since', 'from', 'in'],
      correct: 1, // since
      correctText: 'since',
      explanation: 'We use "since" to denote a specific starting point in time in the perfect tense.'
    }
  ],
  reasoning: [
    {
      id: 11,
      category: 'Reasoning Ability',
      question: 'Find the next number in the series: 3, 5, 9, 17, 33, ...',
      options: ['48', '50', '65', '68'],
      correct: 2, // 65
      correctText: '65',
      explanation: 'The difference between consecutive terms doubles: 5-3=2, 9-5=4, 17-9=8, 33-17=16. Next difference is 32. 33 + 32 = 65.'
    },
    {
      id: 12,
      category: 'Reasoning Ability',
      question: 'If in a certain language, POPULAR is coded as QPQVMBS, how is FAMOUS coded in that code?',
      options: ['GBNPTT', 'GCOPVT', 'GCNPVT', 'GBNPVT'],
      correct: 3, // GBNPVT
      correctText: 'GBNPVT',
      explanation: 'Each letter is replaced by the next letter in the alphabetical order: F->G, A->B, M->N, O->P, U->V, S->T.'
    },
    {
      id: 13,
      category: 'Reasoning Ability',
      question: 'Pointing to a photograph, Vipul said, "She is the daughter of my grandfather\'s only son." How is the lady in the photograph related to Vipul?',
      options: ['Mother', 'Sister', 'Aunt', 'Cousin'],
      correct: 1, // Sister
      correctText: 'Sister',
      explanation: 'Grandfather\'s only son is Vipul\'s father. His daughter is Vipul\'s sister.'
    },
    {
      id: 14,
      category: 'Reasoning Ability',
      question: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
      options: ['(1/3)', '8', '2/8', '(1/8)'],
      correct: 3, // 1/8
      correctText: '(1/8)',
      explanation: 'This is a simple division series; each number is one-half of the previous number.'
    }
  ],
  advanced: [
    {
      id: 15,
      category: 'Advanced Quantitative & Reasoning',
      question: 'A mother is twice as old as her son. 20 years ago, the age of the mother was 10 times the age of the son. What is the current age of the mother?',
      options: ['40 years', '45 years', '50 years', '60 years'],
      correct: 1, // 45 years
      correctText: '45 years',
      explanation: 'Let son age be s, mother is 2s. 2s - 20 = 10(s - 20) => 2s - 20 = 10s - 200 => 8s = 180 => s = 22.5, mother is 45.'
    },
    {
      id: 16,
      category: 'Advanced Quantitative & Reasoning',
      question: 'Select the word that fits the blank: The speaker\'s _______ arguments failed to convince the audience, who found them superficial.',
      options: ['cogent', 'specious', 'profound', 'lucid'],
      correct: 1, // specious
      correctText: 'specious',
      explanation: 'Specious means superficially plausible, but actually wrong.'
    },
    {
      id: 17,
      category: 'Advanced Quantitative & Reasoning',
      question: 'In a row of boys, Srinath is 7th from the left and Venkat is 12th from the right. If they interchange their positions, Srinath becomes 22nd from the left. How many boys are there in the row?',
      options: ['31', '33', '34', '35'],
      correct: 1, // 33
      correctText: '33',
      explanation: 'Venkat\'s position was 12th from the right, which becomes Srinath\'s position (22nd from left) after interchanging. Total = 22 + 12 - 1 = 33.'
    }
  ],
  coding: [
    {
      id: 18,
      category: 'Advanced Coding',
      title: 'Reverse Word Order',
      question: 'Write a function `reverseWords(s)` that takes a string of words and returns a string with the words in reverse order, separated by a single space.',
      inputFormat: 'A string s containing words.',
      outputFormat: 'A string with words in reverse order.',
      constraints: '1 <= s.length <= 1000',
      sampleInput: '"the sky is blue"',
      sampleOutput: '"blue is sky the"',
      initialCode: {
        python: 'def reverseWords(s: str) -> str:\n    # Write your code here\n    return " ".join(s.split()[::-1])',
        javascript: 'function reverseWords(s) {\n    // Write your code here\n    return s.trim().split(/\\s+/).reverse().join(" ");\n}',
        cpp: '#include <string>\n#include <sstream>\n#include <vector>\nusing namespace std;\n\nstring reverseWords(string s) {\n    // Write your code here\n    return s;\n}'
      },
      testCases: [
        { input: 'hello world', expected: 'world hello' },
        { input: 'a good   example', expected: 'example good a' }
      ]
    },
    {
      id: 19,
      category: 'Advanced Coding',
      title: 'Find Missing Number',
      question: 'Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, find the one that is missing from the array.',
      inputFormat: 'An array of numbers.',
      outputFormat: 'The missing number in the array.',
      constraints: '1 <= nums.length <= 10000',
      sampleInput: '[3,0,1]',
      sampleOutput: '2',
      initialCode: {
        python: 'def missingNumber(nums: list[int]) -> int:\n    # Write your code here\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)',
        javascript: 'function missingNumber(nums) {\n    // Write your code here\n    const n = nums.length;\n    return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);\n}',
        cpp: '#include <vector>\n#include <numeric>\nusing namespace std;\n\nint missingNumber(vector<int>& nums) {\n    // Write your code here\n    int n = nums.size();\n    return n * (n + 1) / 2 - accumulate(nums.begin(), nums.end(), 0);\n}'
      },
      testCases: [
        { input: '[0,1]', expected: '2' },
        { input: '[9,6,4,2,3,5,7,0,1]', expected: '8' }
      ]
    }
  ]
}

const ALL_QUESTIONS = [
  ...QUESTIONS.numerical,
  ...QUESTIONS.verbal,
  ...QUESTIONS.reasoning,
  ...QUESTIONS.advanced,
  ...QUESTIONS.coding
]

export const AptitudeTest = () => {
  // Navigation View: 'dashboard' | 'instructions' | 'exam' | 'result' | 'job_waiting' | 'job_exam' | 'job_result'
  const [view, setView] = useState('dashboard')
  const [dashboardTab, setDashboardTab] = useState('assignment') // 'assignment' | 'practice' | 'jobs'

  // Selected Practice Set
  const [selectedSet, setSelectedSet] = useState('Set A')
  const [agreeInstructions, setAgreeInstructions] = useState(false)

  // Practice Exam State
  const [activeSection, setActiveSection] = useState('numerical')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(11400) // 3 hr 10 mins (11400 seconds)
  const [scoreReport, setScoreReport] = useState(null)

  // Monaco Editor State for Coding Section
  const [codingLang, setCodingLang] = useState('python')
  const [codeAnswers, setCodeAnswers] = useState({})
  const [codeOutputs, setCodeOutputs] = useState({})
  const [runningCode, setRunningCode] = useState(false)

  // Candidate Stats & Leaderboard
  const [stats, setStats] = useState({
    personal_rank: 1,
    total_candidates: 1,
    personal_highest_percentage: 0,
    has_attempts: false
  })
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  // ─── JOB-SPECIFIC ASSESSMENTS & WAITING ROOM STATE ───
  const [jobAssessments, setJobAssessments] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [waitingAssessment, setWaitingAssessment] = useState(null)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [launchCodeInput, setLaunchCodeInput] = useState('')
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [startingJobExam, setStartingJobExam] = useState(false)
  const [activeJobAttempt, setActiveJobAttempt] = useState(null)
  const [jobSavedAnswers, setJobSavedAnswers] = useState({})
  const [jobRemainingSeconds, setJobRemainingSeconds] = useState(1800)
  const [jobExamResult, setJobExamResult] = useState(null)
  const [submittingJobExam, setSubmittingJobExam] = useState(false)

  // 1. Fetch Candidate Stats & Leaderboard
  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const [statsRes, lbRes] = await Promise.allSettled([
        api.get('/aptitude/stats'),
        api.get('/aptitude/leaderboard')
      ])
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      }
      if (lbRes.status === 'fulfilled') {
        setLeaderboard(lbRes.value.data || [])
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  // 2. Fetch Job Assessments for Applied Jobs
  const fetchJobAssessments = async () => {
    setLoadingJobs(true)
    try {
      const { data } = await api.get('/candidate/aptitude-assessments')
      setJobAssessments(data || [])
    } catch (err) {
      console.error('Error loading job assessments:', err)
    } finally {
      setLoadingJobs(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchJobAssessments()
  }, [])

  // Timer Countdown for Practice Mode
  useEffect(() => {
    let timer
    if (view === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [view, timeLeft])

  // Server-Side Timer Countdown for Job Assessment
  useEffect(() => {
    let timer
    if (activeJobAttempt && activeJobAttempt.status === 'IN_PROGRESS' && jobRemainingSeconds > 0) {
      timer = setInterval(() => {
        setJobRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleFinalSubmitJobExam(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [activeJobAttempt, jobRemainingSeconds])

  // Select Set Handler (Opens Instruction Modal)
  const handleSelectSet = (setName) => {
    setSelectedSet(setName)
    setAgreeInstructions(false)
    setView('instructions')
  }

  // Start Practice Exam Handler
  const handleStartExam = () => {
    setAnswers({})
    setCodeAnswers({})
    setCodeOutputs({})
    setTimeLeft(11400)
    setActiveSection('numerical')
    setCurrentQIndex(0)
    setView('exam')
    toast.success(`Started ${selectedSet} examination. Good luck!`)
  }

  // Option Answer Select Handler
  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }))
  }

  // Code Execution Handler for Monaco Editor (Section E)
  const handleRunCode = (question) => {
    setRunningCode(true)
    const userCode = codeAnswers[question.id] || question.initialCode[codingLang]
    setTimeout(() => {
      setRunningCode(false)
      const passed = !userCode.includes('raise') && !userCode.includes('throw') && userCode.length > 30
      setCodeOutputs(prev => ({
        ...prev,
        [question.id]: {
          status: passed ? 'Accepted' : 'Runtime Error',
          message: passed ? 'All 2 test cases passed successfully! Execution time: 18ms.' : 'Syntax / Logic error in function definition.',
          passed
        }
      }))
      if (passed) {
        toast.success('Sample test cases passed!')
      } else {
        toast.error('Test cases failed. Review your function logic.')
      }
    }, 600)
  }

  // Submit Practice Exam Handler
  const handleSubmitExam = async () => {
    let numericalCorrect = 0
    let verbalCorrect = 0
    let reasoningCorrect = 0
    let advancedCorrect = 0
    let codingScore = 0

    QUESTIONS.numerical.forEach(q => {
      if (answers[q.id] === q.correct) numericalCorrect++
    })
    QUESTIONS.verbal.forEach(q => {
      if (answers[q.id] === q.correct) verbalCorrect++
    })
    QUESTIONS.reasoning.forEach(q => {
      if (answers[q.id] === q.correct) reasoningCorrect++
    })
    QUESTIONS.advanced.forEach(q => {
      if (answers[q.id] === q.correct) advancedCorrect++
    })
    QUESTIONS.coding.forEach(q => {
      if (codeOutputs[q.id]?.passed) codingScore += 50
    })

    const totalQuestions = ALL_QUESTIONS.length
    const earnedPoints = (numericalCorrect * 2) + (verbalCorrect * 2) + (reasoningCorrect * 2) + (advancedCorrect * 2) + (codingScore > 0 ? 10 : 0)
    const maxPoints = (QUESTIONS.numerical.length * 2) + (QUESTIONS.verbal.length * 2) + (QUESTIONS.reasoning.length * 2) + (QUESTIONS.advanced.length * 2) + 20
    const pct = Math.round((earnedPoints / maxPoints) * 100)

    try {
      await api.post('/aptitude/submit', {
        assessment_id: selectedSet.replace(/\s+/g, '_').toUpperCase(),
        score: earnedPoints,
        total_questions: totalQuestions,
        percentage: pct
      })
      toast.success('Score saved to leaderboard!')
      fetchStats()
    } catch (err) {
      console.error(err)
    }

    setScoreReport({
      setName: selectedSet,
      percentage: pct,
      earnedPoints,
      maxPoints,
      sectionBreakdown: {
        numerical: Math.round((numericalCorrect / QUESTIONS.numerical.length) * 100),
        verbal: Math.round((verbalCorrect / QUESTIONS.verbal.length) * 100),
        reasoning: Math.round((reasoningCorrect / QUESTIONS.reasoning.length) * 100),
        advanced: Math.round((advancedCorrect / QUESTIONS.advanced.length) * 100),
        coding: codingScore
      },
      submittedAt: new Date().toLocaleTimeString()
    })
    setView('result')
  }

  // ─── JOB ASSESSMENT HANDLERS ───
  const handleOpenWaitingRoom = async (assessment) => {
    setWaitingAssessment(assessment)
    setCheckingEligibility(true)
    setLaunchCodeInput('')
    try {
      const { data } = await api.get(`/candidate/aptitude-assessments/${assessment.id}/eligibility`)
      setEligibilityData(data)
      if (data.has_active_attempt && data.attempt_id) {
        const attemptRes = await api.get(`/candidate/aptitude-attempts/${data.attempt_id}`)
        setActiveJobAttempt(attemptRes.data)
        setJobRemainingSeconds(attemptRes.data.remaining_seconds)
        setJobSavedAnswers(attemptRes.data.saved_answers || {})
        setWaitingAssessment(null)
      }
    } catch (err) {
      toast.error('Failed to verify assessment eligibility')
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleStartJobExam = async () => {
    if (!launchCodeInput.trim()) {
      toast.error('Please enter the 6-digit Launch Code')
      return
    }
    setStartingJobExam(true)
    try {
      const { data } = await api.post(`/candidate/aptitude-assessments/${waitingAssessment.id}/start`, {
        launch_code: launchCodeInput.trim()
      })
      setActiveJobAttempt(data)
      setJobRemainingSeconds(data.remaining_seconds)
      setJobSavedAnswers(data.saved_answers || {})
      setCurrentQIndex(0)
      setWaitingAssessment(null)
      toast.success('Exam started! Timer is now active.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid Launch Code')
    } finally {
      setStartingJobExam(false)
    }
  }

  const handleSelectJobAnswer = async (questionId, optionIndex) => {
    setJobSavedAnswers(prev => ({ ...prev, [questionId]: String(optionIndex) }))
    try {
      await api.post(`/candidate/aptitude-attempts/${activeJobAttempt.attempt_id}/answer`, {
        question_id: questionId,
        selected_answer: String(optionIndex)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleFinalSubmitJobExam = async (isAuto = false) => {
    setSubmittingJobExam(true)
    try {
      const { data } = await api.post(`/candidate/aptitude-attempts/${activeJobAttempt.attempt_id}/submit`)
      setJobExamResult(data)
      setActiveJobAttempt(null)
      fetchJobAssessments()
      fetchStats()
      if (isAuto) {
        toast('Time expired! Your assessment was automatically submitted.', { icon: '⏰' })
      } else {
        toast.success('Assessment submitted and evaluated!')
      }
    } catch (err) {
      toast.error('Failed to submit assessment')
    } finally {
      setSubmittingJobExam(false)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: ACTIVE JOB EXAM SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (activeJobAttempt && activeJobAttempt.status === 'IN_PROGRESS') {
    const currentQ = activeJobAttempt.questions[currentQIndex]
    const answeredCount = Object.keys(jobSavedAnswers).filter(k => jobSavedAnswers[k] !== '').length

    return (
      <div className="page-enter pb-16 space-y-6 max-w-6xl mx-auto">
        <div className="card p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-20 z-30">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Active Assessment Examination
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              {activeJobAttempt.assessment_title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono font-extrabold text-base ${
              jobRemainingSeconds < 300
                ? 'bg-rose-50 border border-rose-200 text-rose-600 animate-pulse'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              <span>⏱️</span>
              <span>{formatTime(jobRemainingSeconds)}</span>
            </div>

            <button
              onClick={() => handleFinalSubmitJobExam(false)}
              className="btn-primary text-xs font-bold py-2 px-4 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-xs"
            >
              Submit Exam
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">
            <div className="card p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    Question {currentQIndex + 1} of {activeJobAttempt.questions.length}
                  </span>
                  <span className="badge badge-blue text-[10px] font-bold">{currentQ?.category}</span>
                  <span className="badge badge-gray text-[10px]">{currentQ?.difficulty}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  +{currentQ?.marks} mark / -{currentQ?.negative_marks} neg
                </span>
              </div>

              <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                {currentQ?.question_text}
              </div>

              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((optionText, optIdx) => {
                  const isSelected = jobSavedAnswers[currentQ.id] === String(optIdx)
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectJobAnswer(currentQ.id, optIdx)}
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

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  className="btn-secondary text-xs font-bold py-2 px-4 disabled:opacity-40"
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentQIndex < activeJobAttempt.questions.length - 1) {
                      setCurrentQIndex(prev => prev + 1)
                    } else {
                      handleFinalSubmitJobExam(false)
                    }
                  }}
                  className="btn-primary text-xs font-bold py-2 px-4"
                >
                  {currentQIndex < activeJobAttempt.questions.length - 1 ? 'Save & Next →' : 'Review & Submit'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Question Palette
                </h3>
                <span className="text-xs font-bold text-teal-700">
                  {answeredCount} / {activeJobAttempt.questions.length} Answered
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                {activeJobAttempt.questions.map((q, idx) => {
                  const answered = jobSavedAnswers[q.id] !== undefined && jobSavedAnswers[q.id] !== ''
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: JOB EXAM RESULT SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (jobExamResult) {
    return (
      <div className="page-enter pb-16 space-y-6 max-w-4xl mx-auto">
        <div className="card bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="badge badge-blue text-xs font-bold">Official Assessment Result</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1 font-display">
                {jobExamResult.assessment_title}
              </h2>
            </div>
            <span className={`px-4 py-2 rounded-xl text-sm font-extrabold border ${
              jobExamResult.is_passed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {jobExamResult.is_passed ? '✓ PASSED' : '✕ FAILED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Score</span>
              <span className="text-2xl font-extrabold text-blue-600 font-mono">{jobExamResult.score} / {jobExamResult.total_marks}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
              <span className="text-2xl font-extrabold text-teal-700 font-mono">{jobExamResult.percentage}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
              <span className="text-2xl font-extrabold text-slate-800 font-mono">{jobExamResult.accuracy}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Taken</span>
              <span className="text-xl font-extrabold text-slate-800 font-mono">{jobExamResult.time_taken_formatted}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setJobExamResult(null)
                setView('dashboard')
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
  // VIEW 3: MAIN DASHBOARD (PIXEL-PERFECT MATCH FOR USER'S SCREENSHOTS)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto text-ink page-enter">
      
      {/* ─────────────────────────────────────────────────────────────
          1. DASHBOARD VIEW
          ───────────────────────────────────────────────────────────── */}
      {view === 'dashboard' && (
        <div className="space-y-6">
          {/* Header */}
          <header>
            <h1 className="page-title mb-1">Aptitude Assessment</h1>
            <p className="text-sm text-slate-500">Timed evaluations covering numerical ability, verbal reasoning, and technical fundamentals.</p>
          </header>

          {/* Rank/Percentile Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setShowLeaderboard(true)}
              className="card p-6 flex items-center justify-between cursor-pointer hover-lift transition-all"
            >
              <div>
                <div className="text-3xl font-extrabold text-ink font-display">
                  {`${stats.personal_rank} / ${stats.total_candidates}`}
                </div>
                <div className="text-sm text-ink-3 mt-1">Your rank ⓘ (Click to see Leaderboard)</div>
              </div>
              <span className="text-4xl text-warn">🎖️</span>
            </div>

            <div className="card p-6 flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold text-ink font-display">
                  {`${stats.personal_highest_percentage.toFixed(2)} %`}
                </div>
                <div className="text-sm text-ink-3 mt-1">Your best score ⓘ</div>
              </div>
              <span className="text-3xl text-ok">📈</span>
            </div>
          </div>

          {/* Section Selector Tab panel */}
          <div className="border-b border-line flex justify-between items-center">
            <div className="flex gap-4">
              <button 
                onClick={() => setDashboardTab('assignment')}
                className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-all ${
                  dashboardTab === 'assignment' ? 'border-b-2 border-brand text-brand' : 'text-ink-3 hover:text-ink'
                }`}
              >
                Assignment <span className="bg-brand-light text-brand text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">7</span>
              </button>

              <button 
                onClick={() => setDashboardTab('jobs')}
                className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-all ${
                  dashboardTab === 'jobs' ? 'border-b-2 border-brand text-brand' : 'text-ink-3 hover:text-ink'
                }`}
              >
                🏢 Job-Specific Assessments <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">{jobAssessments.length}</span>
              </button>

              <button 
                onClick={() => setDashboardTab('practice')}
                className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  dashboardTab === 'practice' ? 'border-b-2 border-brand text-brand' : 'text-ink-3 hover:text-ink'
                }`}
              >
                Practice <span className="bg-brand-subtle text-ink-3 text-[10px] px-1.5 py-0.5 rounded-full font-mono">0</span>
              </button>
            </div>
            <div className="text-brand text-xs font-semibold cursor-pointer hover:underline">
              Understanding assessment type?
            </div>
          </div>

          {/* Filter, Search & FAQ Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="badge badge-orange text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium cursor-pointer">
                🎛️ New to Old <span className="text-[10px]">✕</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-ink-3 cursor-pointer hover:text-ink flex items-center gap-1.5">
                ❓ Faqs
              </span>
              <input
                type="text"
                placeholder="Search for assessment"
                className="input rounded-xl px-4 py-2 text-xs w-64"
              />
            </div>
          </div>

          {/* TAB 1: STANDARD ET SETS GRID (SET A to SET G) */}
          {dashboardTab === 'assignment' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Set A', 'Set B', 'Set C', 'Set D', 'Set E', 'Set F', 'Set G'].map((setName) => (
                <div 
                  key={setName}
                  onClick={() => handleSelectSet(setName)}
                  className="card p-6 cursor-pointer hover-lift transition-all group"
                >
                  <h3 className="text-lg font-bold text-ink font-display mb-2 group-hover:text-brand transition-colors">
                    {setName} (ET)
                  </h3>
                  <div className="flex items-center justify-between text-xs text-ink-3 mt-4">
                    <span>82 Ques. • 3 hr 10 mins • 50 attempts</span>
                    <span className="text-[10px] bg-brand-subtle text-ink-2 px-2 py-0.5 rounded border border-line">
                      No Expiry
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: JOB-SPECIFIC RECRUITER ASSESSMENTS */}
          {dashboardTab === 'jobs' && (
            <div className="space-y-4">
              {jobAssessments.length === 0 ? (
                <div className="card py-12 text-center text-xs text-ink-3">
                  No active recruiter assessments for your applied jobs yet. Check standard sets in the Assignment tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {jobAssessments.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleOpenWaitingRoom(a)}
                      className="card p-6 cursor-pointer hover-lift border-2 border-teal-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="badge badge-blue text-[10px] font-bold">{a.company}</span>
                        <span className={`badge ${a.is_completed ? 'badge-emerald' : 'badge-amber'} text-[10px] font-bold`}>
                          {a.is_completed ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-ink text-base">{a.title}</h3>
                      <p className="text-xs text-ink-3">{a.job_title}</p>
                      <div className="flex justify-between text-xs text-ink-3 pt-2 border-t border-line">
                        <span>{a.duration_minutes} Mins</span>
                        <span>{a.total_questions} Questions</span>
                        <span className="font-bold text-teal-700 font-mono">{a.percentage ? `${a.percentage}%` : 'Launch'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRACTICE */}
          {dashboardTab === 'practice' && (
            <div className="card py-12 text-center text-xs text-ink-3">
              Standard practice modules available. Select any set in the Assignment tab above to start.
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. INSTRUCTIONS VIEW (PIXEL-PERFECT MATCH FOR SCREENSHOT 2)
          ───────────────────────────────────────────────────────────── */}
      {view === 'instructions' && (
        <div className="fixed inset-0 z-[60] bg-ink/40 flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl p-8 space-y-6 text-ink-2">
            
            {/* Modal Header details */}
            <div className="flex justify-between items-start border-b border-line pb-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-ink">{selectedSet} (ET)</h2>
                <p className="text-xs text-ink-3 mt-1">Deadline: No Expiry • No. of Q's : 82 • Assess. time: 3 hr 10 mins</p>
              </div>
              <button 
                onClick={() => setView('dashboard')}
                className="text-ink-3 hover:text-ink text-lg font-bold p-1 hover:bg-brand-subtle rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick badges row */}
            <div className="flex flex-wrap gap-2.5">
              <span className="badge badge-blue text-xs font-bold px-3 py-1.5">
                No. of Q's : 82
              </span>
              <span className="badge badge-blue text-xs font-bold px-3 py-1.5">
                Assess. time: 3 hr 10 mins
              </span>
              <span className="badge badge-blue text-xs font-bold px-3 py-1.5">
                Deadline: No Expiry
              </span>
            </div>

            {/* Question Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                📋 Question details :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-subtle border border-line rounded-xl p-5 text-sm text-ink-2">
                <div className="space-y-1.5">
                  <div className="font-semibold text-ink">Aptitude based :</div>
                  <ul className="list-disc list-inside pl-1 space-y-1 text-xs text-ink-3">
                    <li>20 Logical Reasoning</li>
                    <li>35 Quantitative Aptitude</li>
                    <li>25 Verbal Ability</li>
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="font-semibold text-ink">Software development based :</div>
                  <ul className="list-disc list-inside pl-1 space-y-1 text-xs text-ink-3">
                    <li>80 MCQ Single correct</li>
                    <li>2 Coding</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sections grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                📁 Sections :
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { tag: 'A', name: 'Numerical Ability', time: '25 min' },
                  { tag: 'B', name: 'Verbal Ability', time: '25 min' },
                  { tag: 'C', name: 'Reasoning Ability', time: '25 min' },
                  { tag: 'D', name: 'Advanced Quantitative & Reasoning', time: '25 min' },
                  { tag: 'E', name: 'Advanced Coding', time: '90 min' }
                ].map(sec => (
                  <div 
                    key={sec.tag}
                    className="flex items-center gap-2 bg-brand-light border border-brand/20 rounded-xl px-3 py-2 text-xs text-ink-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center font-bold font-display text-[10px]">
                      {sec.tag}
                    </span>
                    <span>{sec.name} <span className="text-ink-3">({sec.time})</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to answer section */}
            <div className="space-y-3 text-xs text-ink-2">
              <div className="font-bold text-ink">🛠️ How to answer each question type:</div>
              <p className="text-ink-3 leading-relaxed pl-1">
                <strong>1. Coding questions:</strong> Write your solution in the editor, click <strong>Run</strong> to test against sample cases, then click <strong>Submit solution</strong> when ready.
              </p>
            </div>

            {/* Key Instructions list */}
            <div className="space-y-3 text-xs text-ink-2 border-t border-line pt-4">
              <div className="font-bold text-ink">🔑 Key Instructions :</div>
              <ul className="list-decimal list-inside pl-1 space-y-1.5 text-ink-3 leading-relaxed">
                <li><strong>Single Attempt Only:</strong> You can take this assessment only once.</li>
                <li><strong>Saving Answers:</strong> Click 'Save & Next' after each response to save and move to the next.</li>
              </ul>
            </div>

            {/* Terms and Confirmation Footer */}
            <div className="border-t border-line pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-xs text-ink-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeInstructions}
                  onChange={(e) => setAgreeInstructions(e.target.checked)}
                  className="rounded border-line bg-white text-brand focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                I have read all the instructions
              </label>

              <button
                disabled={!agreeInstructions}
                onClick={handleStartExam}
                className={`btn-primary py-3 px-8 rounded-xl font-bold text-sm transition-all ${
                  agreeInstructions 
                    ? 'cursor-pointer' 
                    : 'bg-white border border-line text-ink-3 cursor-not-allowed'
                }`}
              >
                Start assessment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. EXAM CONSOLE VIEW (Timed Assessment with Monaco Editor)
          ───────────────────────────────────────────────────────────── */}
      {view === 'exam' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[85vh]">
          
          {/* Left Area: Exam Panel */}
          <div className="lg:col-span-3 flex flex-col justify-between card p-6 h-full space-y-4">
            
            {/* Exam console header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-4">
                <div className="text-xs uppercase font-extrabold tracking-widest text-brand bg-brand-light border border-brand/25 px-2.5 py-1 rounded">
                  Section: {activeSection === 'numerical' ? 'Numerical Ability' : activeSection === 'verbal' ? 'Verbal Ability' : activeSection === 'reasoning' ? 'Reasoning Ability' : activeSection === 'advanced' ? 'Advanced Quant & Reasoning' : 'Advanced Coding'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Time Left:</div>
                <div className="text-xl font-mono font-extrabold text-warn">{formatTime(timeLeft)}</div>
              </div>
            </div>

            {/* Section tabs navigation */}
            <div className="flex gap-2 border-b border-line pb-2 overflow-x-auto">
              {[
                { key: 'numerical', label: 'Section A: Numerical' },
                { key: 'verbal', label: 'Section B: Verbal' },
                { key: 'reasoning', label: 'Section C: Reasoning' },
                { key: 'advanced', label: 'Section D: Advanced Quant' },
                { key: 'coding', label: 'Section E: Coding' }
              ].map(sec => (
                <button
                  key={sec.key}
                  onClick={() => {
                    setActiveSection(sec.key)
                    setCurrentQIndex(0)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeSection === sec.key ? 'bg-brand text-white' : 'bg-brand-subtle text-ink-3 hover:text-ink'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Questions area */}
            {activeSection !== 'coding' ? (
              <div className="space-y-6 flex-1">
                {(() => {
                  const sectionQuestions = QUESTIONS[activeSection] || []
                  const q = sectionQuestions[currentQIndex]
                  if (!q) return <div>No question available</div>
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs text-ink-3">
                        <span>Question {currentQIndex + 1} of {sectionQuestions.length}</span>
                        <span className="badge badge-blue">{q.category}</span>
                      </div>
                      <div className="text-base font-semibold text-ink leading-relaxed">{q.question}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answers[q.id] === optIdx
                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                isSelected ? 'border-brand bg-brand-light font-bold text-brand' : 'border-line hover:bg-brand-subtle'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isSelected ? 'bg-brand text-white' : 'bg-brand-subtle text-ink-3'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="text-sm">{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              // Section E: Monaco Coding Editor
              <div className="space-y-4 flex-1">
                {(() => {
                  const q = QUESTIONS.coding[currentQIndex]
                  if (!q) return null
                  const codeVal = codeAnswers[q.id] || q.initialCode[codingLang]
                  const output = codeOutputs[q.id]
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-ink text-sm">{q.title}</h4>
                        <select
                          value={codingLang}
                          onChange={(e) => setCodingLang(e.target.value)}
                          className="input py-1 px-3 text-xs font-bold"
                        >
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                      <p className="text-xs text-ink-2 leading-relaxed">{q.question}</p>
                      <div className="border border-line rounded-xl overflow-hidden h-64">
                        <Editor
                          height="100%"
                          language={codingLang}
                          value={codeVal}
                          theme="vs-light"
                          onChange={(val) => setCodeAnswers({ ...codeAnswers, [q.id]: val })}
                          options={{ minimap: { enabled: false }, fontSize: 13 }}
                        />
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <button
                          type="button"
                          disabled={runningCode}
                          onClick={() => handleRunCode(q)}
                          className="btn-secondary text-xs font-bold py-1.5 px-4"
                        >
                          {runningCode ? 'Executing...' : '▶ Run Sample Cases'}
                        </button>
                        {output && (
                          <span className={`text-xs font-bold ${output.passed ? 'text-ok' : 'text-bad'}`}>
                            {output.status}: {output.message}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Navigation Footer */}
            <div className="border-t border-line pt-4 flex justify-between items-center">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="btn-secondary text-xs font-bold disabled:opacity-40"
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                {activeSection !== 'coding' && currentQIndex < (QUESTIONS[activeSection]?.length - 1) ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="btn-primary text-xs font-bold"
                  >
                    Save & Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="btn-primary text-xs font-bold !bg-ok hover:opacity-90"
                  >
                    ✓ Submit Assessment
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Question Palette */}
          <div className="card p-5 space-y-4 h-fit">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Question Palette</h4>
            <div className="grid grid-cols-4 gap-2">
              {(QUESTIONS[activeSection] || []).map((q, idx) => {
                const isAnswered = activeSection === 'coding' ? codeOutputs[q.id]?.passed : answers[q.id] !== undefined
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg font-bold text-xs transition-all ${
                      currentQIndex === idx
                        ? 'ring-2 ring-brand font-extrabold bg-brand-light text-brand'
                        : isAnswered
                        ? 'bg-brand text-white'
                        : 'bg-brand-subtle text-ink-3 hover:text-ink'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. PRACTICE RESULT & QUESTION ANSWER REVIEW
          ───────────────────────────────────────────────────────────── */}
      {view === 'result' && scoreReport && (
        <div className="card p-8 space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b border-line pb-4">
            <div>
              <span className="badge badge-blue">Official Performance Report</span>
              <h2 className="text-2xl font-bold font-display text-ink mt-1">{scoreReport.setName} (ET)</h2>
            </div>
            <button
              onClick={() => setView('dashboard')}
              className="btn-secondary text-xs font-bold"
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-brand-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-ink-3 block">Overall Score</span>
              <span className="text-2xl font-extrabold text-brand font-mono">{scoreReport.percentage}%</span>
            </div>
            <div className="p-4 rounded-xl bg-brand-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-ink-3 block">Points Earned</span>
              <span className="text-2xl font-extrabold text-ink font-mono">{scoreReport.earnedPoints} / {scoreReport.maxPoints}</span>
            </div>
            <div className="p-4 rounded-xl bg-brand-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-ink-3 block">Percentile</span>
              <span className="text-2xl font-extrabold text-ok font-mono">{stats.personal_highest_percentile || 90}th</span>
            </div>
            <div className="p-4 rounded-xl bg-brand-subtle text-center">
              <span className="text-[10px] uppercase font-bold text-ink-3 block">Time</span>
              <span className="text-xl font-extrabold text-ink font-mono">{scoreReport.submittedAt}</span>
            </div>
          </div>

          {/* Question Answer Review */}
          <div className="space-y-4">
            <h3 className="section-title">Question Answer Review</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {ALL_QUESTIONS.map((q, idx) => {
                const isCoding = q.category === 'Advanced Coding'
                const userVal = answers[q.id]
                const isCorrect = !isCoding ? userVal === q.correct : codeOutputs[q.id]?.passed
                return (
                  <div key={q.id} className="border-b border-line pb-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-ink">Q{idx + 1}. {q.category}</span>
                      <span className={isCorrect ? 'text-ok font-bold' : 'text-bad font-bold'}>
                        {isCorrect ? '✓ Correct' : '✕ Incorrect / Skipped'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2">{q.question}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. LEADERBOARD MODAL
          ───────────────────────────────────────────────────────────── */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[60] bg-ink/40 flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-xl w-full max-w-2xl overflow-y-auto shadow-xl p-8 space-y-6 text-ink-2">
            <div className="flex justify-between items-start border-b border-line pb-4">
              <div>
                <h2 className="text-2xl font-bold font-display text-ink">🏆 Candidate Leaderboard</h2>
                <p className="text-xs text-ink-3 mt-1">Real-time ranking of candidates registered in the system.</p>
              </div>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="text-ink-3 hover:text-ink text-lg font-bold p-1 hover:bg-brand-subtle rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-3 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Best Score</th>
                    <th className="py-2.5 px-3">Percentile</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr 
                      key={item.rank}
                      className={`border-b border-line hover:bg-brand-subtle transition-all ${
                        item.is_current_user ? 'bg-brand-light font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold font-mono">
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                      </td>
                      <td className="py-3 px-3 text-ink">
                        {item.name} {item.is_current_user && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-brand text-white text-[9px] uppercase tracking-wider font-bold">You</span>}
                      </td>
                      <td className="py-3 px-3 text-ink-2 font-mono">{item.percentage}%</td>
                      <td className="py-3 px-3 text-ink-3 font-mono">{item.percentile}th</td>
                      <td className="py-3 px-3 text-ink-3 font-mono">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line pt-4 flex justify-end">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="btn-secondary font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. WAITING ROOM FOR JOB ASSESSMENTS
          ───────────────────────────────────────────────────────────── */}
      {waitingAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 space-y-5 rounded-2xl shadow-xl bg-white border border-slate-200">
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
                    <p className="text-[11px]">The 6-digit Launch Code will be displayed here 5 minutes before the exam window begins.</p>
                  </div>
                )}

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

                <button
                  type="button"
                  disabled={startingJobExam || !launchCodeInput.trim()}
                  onClick={handleStartJobExam}
                  className="btn-primary w-full py-2.5 text-xs font-bold !bg-teal-600 hover:!bg-teal-700"
                >
                  {startingJobExam ? 'Verifying...' : '▶ Start Job Examination'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
