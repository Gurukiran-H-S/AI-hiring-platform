import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const MOCK_QUESTIONS = {
  HR: [
    'Tell me about yourself and your career aspirations.',
    'Why should we hire you over other candidates?',
    'Describe a situation where you had to work with a difficult team member.',
  ],
  Technical: [
    'Explain the difference between SQL and NoSQL databases.',
    'How do you manage complex asynchronous states in frontend applications?',
    'Explain how garbage collection works in Java or V8 engine.',
  ],
}

export const MockInterview = () => {
  const [stream, setStream] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiFeedback, setAiFeedback] = useState(null)

  const handleStartRecording = () => {
    setRecording(true)
    setTranscript('Simulating speech audio input analysis...')
    toast.success('Microphone active. Start speaking!')
  }

  const handleStopRecording = () => {
    setRecording(false)
    setTranscript(
      'I have worked on several frontend applications using React and Redux. Uh, one of the biggest challenges I faced was managing caching for dashboard API calls. I solved it using, like, local store cache middleware and, uh, optimising re-renders.'
    )
  }

  const handleNext = () => {
    const list = MOCK_QUESTIONS[stream]
    if (currentIdx < list.length - 1) {
      setCurrentIdx((prev) => prev + 1)
      setTranscript('')
    } else {
      // Complete mock interview
      setCompleted(true)
      // Generate simulated feedback
      setAiFeedback({
        score: 82,
        pace: 'Normal (130 wpm)',
        fillers: ['uh (2 times)', 'like (1 time)'],
        grammarScore: 'Excellent',
        suggestions: [
          'Try to reduce filler words when explaining backend caching architecture.',
          'Great articulation and tone modulation.',
        ],
      })
      toast.success('AI Evaluation complete!')
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent font-display">
          AI Mock Interview & Speech Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Simulate professional interviews with real-time feedback on speaking speed, fillers, and grammar.
        </p>
      </div>

      {!stream ? (
        <div className="glass-card p-8 border border-white/10 rounded-2xl bg-white/5 max-w-md mx-auto space-y-6 text-center">
          <h2 className="text-lg font-bold font-display">Select Interview Stream</h2>
          <p className="text-xs text-slate-400">Choose a specialization to focus your preparation.</p>
          <div className="space-y-3">
            <button
              onClick={() => setStream('HR')}
              className="w-full bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-xl hover:bg-indigo-500/30 font-bold transition-all text-sm"
            >
              💼 HR / Cultural Interview
            </button>
            <button
              onClick={() => setStream('Technical')}
              className="w-full bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl hover:bg-emerald-500/30 font-bold transition-all text-sm"
            >
              💻 Software Engineering Technical
            </button>
          </div>
        </div>
      ) : !completed ? (
        <div className="glass-card p-8 border border-white/10 rounded-2xl bg-white/5 space-y-6">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Specialization: <strong>{stream}</strong></span>
            <span>Question {currentIdx + 1} of {MOCK_QUESTIONS[stream].length}</span>
          </div>

          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl text-center">
            <span className="text-sm font-semibold text-slate-400 block mb-2">Interview Prompt:</span>
            <p className="text-lg text-white font-medium leading-relaxed font-display">
              "{MOCK_QUESTIONS[stream][currentIdx]}"
            </p>
          </div>

          {/* Interactive simulator controls */}
          <div className="flex flex-col items-center gap-4 py-4">
            {!recording ? (
              <button
                onClick={handleStartRecording}
                className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-xl transition-all shadow-lg shadow-indigo-500/30 animate-pulse"
              >
                🎙️
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-xl transition-all shadow-lg shadow-rose-500/30"
              >
                ⏹️
              </button>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {recording ? 'Recording audio... Speak now.' : 'Click to begin answer recording'}
            </span>
          </div>

          {transcript && (
            <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block font-semibold">Speech-to-Text Transcript:</span>
              <p className="text-xs text-slate-300 italic font-mono leading-relaxed">{transcript}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setStream(null)
                setCurrentIdx(0)
                setTranscript('')
              }}
              className="btn-secondary py-2 px-4 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2 rounded-xl text-xs font-bold"
            >
              {currentIdx < MOCK_QUESTIONS[stream].length - 1 ? 'Next Question' : 'Finish & Evaluate'}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 border border-white/10 rounded-2xl bg-white/5 max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-5xl">📊</span>
            <h2 className="text-2xl font-bold font-display">AI Speech Feedback Report</h2>
            <p className="text-xs text-slate-400">Analysis completed based on language delivery and vocabulary strength.</p>
          </div>

          {aiFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Overall Score</span>
                  <strong className="text-lg text-emerald-400">{aiFeedback.score}%</strong>
                </div>
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Fluency / Pace</span>
                  <strong className="text-lg text-indigo-400">{aiFeedback.pace}</strong>
                </div>
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Grammar Grade</span>
                  <strong className="text-lg text-amber-400">{aiFeedback.grammarScore}</strong>
                </div>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block font-semibold mb-2">Speech Filler Words Detected:</span>
                <div className="flex flex-wrap gap-2">
                  {aiFeedback.fillers.map((f, i) => (
                    <span key={i} className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-slate-400 block font-semibold">AI Improvement Plan:</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiFeedback.suggestions.map((s, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-indigo-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setStream(null)
              setCompleted(false)
              setCurrentIdx(0)
              setTranscript('')
              setAiFeedback(null)
            }}
            className="w-full bg-gradient-to-r from-indigo-500 to-emerald-500 font-bold py-2.5 rounded-xl text-sm"
          >
            Start New Interview Sessions
          </button>
        </div>
      )}
    </div>
  )
}
