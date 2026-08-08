import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const MOCK_QUESTIONS = [
  {
    id: 1,
    category: 'Quantitative',
    question: 'A train 125 m long passes a telegraph post in 10 seconds. What is the speed of the train in km/h?',
    options: ['36 km/h', '45 km/h', '54 km/h', '60 km/h'],
    correct: 1, // index of 45 km/h
  },
  {
    id: 2,
    category: 'Logical Reasoning',
    question: 'Find the next number in the series: 3, 5, 9, 17, 33, ...',
    options: ['48', '50', '65', '68'],
    correct: 2, // 65 (3*2-1=5, 5*2-1=9, etc., wait, 33*2-1 = 65)
  },
  {
    id: 3,
    category: 'Verbal Ability',
    question: 'Choose the word which is most opposite in meaning to "Spurious".',
    options: ['Genuine', 'Fake', 'Phony', 'Spiritual'],
    correct: 0,
  },
]

export const AptitudeTest = () => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isSubmitted])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: optIdx,
    })
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    let correctCount = 0
    MOCK_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        correctCount++
      }
    })
    setScore(correctCount)
    toast.success('Assessment submitted successfully!')
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent font-display">
            Aptitude & Verbal Evaluation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test your Quantitative, Logical Reasoning, and Verbal skills.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-widest">Time Remaining</div>
          <div className="text-2xl font-mono font-extrabold text-amber-400">{formatTime(timeLeft)}</div>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Questions Navigation Panel */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 h-fit">
            <h2 className="text-sm font-bold text-slate-300 mb-3 font-display">Progress Index</h2>
            <div className="grid grid-cols-5 gap-2">
              {MOCK_QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border ${
                    currentIdx === idx
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : selectedAnswers[idx] !== undefined
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-emerald-500 font-bold p-2.5 rounded-xl text-sm"
            >
              Submit Assessment
            </button>
          </div>

          {/* Current Question View */}
          <div className="md:col-span-2 glass-card p-8 border border-white/10 rounded-2xl bg-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {MOCK_QUESTIONS[currentIdx].category}
              </span>
              <span className="text-xs text-slate-500">Question {currentIdx + 1} of {MOCK_QUESTIONS.length}</span>
            </div>

            <div className="text-base text-slate-200 font-medium leading-relaxed">
              {MOCK_QUESTIONS[currentIdx].question}
            </div>

            <div className="space-y-3">
              {MOCK_QUESTIONS[currentIdx].options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    selectedAnswers[currentIdx] === optIdx
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm font-medium">{opt}</span>
                  <span className={`w-4 h-4 rounded-full border ${selectedAnswers[currentIdx] === optIdx ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5 max-w-lg mx-auto space-y-6">
          <span className="text-5xl block">🎉</span>
          <div>
            <h2 className="text-2xl font-bold font-display">Assessment Completed</h2>
            <p className="text-slate-400 text-sm mt-1">Here is a breakdown of your score report.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
            <div>
              <span className="text-xs text-slate-500 block">Total Questions</span>
              <strong className="text-xl text-white">{MOCK_QUESTIONS.length}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Correct Answers</span>
              <strong className="text-xl text-emerald-400">{score}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSubmitted(false)
              setSelectedAnswers({})
              setCurrentIdx(0)
              setTimeLeft(600)
            }}
            className="btn-secondary w-full py-2.5 rounded-xl text-sm"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  )
}
