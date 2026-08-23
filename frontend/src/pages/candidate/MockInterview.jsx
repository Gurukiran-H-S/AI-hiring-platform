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
    <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto">
      <div>
        <h1 className="text-page-title text-ink">AI Mock Interview</h1>
        <p className="text-sm text-ink-soft mt-1">
          Simulate professional interviews with real-time feedback on speaking speed, fillers, and grammar.
        </p>
      </div>

      {!stream ? (
        <div className="card p-8 max-w-md mx-auto space-y-6 text-center">
          <div>
            <h2 className="section-title">Select Interview Stream</h2>
            <p className="text-xs text-ink-muted mt-1">Choose a specialization to focus your preparation.</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setStream('HR')}
              className="w-full bg-brand-light border border-brand/30 text-brand p-4 rounded-[10px] hover:border-brand hover:bg-canvas font-semibold transition-colors text-sm"
            >
              💼 HR / Cultural Interview
            </button>
            <button
              onClick={() => setStream('Technical')}
              className="w-full bg-brand-light border border-brand/30 text-brand p-4 rounded-[10px] hover:border-brand hover:bg-canvas font-semibold transition-colors text-sm"
            >
              💻 Software Engineering Technical
            </button>
          </div>
        </div>
      ) : !completed ? (
        <div className="card p-8 space-y-6">
          <div className="flex justify-between items-center text-xs text-ink-muted border-b border-line-soft pb-3">
            <span>Specialization: <strong className="text-ink">{stream}</strong></span>
            <span>Question {currentIdx + 1} of {MOCK_QUESTIONS[stream].length}</span>
          </div>

          {/* Question area */}
          <div className="bg-canvas border border-line p-6 rounded-[10px] text-center">
            <span className="text-xs font-semibold text-ink-muted block mb-2 uppercase tracking-wide">Interview Prompt</span>
            <p className="text-lg text-ink font-medium leading-relaxed">
              "{MOCK_QUESTIONS[stream][currentIdx]}"
            </p>
          </div>

          {/* Interactive simulator controls */}
          <div className="flex flex-col items-center gap-3 py-2">
            {!recording ? (
              <button
                onClick={handleStartRecording}
                className="btn-primary w-16 h-16 rounded-full flex items-center justify-center text-xl"
                title="Start recording"
              >
                🎙️
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="btn-danger w-16 h-16 rounded-full flex items-center justify-center text-xl animate-pulse"
                title="Stop recording"
              >
                ⏹️
              </button>
            )}
            <span className="text-xs text-ink-muted font-medium">
              {recording ? 'Recording audio... Speak now.' : 'Click to begin answer recording'}
            </span>
          </div>

          {/* Answer transcript / answer input */}
          {transcript && (
            <div className="space-y-2 bg-canvas border border-line p-4 rounded-[10px]">
              <span className="text-xs text-ink-muted block font-semibold">Your Answer:</span>
              <textarea
                readOnly
                value={transcript}
                rows={4}
                className="input italic font-mono leading-relaxed resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <button
              onClick={() => {
                setStream(null)
                setCurrentIdx(0)
                setTranscript('')
              }}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="btn-primary btn-sm"
            >
              {currentIdx < MOCK_QUESTIONS[stream].length - 1 ? 'Next Question' : 'Finish & Evaluate'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-8 max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="w-14 h-14 mx-auto mb-2 rounded-full bg-brand-light flex items-center justify-center text-2xl">📊</span>
            <h2 className="section-title">AI Speech Feedback Report</h2>
            <p className="text-sm text-ink-soft mt-1">Analysis completed based on language delivery and vocabulary strength.</p>
          </div>

          {/* Feedback sections */}
          {aiFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-canvas border border-line p-3 rounded-[10px]">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wide">Overall Score</span>
                  <strong className="text-lg text-ok">{aiFeedback.score}%</strong>
                </div>
                <div className="bg-canvas border border-line p-3 rounded-[10px]">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wide">Fluency / Pace</span>
                  <strong className="text-lg text-brand">{aiFeedback.pace}</strong>
                </div>
                <div className="bg-canvas border border-line p-3 rounded-[10px]">
                  <span className="text-[10px] text-ink-muted block uppercase tracking-wide">Grammar Grade</span>
                  <strong className="text-lg text-warn">{aiFeedback.grammarScore}</strong>
                </div>
              </div>

              <div className="bg-canvas border border-line p-4 rounded-[10px]">
                <span className="text-xs text-ink-soft block font-semibold mb-2">Speech Filler Words Detected:</span>
                <div className="flex flex-wrap gap-2">
                  {aiFeedback.fillers.map((f, i) => (
                    <span key={i} className="badge badge-danger">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-canvas border border-line p-4 rounded-[10px]">
                <span className="text-xs text-ink-soft block font-semibold mb-2">AI Improvement Plan:</span>
                <ul className="space-y-1.5 text-sm text-ink-soft">
                  {aiFeedback.suggestions.map((s, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-brand">•</span> {s}
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
            className="btn-primary w-full py-2.5 rounded-[10px] text-sm font-semibold"
          >
            Start New Interview Session
          </button>
        </div>
      )}
    </div>
  )
}
