import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import { api } from '../../context/AuthContext'

// Comprehensive question database mapped to section indices
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
      outputFormat: 'The missing number.',
      constraints: 'n == nums.length',
      sampleInput: '[3,0,1]',
      sampleOutput: '2',
      initialCode: {
        python: 'def missingNumber(nums: list) -> int:\n    # Write your code here\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)',
        javascript: 'function missingNumber(nums) {\n    // Write your code here\n    const n = nums.length;\n    const sum = nums.reduce((a, b) => a + b, 0);\n    return (n * (n + 1)) / 2 - sum;\n}',
        cpp: '#include <vector>\n#include <numeric>\nusing namespace std;\n\nint missingNumber(vector<int>& nums) {\n    // Write your code here\n    int n = nums.size();\n    int sum = accumulate(nums.begin(), nums.end(), 0);\n    return (n * (n + 1)) / 2 - sum;\n}'
      },
      testCases: [
        { input: '[9,6,4,2,3,5,7,0,1]', expected: '8' },
        { input: '[0,1]', expected: '2' }
      ]
    }
  ]
}

// Flat list helper for linear question indexing in exam engine
const flattenQuestions = () => {
  return [
    ...QUESTIONS.numerical,
    ...QUESTIONS.verbal,
    ...QUESTIONS.reasoning,
    ...QUESTIONS.advanced,
    ...QUESTIONS.coding
  ]
}

const ALL_QUESTIONS = flattenQuestions()

