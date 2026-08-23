import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api, useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_PRESETS = [
  { id: 'python-backend', title: 'Python Backend Developer', icon: '🐍', type: 'Technical', desc: 'FastAPI, REST APIs, SQL indexing, Docker, Asyncio' },
  { id: 'fullstack-react', title: 'Full Stack Web Developer', icon: '⚛️', type: 'Technical', desc: 'React, Node.js, REST vs GraphQL, Component lifecycle' },
  { id: 'devops-cloud', title: 'DevOps & Cloud Engineer', icon: '☁️', type: 'Technical', desc: 'Docker, Kubernetes, CI/CD pipelines, Infrastructure' },
  { id: 'hr-behavioral', title: 'HR & Behavioral Round', icon: '💼', type: 'Behavioral', desc: 'STAR methodology, leadership, conflict resolution, career goals' },
  { id: 'mixed-assessment', title: 'General Comprehensive Round', icon: '🎯', type: 'Mixed', desc: 'Balanced technical architecture & behavioral scenario questions' },
]

export const MockInterview = () => {
  const { user } = useAuth()

  // Workflow Stages: 'setup' | 'interview' | 'report'
  const [stage, setStage] = useState('setup')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLE_PRESETS[0].title)
  const [interviewType, setInterviewType] = useState('Technical')
  const [numQuestions, setNumQuestions] = useState(5)

  // Active Interview Session State
  const [interviewSession, setInterviewSession] = useState(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answersMap, setAnswersMap] = useState({}) // { [qId]: { transcript, point_results, coverage_score, answer_score, filler_words_count, duration_seconds } }

  // Speech Recognition & Live Streaming
  const [recording, setRecording] = useState(false)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [livePointsAnalysis, setLivePointsAnalysis] = useState([])
  const [liveCoverage, setLiveCoverage] = useState(0)
  const [liveScore, setLiveScore] = useState(0)
  const [liveFillerCount, setLiveFillerCount] = useState(0)
  const [analyzingLive, setAnalyzingLive] = useState(false)

  // Final Report State
  const [finalReport, setFinalReport] = useState(null)

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const debounceAnalyzeRef = useRef(null)

  // Fetch available candidate jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/jobs/')
        if (Array.isArray(data)) setJobs(data)
        else if (data?.jobs) setJobs(data.jobs)
      } catch (err) {
        console.error('Failed to load jobs:', err)
      }
    }
    fetchJobs()
  }, [])

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setRecording(true)
        setMicPermissionDenied(false)
      }

      recognition.onresult = (event) => {
        let interim = ''
        let finalStr = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          const transcriptChunk = result[0]?.transcript || ''
          if (result.isFinal) {
            finalStr += transcriptChunk + ' '
          } else {
            interim += transcriptChunk
          }
        }

        if (finalStr) {
          setFinalTranscript((prev) => {
            const combined = (prev + ' ' + finalStr).trim()
            triggerLivePointAnalysis(combined)
            return combined
          })
        }
        setInterimTranscript(interim)
        if (interim) {
          triggerLivePointAnalysis((finalTranscript + ' ' + interim).trim())
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true)
          toast.error('Microphone permission is required for AI Mock Interview.')
        } else if (event.error !== 'no-speech') {
          toast.error(`Speech recognition: ${event.error}`)
        }
        setRecording(false)
      }

      recognition.onend = () => {
        setRecording(false)
      }

      recognitionRef.current = recognition
    } catch (err) {
      console.error('Failed to init speech recognition:', err)
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }, [finalTranscript])

  // Recording Timer
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  const currentQuestion = useMemo(() => {
    if (!interviewSession?.questions?.length) return null
    return interviewSession.questions[currentQIndex] || null
  }, [interviewSession, currentQIndex])

  // Trigger Debounced Live Point Detection
  const triggerLivePointAnalysis = (text) => {
    if (!text || !currentQuestion || !interviewSession) return
    if (debounceAnalyzeRef.current) clearTimeout(debounceAnalyzeRef.current)

    debounceAnalyzeRef.current = setTimeout(async () => {
      try {
        setAnalyzingLive(true)
        const { data } = await api.post(`/interview/${interviewSession.id}/analyze`, {
          question_id: currentQuestion.id,
          transcript: text,
          duration_seconds: recordingSeconds,
        })
        setLivePointsAnalysis(data.point_results || [])
        setLiveCoverage(data.coverage_score || 0)
        setLiveScore(data.answer_score || 0)
        setLiveFillerCount(data.filler_words_count || 0)
      } catch (err) {
        console.warn('Live point analysis notice:', err)
      } finally {
        setAnalyzingLive(false)
      }
    }, 450)
  }

  // Start Interview Handler
  const handleStartInterview = async () => {
    setLoading(true)
    try {
      const payload = {
        job_id: selectedJobId || undefined,
        role_title: selectedRole,
        interview_type: interviewType,
        num_questions: numQuestions,
      }
      const { data } = await api.post('/interview/start', payload)
      setInterviewSession(data)
      setCurrentQIndex(0)
      setAnswersMap({})
      resetQuestionState(data.questions[0])
      setStage('interview')
      toast.success(`AI Interview Started for ${data.role_title}!`)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to start interview session.')
    } finally {
      setLoading(false)
    }
  }

  const resetQuestionState = (questionObj) => {
    setFinalTranscript('')
    setInterimTranscript('')
    setRecordingSeconds(0)
    setLiveCoverage(0)
    setLiveScore(0)
    setLiveFillerCount(0)
    if (questionObj?.expected_points) {
      setLivePointsAnalysis(
        questionObj.expected_points.map((p) => ({
          expected_point: p.point || p,
          matched: false,
          confidence: 0.0,
          evidence_text: null,
        }))
      )
    }
  }

  // Start Microphone Recording
  const handleStartRecording = () => {
    if (!speechSupported) {
      return toast.error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
    }
    if (!recognitionRef.current) return

    try {
      setInterimTranscript('')
      recognitionRef.current.start()
      setRecording(true)
    } catch (err) {
      console.warn('Recognition start exception:', err)
    }
  }

  // Stop Microphone Recording
  const handleStopRecording = () => {
    if (recognitionRef.current && recording) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.warn(err)
      }
    }
    setRecording(false)
  }

  // Submit Answer & Move to Next Question
  const handleSaveAndAdvance = async () => {
    handleStopRecording()
    if (!currentQuestion || !interviewSession) return

    const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim()

    setLoading(true)
    try {
      // 1. Submit current response to backend
      const { data } = await api.post(`/interview/${interviewSession.id}/response`, {
        question_id: currentQuestion.id,
        transcript: fullTranscript,
        duration_seconds: recordingSeconds,
      })

      // Store in local answers map
      setAnswersMap((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          transcript: fullTranscript,
          ...data.analysis,
        },
      }))

      // 2. Advance to next question or complete interview
      const nextIdx = currentQIndex + 1
      if (nextIdx < interviewSession.questions.length) {
        setCurrentQIndex(nextIdx)
        const nextQ = interviewSession.questions[nextIdx]
        const existingAns = answersMap[nextQ.id]
        if (existingAns) {
          setFinalTranscript(existingAns.transcript || '')
          setLivePointsAnalysis(existingAns.point_results || [])
          setLiveCoverage(existingAns.coverage_score || 0)
          setLiveScore(existingAns.answer_score || 0)
          setLiveFillerCount(existingAns.filler_words_count || 0)
        } else {
          resetQuestionState(nextQ)
        }
      } else {
        // Complete interview
        await handleFinishInterview()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit question response.')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousQuestion = () => {
    handleStopRecording()
    if (currentQIndex > 0) {
      const prevIdx = currentQIndex - 1
      setCurrentQIndex(prevIdx)
      const prevQ = interviewSession.questions[prevIdx]
      const existingAns = answersMap[prevQ.id]
      if (existingAns) {
        setFinalTranscript(existingAns.transcript || '')
        setLivePointsAnalysis(existingAns.point_results || [])
        setLiveCoverage(existingAns.coverage_score || 0)
        setLiveScore(existingAns.answer_score || 0)
        setLiveFillerCount(existingAns.filler_words_count || 0)
      } else {
        resetQuestionState(prevQ)
      }
    }
  }

  // Finish Interview & Fetch Comprehensive Evaluation Report
  const handleFinishInterview = async () => {
    setLoading(true)
    try {
      await api.post(`/interview/${interviewSession.id}/complete`)
      const { data } = await api.get(`/interview/${interviewSession.id}/report`)
      setFinalReport(data)
      setStage('report')
      toast.success('🎉 Interview Completed! Evaluation score stored.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to finalize interview report.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ═══════════════════════ 1. SETUP STAGE ═══════════════════════
  if (stage === 'setup') {
    return (
      <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto animate-in fade-in duration-300">
        <header className="card bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/40 border border-blue-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                Interactive Speech &amp; NLP Simulator
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              AI Mock Interview Arena
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Speak into your microphone. Experience live speech-to-text, real-time expected answer point detection (`1 Mentioned` vs `0 Not Mentioned`), and explainable scoring.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald font-bold">✓ Live Speech Recognition</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Role Track Selector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card space-y-4">
              <h2 className="section-title flex items-center justify-between">
                <span>Select Target Role or Job Opening</span>
                <span className="text-xs text-slate-500 font-normal">Step 1 of 2</span>
              </h2>

              {/* Linked Job Openings Dropdown if any */}
              {jobs.length > 0 && (
                <div>
                  <label className="field-label">Target Applied Job (Optional):</label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      const jid = e.target.value
                      setSelectedJobId(jid)
                      const found = jobs.find((j) => String(j.id) === String(jid))
                      if (found) setSelectedRole(found.title)
                    }}
                    className="input w-full"
                  >
                    <option value="">-- Choose from Active Job Listings --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company_name || 'HireAI Partner'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Popular Role Tracks */}
              <div className="space-y-2.5 pt-1">
                <label className="field-label">Or Select Standard Interview Track:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_PRESETS.map((preset) => {
                    const isSelected = selectedRole === preset.title
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setSelectedRole(preset.title)
                          setInterviewType(preset.type)
                          setSelectedJobId('')
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0A66C2] bg-blue-50/60 shadow-xs ring-2 ring-[#0A66C2]/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{preset.icon}</span>
                          <h3 className="text-sm font-bold text-slate-900">{preset.title}</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{preset.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Configuration & Start */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card space-y-5">
              <h2 className="section-title">Interview Parameters</h2>

              <div>
                <label className="field-label">Interview Category:</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Technical', 'HR', 'Behavioral', 'Mixed'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        interviewType === type
                          ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type} Round
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Number of Questions:</label>
                <div className="flex items-center gap-3">
                  {[5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        numQuestions === num
                          ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {num} Questions ({num * 3} mins)
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Selected Role:</span>
                  <span className="text-[#0A66C2]">{selectedRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated Duration:</span>
                  <span>{numQuestions * 3}–{numQuestions * 4} Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Evaluation Formula:</span>
                  <span>70% Coverage + 30% Semantic</span>
                </div>
              </div>

              {!speechSupported && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  ⚠️ Web Speech API is not detected in this browser. Please use Chrome, Edge, or Safari for live voice recognition.
                </div>
              )}

              <button
                type="button"
                onClick={handleStartInterview}
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Initializing AI Interview...
                  </>
                ) : (
                  <>
                    <span>🎙️</span> Start AI Mock Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════ 2. ACTIVE INTERVIEW STAGE ═══════════════════════
  if (stage === 'interview' && currentQuestion) {
    const totalQ = interviewSession?.questions?.length || 5
    const progressPct = Math.round(((currentQIndex + 1) / totalQ) * 100)

    return (
      <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto animate-in fade-in duration-300">
        {/* Top Header: Progress & Timer */}
        <div className="card !py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center font-bold text-base border border-blue-100">
              {currentQIndex + 1}
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {interviewSession.role_title} · {interviewSession.interview_type}
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                Question {currentQIndex + 1} of {totalQ}
              </div>
            </div>
          </div>

          {/* Center: Progress Bar */}
          <div className="w-48 sm:w-64 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0A66C2] to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>

          {/* Right: Live Speaking Timer */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${recording ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`}></span>
            <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              ⏱️ {formatTime(recordingSeconds)}
            </span>
          </div>
        </div>

        {/* Microphone Permission Banner if blocked */}
        {micPermissionDenied && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🚫</span>
              <span>Microphone permission was denied. Please allow microphone access in your browser to speak your answer.</span>
            </div>
            <button onClick={handleStartRecording} className="btn-secondary btn-sm !py-1 !px-2.5 text-xs text-rose-800">
              Try Again
            </button>
          </div>
        )}

        {/* Question Banner */}
        <div className="card bg-gradient-to-br from-white to-blue-50/40 border-2 border-blue-200/80 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-purple text-[10.5px] font-bold uppercase tracking-wider">
              {currentQuestion.category || 'Core Question'}
            </span>
            <span className="badge badge-neutral text-[10.5px] font-semibold">
              Difficulty: {currentQuestion.difficulty || 'Medium'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug font-display">
            "{currentQuestion.question_text}"
          </h2>
        </div>

        {/* Expected Answer Points Section (The Heart of Visual Feedback) */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span>🎯 Expected Answer Points &amp; Coverage</span>
              {analyzingLive && <span className="text-[10px] text-[#0A66C2] animate-pulse">Evaluating live speech...</span>}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Coverage: <strong className={liveCoverage >= 70 ? 'text-emerald-700' : 'text-slate-800'}>{liveCoverage}%</strong>
              </span>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] border border-blue-200">
                Question Score: <strong>{liveScore}%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {livePointsAnalysis.map((p, idx) => {
              const isMatched = p.matched
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isMatched
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{idx + 1}.</span>
                      <span>{p.expected_point}</span>
                    </div>
                    {isMatched && p.evidence_text && (
                      <div className="text-[10.5px] text-emerald-700 italic line-clamp-1">
                        "{p.evidence_text}"
                      </div>
                    )}
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                      isMatched
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isMatched ? '1 ✓ Mentioned' : '0 ✗ Not Mentioned'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Transcript Box & Microphone Controls */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <span>🎙️ Live Candidate Transcript</span>
                {recording && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span> Live Listening
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Speak clearly into your microphone. Words are transcribed and evaluated in real time.
              </p>
            </div>

            {/* Microphone Action Buttons */}
            <div className="flex items-center gap-2">
              {!recording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="btn-primary text-xs font-bold !py-2 !px-4 shadow-sm flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#0A66C2] to-indigo-600 hover:opacity-95"
                >
                  <span>🎙️</span> Start Speaking
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="btn-danger text-xs font-bold !py-2 !px-4 shadow-sm flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <span>⏹️</span> Stop Recording
                </button>
              )}
            </div>
          </div>

          {/* Transcript Display Area */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-slate-100 min-h-[130px] font-sans text-sm leading-relaxed border border-slate-800 shadow-inner flex flex-col justify-between">
            <div>
              {finalTranscript || interimTranscript ? (
                <div>
                  <span className="text-slate-100 font-medium">{finalTranscript}</span>
                  {interimTranscript && (
                    <span className="text-blue-300 italic opacity-85 ml-1 animate-pulse">
                      {interimTranscript}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 italic text-xs py-6 text-center">
                  {recording
                    ? 'Listening... Speak your answer into the microphone...'
                    : 'Click "Start Speaking" above and state your answer clearly.'}
                </div>
              )}
            </div>

            {/* Live Metrics Footer inside transcript box */}
            <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Words: <strong className="text-slate-200">{finalTranscript.split(/\s+/).filter(Boolean).length}</strong></span>
                <span>Filler Words: <strong className={liveFillerCount > 3 ? 'text-amber-400' : 'text-slate-200'}>{liveFillerCount}</strong></span>
              </div>
              <div className="text-[10.5px] text-slate-500">
                {recording ? '🔴 Continuous Streaming Audio' : 'Microphone Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handlePreviousQuestion}
            disabled={currentQIndex === 0 || loading}
            className={`btn-secondary text-xs font-bold !py-2.5 !px-4 ${
              currentQIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            ← Previous Question
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAndAdvance}
              disabled={loading}
              className="btn-primary text-xs font-bold !py-2.5 !px-5 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : currentQIndex + 1 < totalQ ? (
                <>
                  Save &amp; Next Question →
                </>
              ) : (
                <>
                  🏁 Submit &amp; View Final Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════ 3. FINAL REPORT STAGE ═══════════════════════
  if (stage === 'report' && finalReport) {
    const finalScore = finalReport.final_score || 0
    const coverageScore = finalReport.coverage_score || 0
    const relevanceScore = finalReport.relevance_score || 0
    const commScore = finalReport.communication_score || 0

    return (
      <div className="space-y-6 pb-12 w-full max-w-5xl mx-auto animate-in fade-in duration-300">
        {/* Congratulations Banner */}
        <div className="card bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-blue-50/50 border-2 border-emerald-200/80 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="badge badge-emerald text-xs font-bold px-3 py-1 uppercase tracking-wider">
              AI Mock Interview Complete
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              Interview Evaluation Report
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Target Track: <strong className="text-slate-800">{finalReport.role_title}</strong> · {finalReport.interview_type} Round
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-md flex flex-col items-center justify-center shrink-0 min-w-[170px]">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Final Score</div>
            <div className={`text-4xl font-extrabold font-mono ${
              finalScore >= 75 ? 'text-emerald-600' : finalScore >= 50 ? 'text-[#0A66C2]' : 'text-rose-600'
            }`}>
              {finalScore}%
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">✓ Saved to Platform</div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Technical Knowledge</div>
            <div className="text-2xl font-bold font-mono text-slate-900">{finalScore}%</div>
            <div className="text-[11px] text-slate-500">Core technical concepts &amp; problem-solving</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer Coverage</div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{coverageScore}%</div>
            <div className="text-[11px] text-slate-500">Percentage of expected points addressed</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Semantic Relevance</div>
            <div className="text-2xl font-bold font-mono text-[#0A66C2]">{relevanceScore}%</div>
            <div className="text-[11px] text-slate-500">Relevance to the question context</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Communication</div>
            <div className="text-2xl font-bold font-mono text-purple-600">{commScore}%</div>
            <div className="text-[11px] text-slate-500">Pace, clarity &amp; minimal filler usage</div>
          </div>
        </div>

        {/* Strengths & Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="card space-y-3">
            <h3 className="section-title text-emerald-700 flex items-center gap-2">
              <span>🌟 Key Strengths</span>
            </h3>
            <ul className="space-y-2">
              {(finalReport.strengths || []).map((str, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Areas */}
          <div className="card space-y-3">
            <h3 className="section-title text-amber-700 flex items-center gap-2">
              <span>💡 Areas for Growth &amp; Skill Recommendations</span>
            </h3>
            <ul className="space-y-2">
              {(finalReport.improvements || []).map((imp, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question-by-Question Detailed Breakdown Accordion */}
        <div className="card space-y-4">
          <h2 className="section-title">Question-by-Question Transcript &amp; Point Analysis</h2>

          <div className="space-y-3">
            {(finalReport.questions_detail || []).map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="badge badge-blue text-[10px] font-bold">Question {item.question_number} · {item.category}</span>
                    <h4 className="text-sm font-bold text-slate-900 font-display">"{item.question_text}"</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold font-mono text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      Score: {item.answer_score}%
                    </span>
                  </div>
                </div>

                {/* Transcript snippet */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Candidate Live Transcript:</span>
                  <p className="italic leading-relaxed">"{item.transcript}"</p>
                </div>

                {/* Expected Points Matching */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Expected Points Evaluation:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(item.point_results || []).map((pt, pIdx) => (
                      <div
                        key={pIdx}
                        className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
                          pt.matched
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="line-clamp-1">{pt.expected_point}</span>
                        <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full ${
                          pt.matched ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {pt.matched ? '1 ✓' : '0 ✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setStage('setup')
              setFinalReport(null)
            }}
            className="btn-secondary text-xs font-bold !py-2.5 !px-5"
          >
            🔄 Retake Interview Session
          </button>

          <Link
            to="/candidate"
            className="btn-primary text-xs font-bold !py-2.5 !px-5 shadow-sm"
          >
            📊 Return to Candidate Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return null
}