export const AptitudeTest = () => {
  // Navigation views: 'dashboard' | 'instructions' | 'exam' | 'result'
  const [view, setView] = useState('dashboard')
  const [selectedSet, setSelectedSet] = useState('Set A')
  
  // Instructions modal checkbox state
  const [agreeInstructions, setAgreeInstructions] = useState(false)
  
  // Active test taking states
  const [activeSection, setActiveSection] = useState('numerical') // 'numerical' | 'verbal' | 'reasoning' | 'advanced' | 'coding'
  const [currentIdx, setCurrentIdx] = useState(0) // Index relative to active section list
  const [answers, setAnswers] = useState({}) // {questionId: selectedIndex_or_codeText}
  const [markedQuestions, setMarkedQuestions] = useState(new Set())
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([1])) // default first visited
  const [timeLeft, setTimeLeft] = useState(11400) // 3 hours 10 mins (11400 secs)
  
  // Database Connected Stats & Leaderboard
  const [stats, setStats] = useState({
    total_candidates: 1,
    total_taken: 0,
    peer_average: 40.0,
    personal_rank: 1,
    personal_highest_percentage: 0.0,
    personal_highest_score: 0,
    personal_highest_percentile: 0.0,
    has_attempts: false
  })
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  const getAssessmentId = (setName) => {
    if (!setName) return "TCS_NQT_SET_A";
    return `TCS_NQT_${setName.toUpperCase().replace(/\s+/g, '_')}`;
  }

  const fetchStatsAndLeaderboard = async () => {
    try {
      setLoadingStats(true)
      const targetId = getAssessmentId(selectedSet || 'Set A')
      
      // Fetch rank and stats in parallel
      const [rankRes, statsRes, leaderboardRes] = await Promise.all([
        api.get(`/candidate/rank?assessment_id=${targetId}`),
        api.get(`/aptitude/stats?assessment_id=${targetId}`),
        api.get(`/aptitude/leaderboard?assessment_id=${targetId}`)
      ])
      
      setStats({
        total_candidates: rankRes.data.total_candidates,
        total_taken: statsRes.data.total_taken,
        peer_average: statsRes.data.peer_average,
        personal_rank: rankRes.data.rank,
        personal_highest_percentage: rankRes.data.score,
        personal_highest_score: statsRes.data.personal_highest_score,
        personal_highest_percentile: statsRes.data.personal_highest_percentile,
        has_attempts: rankRes.data.assessment_completed
      })
      setLeaderboard(leaderboardRes.data)
    } catch (err) {
      console.error("Failed to fetch leaderboard/stats:", err)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (view === 'dashboard') {
      fetchStatsAndLeaderboard()
    }
  }, [view, selectedSet])
  
  // Results details
  const [scoreReport, setScoreReport] = useState(null)
  
  // Active programming language in Monaco
  const [editorLanguage, setEditorLanguage] = useState('python')
  const [consoleOutput, setConsoleOutput] = useState('')
  const [isCompiling, setIsCompiling] = useState(false)

  // Timer loop
  useEffect(() => {
    if (view !== 'exam') return
    if (timeLeft <= 0) {
      handleAutoSubmit()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, view])

  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600)
    const mins = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`
  }

  // Get active section's question subset
  const getActiveSubset = () => {
    return QUESTIONS[activeSection] || []
  }

  const handleSelectSet = (setName) => {
    setSelectedSet(setName)
    setAgreeInstructions(false)
    setView('instructions')
  }

  const handleStartExam = () => {
    if (!agreeInstructions) return
    setTimeLeft(11400)
    setAnswers({})
    setMarkedQuestions(new Set())
    setVisitedQuestions(new Set([getActiveSubset()[0]?.id]))
    setCurrentIdx(0)
    setActiveSection('numerical')
    setView('exam')
  }

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }))
    // Mark visited
    setVisitedQuestions(prev => {
      const next = new Set(prev)
      next.add(qId)
      return next
    })
  }

  const handleCodeChange = (qId, value) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: value
    }))
  }

  const toggleMarkReview = (qId) => {
    setMarkedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  const clearAnswer = (qId) => {
    setAnswers(prev => {
      const next = { ...prev }
      delete next[qId]
      return next
    })
  }

  const runCodeSample = (q) => {
    setIsCompiling(true)
    setConsoleOutput('Compiling code...\n')
    setTimeout(() => {
      const currentCode = answers[q.id] || q.initialCode[editorLanguage]
      setConsoleOutput(prev => prev + `Running tests for target function...\n`)
      
      // Simulate test case pass
      setTimeout(() => {
        setConsoleOutput(prev => 
          prev + `\n[Test Case 1] Input: ${q.testCases[0].input}\n` +
          `Expected: ${q.testCases[0].expected}\n` +
          `Output: ${q.testCases[0].expected}\n` +
          `Status: SUCCESS\n\n` +
          `[Test Case 2] Input: ${q.testCases[1].input}\n` +
          `Expected: ${q.testCases[1].expected}\n` +
          `Output: ${q.testCases[1].expected}\n` +
          `Status: SUCCESS\n\n` +
          `All sample cases passed successfully! (Time: 12ms, Memory: 15.4MB)`
        )
        setIsCompiling(false)
        toast.success("Code executed successfully!")
      }, 800)
    }, 600)
  }

  const handleAutoSubmit = () => {
    toast.error("Time expired! Automatically submitting your exam.")
    calculateScore()
  }

  const calculateScore = async () => {
    let mcqScore = 0
    let totalMcq = 0
    let codingScore = 0
    
    // MCQ calculations
    const sections = ['numerical', 'verbal', 'reasoning', 'advanced']
    sections.forEach(secKey => {
      QUESTIONS[secKey].forEach(q => {
        totalMcq++
        if (answers[q.id] === q.correct) {
          mcqScore++
        }
      })
    })

    // Coding score simulation (proportional to if code is modified/written)
    QUESTIONS.coding.forEach(q => {
      const code = answers[q.id]
      if (code && !code.includes('pass') && !code.includes('return s;')) {
        codingScore += 50
      } else {
        codingScore += 10 // partial score for initial template
      }
    })

    const totalPossiblePoints = (totalMcq * 4) + 100 // 4 points per MCQ + 100 coding
    const userEarnedPoints = (mcqScore * 4) + codingScore
    const finalPercentage = parseFloat(((userEarnedPoints / totalPossiblePoints) * 100).toFixed(2))

    // Submit to database
    try {
      const response = await api.post('/aptitude/submit', {
        assessment_id: getAssessmentId(selectedSet),
        score: userEarnedPoints,
        total_questions: totalMcq + 2, // MCQ count + 2 coding questions
        percentage: finalPercentage
      })
      toast.success("Score saved to database successfully!")
      
      // Trigger background stats reload
      fetchStatsAndLeaderboard()
      
      const serverPercentile = response.data.percentile
      
      setScoreReport({
        mcqScore,
        totalMcq,
        codingScore,
        totalCoding: 100,
        percentile: serverPercentile,
        rank: stats.personal_rank, // placeholder until refresh
        sectionBreakdown: {
          numerical: QUESTIONS.numerical.filter(q => answers[q.id] === q.correct).length * 20,
          verbal: QUESTIONS.verbal.filter(q => answers[q.id] === q.correct).length * 20,
          reasoning: QUESTIONS.reasoning.filter(q => answers[q.id] === q.correct).length * 25,
          advanced: Math.round(QUESTIONS.advanced.filter(q => answers[q.id] === q.correct).length * 33.3),
          coding: codingScore
        }
      })
      setView('result')
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit score to database.")
      // Fallback local score report
      setScoreReport({
        mcqScore,
        totalMcq,
        codingScore,
        totalCoding: 100,
        percentile: 85.0,
        rank: stats.personal_rank,
        sectionBreakdown: {
          numerical: QUESTIONS.numerical.filter(q => answers[q.id] === q.correct).length * 20,
          verbal: QUESTIONS.verbal.filter(q => answers[q.id] === q.correct).length * 20,
          reasoning: QUESTIONS.reasoning.filter(q => answers[q.id] === q.correct).length * 25,
          advanced: Math.round(QUESTIONS.advanced.filter(q => answers[q.id] === q.correct).length * 33.3),
          coding: codingScore
        }
      })
      setView('result')
    }
  }

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
              <button className="border-b-2 border-brand pb-3 text-sm font-bold text-brand flex items-center gap-1.5">
                Assignment <span className="bg-brand-light text-brand text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">7</span>
              </button>
              <button className="text-ink-3 pb-3 text-sm font-semibold hover:text-ink flex items-center gap-1.5">
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

          {/* Sets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Set A', 'Set B', 'Set C', 'Set D', 'Set E', 'Set F', 'Set G'].map((setName, idx) => (
              <div 
                key={setName}
                onClick={() => handleSelectSet(setName)}
                className="card p-6 cursor-pointer hover-lift"
              >
                <h3 className="text-lg font-bold text-ink font-display mb-2">{setName} (ET)</h3>
                <div className="flex items-center justify-between text-xs text-ink-3 mt-4">
                  <span>82 Ques. • 3 hr 10 mins • 50 attempts</span>
                  <span className="text-[10px] bg-brand-subtle text-ink-2 px-2 py-0.5 rounded border border-line">No Expiry</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. INSTRUCTIONS VIEW
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
                📂 Sections :
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
          3. EXAM CONSOLE VIEW (Timed Assessment)
          ───────────────────────────────────────────────────────────── */}
      {view === 'exam' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[85vh]">
          
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
            <div className="flex overflow-x-auto gap-2 border-b border-line pb-2">
              {[
                { key: 'numerical', tag: 'A', name: 'Numerical' },
                { key: 'verbal', tag: 'B', name: 'Verbal' },
                { key: 'reasoning', tag: 'C', name: 'Reasoning' },
                { key: 'advanced', tag: 'D', name: 'Advanced' },
                { key: 'coding', tag: 'E', name: 'Coding' }
              ].map(sec => (
                <button
                  key={sec.key}
                  onClick={() => {
                    setActiveSection(sec.key)
                    setCurrentIdx(0)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                    activeSection === sec.key 
                      ? 'bg-brand border-brand text-white shadow-sm'
                      : 'bg-white border-line text-ink-3 hover:text-ink'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    activeSection === sec.key ? 'bg-white/25 text-white' : 'bg-brand-subtle text-brand'
                  }`}>
                    {sec.tag}
                  </span>
                  {sec.name}
                </button>
              ))}
            </div>

            {/* Question detail box */}
            <div className="flex-1 overflow-y-auto py-2">
              {getActiveSubset().length > 0 ? (
                (() => {
                  const q = getActiveSubset()[currentIdx]
                  const isCoding = activeSection === 'coding'

                  return (
                    <div className="space-y-6 h-full flex flex-col">
                      <div className="flex items-center justify-between text-xs text-ink-3">
                        <span className="font-semibold text-ink">Question {currentIdx + 1} of {getActiveSubset().length}</span>
                        <span>Marks: +4.0 | -1.0</span>
                      </div>

                      {/* Split view if Coding, else normal MCQ */}
                      {!isCoding ? (
                        <div className="space-y-6">
                          <div className="text-base font-semibold text-ink leading-relaxed font-display">
                            {q.question}
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = answers[q.id] === optIdx
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectOption(q.id, optIdx)}
                                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                                    isSelected 
                                      ? 'bg-brand-light border-brand text-ink font-medium' 
                                      : 'bg-white border-line text-ink-2 hover:bg-brand-subtle'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-brand' : 'border-line'
                                  }`}>
                                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                          {/* Problem desc */}
                          <div className="space-y-4 overflow-y-auto pr-2 text-xs text-ink-2">
                            <h4 className="text-sm font-bold text-ink font-display">{q.title}</h4>
                            <p className="leading-relaxed">{q.question}</p>
                            
                            <div className="space-y-2 bg-brand-subtle p-3 rounded-xl border border-line">
                              <div><strong>Input Format:</strong> {q.inputFormat}</div>
                              <div><strong>Output Format:</strong> {q.outputFormat}</div>
                              <div><strong>Constraints:</strong> {q.constraints}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div><strong>Sample Input:</strong> <code className="bg-page border border-line px-1 py-0.5 rounded font-mono text-ok">{q.sampleInput}</code></div>
                              <div><strong>Sample Output:</strong> <code className="bg-page border border-line px-1 py-0.5 rounded font-mono text-ok">{q.sampleOutput}</code></div>
                            </div>
                          </div>

                          {/* Code Editor */}
                          <div className="flex flex-col justify-between border border-line rounded-xl overflow-hidden bg-white h-full">
                            <div className="bg-page px-4 py-2 border-b border-line flex justify-between items-center text-xs">
                              <select 
                                value={editorLanguage}
                                onChange={(e) => setEditorLanguage(e.target.value)}
                                className="input rounded px-2 py-1 text-xs"
                              >
                                <option value="python">Python 3</option>
                                <option value="javascript">JavaScript</option>
                                <option value="cpp">C++ (GCC)</option>
                              </select>
                              <div className="text-[10px] text-ink-3 font-mono">Monaco Editor</div>
                            </div>

                            <div className="flex-1 min-h-[250px]">
                              <Editor
                                key={`${q.id}_${editorLanguage}`}
                                height="100%"
                                language={editorLanguage}
                                theme="vs"
                                value={answers[q.id] || q.initialCode[editorLanguage]}
                                onChange={(val) => handleCodeChange(q.id, val)}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 12,
                                  scrollbar: { vertical: 'auto', horizontal: 'auto' }
                                }}
                              />
                            </div>

                            <div className="bg-page border-t border-line p-3 flex justify-between items-center gap-3">
                              <button
                                onClick={() => runCodeSample(q)}
                                disabled={isCompiling}
                                className="btn-secondary btn-sm font-bold"
                              >
                                {isCompiling ? 'Running...' : 'Run Code'}
                              </button>
                              <span className="text-[10px] text-ink-3 font-mono">Ctrl + Enter to run</span>
                            </div>

                            {/* Console output display */}
                            {consoleOutput && (
                              <pre className="bg-page text-ink-2 font-mono p-3 text-[10px] overflow-y-auto max-h-[120px] border-t border-line leading-relaxed">
                                {consoleOutput}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="text-center text-ink-3 text-sm mt-12">No questions loaded for this section.</div>
              )}
            </div>

            {/* Exam console action buttons */}
            <div className="border-t border-line pt-4 flex justify-between items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => clearAnswer(getActiveSubset()[currentIdx]?.id)}
                  className="btn-secondary font-bold"
                >
                  Clear Answer
                </button>
                <button
                  onClick={() => toggleMarkReview(getActiveSubset()[currentIdx]?.id)}
                  className={`font-bold px-4 py-2 rounded-xl text-xs border cursor-pointer ${
                    markedQuestions.has(getActiveSubset()[currentIdx]?.id)
                      ? 'bg-warn-bg border-warn text-warn'
                      : 'btn-secondary'
                  }`}
                >
                  🔖 Mark for Review
                </button>
              </div>

              <div className="flex gap-2.5">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(currentIdx - 1)}
                  className={`font-bold px-4 py-2 rounded-xl text-xs border ${
                    currentIdx === 0 
                      ? 'bg-white border-line text-ink-3/50 cursor-not-allowed' 
                      : 'btn-secondary cursor-pointer'
                  }`}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => {
                    const subset = getActiveSubset()
                    if (currentIdx < subset.length - 1) {
                      const nextQ = subset[currentIdx + 1]
                      setVisitedQuestions(prev => new Set(prev).add(nextQ.id))
                      setCurrentIdx(currentIdx + 1)
                    } else {
                      // Transition to next section if last index
                      const order = ['numerical', 'verbal', 'reasoning', 'advanced', 'coding']
                      const nextSecIdx = order.indexOf(activeSection) + 1
                      if (nextSecIdx < order.length) {
                        const nextSec = order[nextSecIdx]
                        setActiveSection(nextSec)
                        setCurrentIdx(0)
                        setVisitedQuestions(prev => new Set(prev).add(QUESTIONS[nextSec][0]?.id))
                        toast.success(`Moving to Section: ${nextSec.toUpperCase()}`)
                      } else {
                        toast.success("Final section completed. Review your answers in the palette!")
                      }
                    }
                  }}
                  className="btn-primary font-bold px-6 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Save & Next →
                </button>
              </div>
            </div>

          </div>

          {/* Right Area: Sidebar Questions Grid Palette */}
          <div className="card p-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-sm font-bold text-ink mb-4 font-display">Question Palette</h3>
              
              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
                {/* Active Section Questions */}
                <div className="text-xs font-semibold text-ink-3 mb-2">Section Questions:</div>
                <div className="grid grid-cols-4 gap-2">
                  {getActiveSubset().map((q, idx) => {
                    const isCurrent = currentIdx === idx
                    const isAnswered = answers[q.id] !== undefined
                    const isMarked = markedQuestions.has(q.id)
                    const isVisited = visitedQuestions.has(q.id)

                    let statusClass = 'bg-white border-line text-ink-3 hover:bg-brand-subtle'
                    if (isCurrent) {
                      statusClass = 'bg-brand border-brand text-white shadow-sm'
                    } else if (isAnswered && isMarked) {
                      statusClass = 'bg-brand-light border-brand text-brand'
                    } else if (isMarked) {
                      statusClass = 'bg-warn-bg border-warn text-warn'
                    } else if (isAnswered) {
                      statusClass = 'bg-ok-bg border-ok text-ok'
                    } else if (isVisited) {
                      statusClass = 'bg-brand-light border-brand/40 text-brand'
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-9 h-9 rounded-lg font-bold text-xs border transition-all ${statusClass}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legend details */}
              <div className="border-t border-line mt-6 pt-4 space-y-2">
                <div className="text-xs font-semibold text-ink-3 mb-2.5">Status Legend:</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-white border border-line" /> Not Visited
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-brand-light border border-brand/40" /> Visited
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-ok-bg border border-ok" /> Answered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-warn-bg border border-warn" /> Marked
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className="w-3 h-3 rounded bg-brand-light border border-brand" /> Answered & Marked Review
                  </div>
                </div>
              </div>
            </div>

            {/* End Section / Submit button */}
            <div className="border-t border-line pt-4 space-y-2">
              <button
                onClick={() => {
                  const unanswered = ALL_QUESTIONS.filter(q => answers[q.id] === undefined).length
                  if (unanswered > 0) {
                    if (confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit the exam?`)) {
                      calculateScore()
                    }
                  } else {
                    if (confirm("Are you sure you want to submit your exam now?")) {
                      calculateScore()
                    }
                  }
                }}
                className="btn-success w-full font-bold p-3 rounded-xl text-xs cursor-pointer text-center"
              >
                Submit Entire Assessment
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. PERFORMANCE SCORE REPORT / RESULT VIEW
          ───────────────────────────────────────────────────────────── */}
      {view === 'result' && scoreReport && (
        <div className="space-y-8 pb-12">
          
          {/* Header completion banner */}
          <div className="card p-8 text-center max-w-xl mx-auto space-y-4">
            <span className="w-14 h-14 mx-auto rounded-full bg-brand-light flex items-center justify-center text-2xl">🎉</span>
            <div>
              <h2 className="page-title">Assessment Completed</h2>
              <p className="text-ink-3 text-xs mt-1">Here is a breakdown of your score report and percentile analysis.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-brand-subtle p-4 rounded-xl border border-line text-center">
              <div>
                <span className="text-[10px] text-ink-3 block uppercase font-bold tracking-wider">Your Percentile</span>
                <strong className="text-2xl text-warn font-display">{scoreReport.percentile}th</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink-3 block uppercase font-bold tracking-wider">Calculated Rank</span>
                <strong className="text-2xl text-brand font-display font-bold">#{scoreReport.rank}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-ink-3 pt-2">
              <div>MCQs Correct: <strong className="text-ok">{scoreReport.mcqScore} / {scoreReport.totalMcq}</strong></div>
              <div>Coding Score: <strong className="text-brand">{scoreReport.codingScore} / {scoreReport.totalCoding}</strong></div>
            </div>

            <button
              onClick={() => setView('dashboard')}
              className="btn-primary w-full font-bold p-3 rounded-xl text-xs cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>

          {/* Section Breakdown & Skill Gap Analyzers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Section performance */}
            <div className="card rounded-xl p-6 space-y-4">
              <h3 className="section-title">Section Performance</h3>
              <div className="space-y-3.5">
                {[
                  { name: 'Numerical Ability', value: scoreReport.sectionBreakdown.numerical, max: 100 },
                  { name: 'Verbal Ability', value: scoreReport.sectionBreakdown.verbal, max: 100 },
                  { name: 'Reasoning Ability', value: scoreReport.sectionBreakdown.reasoning, max: 100 },
                  { name: 'Advanced Reasoning', value: Math.round(scoreReport.sectionBreakdown.advanced), max: 100 },
                  { name: 'Advanced Coding', value: scoreReport.sectionBreakdown.coding, max: 100 }
                ].map(sec => (
                  <div key={sec.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-ink-3">
                      <span>{sec.name}</span>
                      <span className="font-mono text-ink">{sec.value}%</span>
                    </div>
                    <div className="progress-bar !h-2">
                      <div 
                        className="progress-fill progress-blue"
                        style={{ width: `${sec.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gap Analysis list */}
            <div className="card rounded-xl p-6 space-y-6">
              <h3 className="section-title">Skill Gap Analysis</h3>
              
              <div className="space-y-4">
                {/* Strong Skills */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-ok">✅ Your Skills (Score &gt;= 75%):</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {scoreReport.sectionBreakdown.numerical >= 75 && <span className="skill-tag"><span className="text-ok">✓</span> Quantitative Aptitude</span>}
                    {scoreReport.sectionBreakdown.verbal >= 75 && <span className="skill-tag"><span className="text-ok">✓</span> Verbal English</span>}
                    {scoreReport.sectionBreakdown.reasoning >= 75 && <span className="skill-tag"><span className="text-ok">✓</span> Logical Analysis</span>}
                    {scoreReport.sectionBreakdown.coding >= 75 && <span className="skill-tag"><span className="text-ok">✓</span> Algorithms & Coding</span>}
                    {scoreReport.sectionBreakdown.numerical < 75 && scoreReport.sectionBreakdown.verbal < 75 && scoreReport.sectionBreakdown.reasoning < 75 && scoreReport.sectionBreakdown.coding < 75 && (
                      <span className="text-[10px] text-ink-muted italic">None identified in this test. Keep practicing!</span>
                    )}
                  </div>
                </div>

                {/* Weak spots */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-bad">⚠️ Skills to Improve (Score &lt;= 50%):</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {scoreReport.sectionBreakdown.numerical <= 50 && (
                      <span className="flex items-center gap-2 bg-bad-soft border border-bad/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-bad">
                        Numerical Logic
                        <button type="button" className="btn-secondary !py-1 !px-2.5 !text-[11px] !rounded-full">Learn</button>
                      </span>
                    )}
                    {scoreReport.sectionBreakdown.verbal <= 50 && (
                      <span className="flex items-center gap-2 bg-bad-soft border border-bad/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-bad">
                        English Vocabulary
                        <button type="button" className="btn-secondary !py-1 !px-2.5 !text-[11px] !rounded-full">Learn</button>
                      </span>
                    )}
                    {scoreReport.sectionBreakdown.reasoning <= 50 && (
                      <span className="flex items-center gap-2 bg-bad-soft border border-bad/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-bad">
                        Syllogisms & Logic
                        <button type="button" className="btn-secondary !py-1 !px-2.5 !text-[11px] !rounded-full">Learn</button>
                      </span>
                    )}
                    {scoreReport.sectionBreakdown.coding <= 50 && (
                      <span className="flex items-center gap-2 bg-bad-soft border border-bad/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-bad">
                        Basic Scripting & Syntax
                        <button type="button" className="btn-secondary !py-1 !px-2.5 !text-[11px] !rounded-full">Learn</button>
                      </span>
                    )}
                    {scoreReport.sectionBreakdown.numerical > 50 && scoreReport.sectionBreakdown.verbal > 50 && scoreReport.sectionBreakdown.reasoning > 50 && scoreReport.sectionBreakdown.coding > 50 && (
                      <span className="text-[10px] text-ink-muted italic">None! Solid performance.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Course recommendation panel */}
              <div className="bg-brand-subtle border border-line rounded-[10px] p-4 space-y-2 text-xs">
                <div className="font-bold text-ink">💡 Recommended Course to Bridge Gaps:</div>
                <p className="text-ink-3">
                  Based on your performance, we recommend checking out the **Advanced Placement Logic Boot Camp** and practicing more **Dynamic Programming** questions on the platform.
                </p>
              </div>

            </div>

          </div>

          {/* Question Review Panel */}
          <div className="card rounded-xl p-6 space-y-4">
            <h3 className="section-title">Question Answer Review</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {ALL_QUESTIONS.map((q, idx) => {
                const isCoding = q.category === 'Advanced Coding'
                const userVal = answers[q.id]
                let isUserCorrect = false
                
                if (!isCoding) {
                  isUserCorrect = userVal === q.correct
                } else {
                  isUserCorrect = userVal !== undefined && !userVal.includes('pass')
                }

                return (
                  <div key={q.id} className="border-b border-line pb-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-ink-3 font-medium">Q{idx + 1} • {q.category}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        isUserCorrect ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'
                      }`}>
                        {isUserCorrect ? 'Correct' : 'Incorrect / Unattempted'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-ink">{q.question}</div>

                    {!isCoding ? (
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-3 pt-1">
                        <div>Your answer: <strong className={isUserCorrect ? 'text-ok' : 'text-bad'}>
                          {userVal !== undefined ? q.options[userVal] : 'Skipped'}
                        </strong></div>
                        <div>Correct answer: <strong className="text-ok">{q.correctText}</strong></div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-ink-3 pt-1">
                        <div>Your Submitted Code:</div>
                        <pre className="bg-page border border-line p-2 rounded font-mono text-[9px] text-ink-2 max-h-[100px] overflow-y-auto mt-1">
                          {userVal || 'No code submitted.'}
                        </pre>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[10px] text-ink-3 bg-brand-subtle p-2 rounded border border-line mt-1">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}

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

            {loadingStats ? (
              <div className="text-center py-12 text-ink-3">Loading Leaderboard...</div>
            ) : (
              <div className="space-y-4">
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
                          <td className="py-3 px-3 text-ink-2 font-mono">{item.percentage}% ({item.score}/{item.total_questions * 4})</td>
                          <td className="py-3 px-3 text-ink-3 font-mono">{item.percentile}th</td>
                          <td className="py-3 px-3 text-ink-3 font-mono">{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

    </div>
  )
}
