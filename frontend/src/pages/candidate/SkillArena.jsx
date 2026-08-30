import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const SkillArena = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [candidateStats, setCandidateStats] = useState(null)
  const [aptitudeStats, setAptitudeStats] = useState(null)
  const [interviewHistory, setInterviewHistory] = useState([])
  const [latestInterview, setLatestInterview] = useState(null)

  useEffect(() => {
    const fetchArenaData = async () => {
      setLoading(true)
      try {
        const [candRes, aptRes, intHistRes, intLatestRes] = await Promise.allSettled([
          api.get('/analytics/candidate'),
          api.get('/aptitude/stats'),
          api.get('/interview/history'),
          api.get('/interview/candidate/latest'),
        ])

        if (candRes.status === 'fulfilled') {
          setCandidateStats(candRes.value.data)
        }
        if (aptRes.status === 'fulfilled') {
          setAptitudeStats(aptRes.value.data)
        }
        if (intHistRes.status === 'fulfilled' && Array.isArray(intHistRes.value.data)) {
          setInterviewHistory(intHistRes.value.data)
        }
        if (intLatestRes.status === 'fulfilled') {
          setLatestInterview(intLatestRes.value.data)
        }
      } catch (err) {
        console.error('Error loading Skill Arena data:', err)
        toast.error('Failed to load some Skill Arena metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchArenaData()
  }, [])

  // 1. Coding stats extraction
  const codingProgress = candidateStats?.summary?.coding_progress || {}
  const problemsSolved = codingProgress.problems_solved || 0
  const codingAccuracy = codingProgress.accuracy || (problemsSolved > 0 ? 85 : 0)
  const codingPoints = codingProgress.points || 0
  const codingRank = codingProgress.rank || '-'
  // Coding benchmark score: normalized out of 100 based on accuracy & solved milestone
  const codingScore = problemsSolved > 0 
    ? Math.min(100, Math.round((Math.min(problemsSolved, 25) / 25) * 40 + (codingAccuracy * 0.6)))
    : 0

  // 2. Aptitude stats extraction
  const aptitudeScore = Math.round(aptitudeStats?.personal_highest_percentage || 0)
  const aptitudeTaken = aptitudeStats?.has_attempts || false
  const aptitudeRank = aptitudeStats?.personal_rank || '-'
  const aptitudePercentile = aptitudeStats?.personal_highest_percentile || 0

  // 3. AI Interview stats extraction
  const completedInterviews = interviewHistory.filter(i => i.status === 'completed')
  const latestCompletedInt = completedInterviews.length > 0 ? completedInterviews[0] : null
  const interviewScore = latestCompletedInt?.final_score 
    ? Math.round(latestCompletedInt.final_score)
    : (latestInterview?.has_interview && latestInterview?.final_score ? Math.round(latestInterview.final_score) : 0)

  // 4. Equal-Weighted Assessment Overview Score (Coding 33.33% + Aptitude 33.33% + Interview 33.34%)
  const hasAnyAssessment = problemsSolved > 0 || aptitudeTaken || completedInterviews.length > 0
  const calculatedOverviewScore = hasAnyAssessment
    ? Math.round(
        (codingScore * 0.3333) +
        (aptitudeScore * 0.3333) +
        (interviewScore * 0.3334)
      )
    : 0

  // 5. Recent unified activity log
  const recentActivities = []

  if (problemsSolved > 0) {
    recentActivities.push({
      type: 'Coding Assessment',
      icon: '💻',
      badgeClass: 'badge-emerald',
      title: `${problemsSolved} Problems Solved (${codingPoints} pts)`,
      score: `${codingScore}%`,
      status: 'In Progress',
      link: '/candidate/skill-arena/coding',
      date: 'Active'
    })
  }

  if (aptitudeTaken) {
    recentActivities.push({
      type: 'Aptitude Test',
      icon: '🧠',
      badgeClass: 'badge-teal',
      title: `General Aptitude & Reasoning Assessment`,
      score: `${aptitudeScore}%`,
      status: aptitudeScore >= 60 ? 'Passed' : 'Completed',
      link: '/candidate/skill-arena/aptitude',
      date: 'Recent'
    })
  }

  interviewHistory.slice(0, 3).forEach((intItem) => {
    recentActivities.push({
      type: 'AI Mock Interview',
      icon: '🎙️',
      badgeClass: 'badge-rose',
      title: `${intItem.role_title} (${intItem.interview_type || 'Technical'})`,
      score: intItem.final_score ? `${Math.round(intItem.final_score)}%` : 'Incomplete',
      status: intItem.status === 'completed' ? 'Completed' : 'In Progress',
      link: '/candidate/skill-arena/interview',
      date: intItem.started_at ? new Date(intItem.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'
    })
  })

  return (
    <div className="page-enter pb-14 space-y-8 w-full max-w-7xl mx-auto">
      
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/candidate" className="hover:text-blue-600 transition-colors">Candidate</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold flex items-center gap-1.5">
          <span>🏆</span> Skill Arena
        </span>
      </nav>

      {/* Hero Welcome Banner */}
      <div className="card bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 border border-blue-100/90 p-6 sm:p-8 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-3 py-0.5 rounded-full border border-blue-200">
                Unified Assessment Hub
              </span>
              <span className="badge badge-emerald font-bold">3 Active Evaluation Modules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              🏆 Skill Arena
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              Test • Practice • Improve • Track
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your centralized candidate assessment arena. Practice programming challenges in sandboxed Monaco environments, test logical and quantitative aptitude, and prepare with rubric-evaluated AI mock interviews.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <Link to="/candidate/skill-arena/coding" className="btn-primary flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 shadow-xs">
              <span>💻</span> Coding Arena
            </Link>
            <Link to="/candidate/skill-arena/aptitude" className="btn-secondary flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4">
              <span>🧠</span> Aptitude Test
            </Link>
            <Link to="/candidate/skill-arena/interview" className="btn-secondary flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4">
              <span>🎙️</span> AI Mock Interview
            </Link>
          </div>
        </div>
      </div>

      {/* Assessment Performance Overview Card */}
      <div className="card bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title !mb-0 font-extrabold text-slate-900 text-lg">
                Assessment Performance Overview
              </h2>
              <span className="badge badge-blue text-[11px] font-bold">Equal-Weighted Overview</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate overview performance across Coding (33.33%), Aptitude (33.33%), and AI Interview (33.34%).
            </p>
          </div>
          <div className="text-right sm:text-right">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
              {calculatedOverviewScore}%
            </div>
            <span className="text-[11px] font-medium text-slate-400">Overall Progress</span>
          </div>
        </div>

        {/* Explainability notice ensuring separation from recruiter hiring ranking */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
          <span className="text-base shrink-0">ℹ️</span>
          <p className="leading-relaxed">
            <strong>Candidate Assessment Overview:</strong> This score is a unified practice metric across all three arena tracks. 
            Recruiters evaluate your profile using their independent 4-pillar weights (ATS, Coding, Skill Match, and Interview) which remain completely untouched.
          </p>
        </div>

        {/* 3 Pillar Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Coding Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>💻</span> Coding Score
              </span>
              <span className="text-emerald-600 font-mono">{codingScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${codingScore}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{problemsSolved} Solved</span>
              <span>{codingAccuracy}% Accuracy</span>
            </div>
          </div>

          {/* Aptitude Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>🧠</span> Aptitude Score
              </span>
              <span className="text-teal-600 font-mono">{aptitudeScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${aptitudeScore}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{aptitudeTaken ? 'Test Completed' : 'Not Attempted'}</span>
              <span>{aptitudePercentile > 0 ? `${aptitudePercentile}th Percentile` : 'Rank #' + aptitudeRank}</span>
            </div>
          </div>

          {/* AI Interview Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>🎙️</span> AI Mock Interview
              </span>
              <span className="text-rose-600 font-mono">{interviewScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${interviewScore}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{completedInterviews.length} Completed</span>
              <span>{interviewHistory.length} Sessions Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Skill Arena Pillars (Interactive Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="section-title !mb-0 text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>⚔️</span> Core Assessment Tracks
          </h2>
          <span className="text-xs text-slate-400 font-medium">Select a track to start practicing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. CODING ASSESSMENT CARD */}
          <div className="card border-2 border-emerald-100 hover:border-emerald-300 bg-gradient-to-b from-white to-emerald-50/20 p-6 rounded-2xl flex flex-col justify-between space-y-5 transition-all shadow-xs hover:shadow-md group">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl border border-emerald-200 shadow-2xs">
                  💻
                </div>
                <span className="badge badge-emerald font-bold text-xs">
                  {problemsSolved > 0 ? 'In Progress' : 'Not Started'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Coding Arena
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Build programming and problem-solving skills across Python, Java, C++, and JavaScript with Docker sandboxed execution.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-emerald-100/80 text-xs">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Solved</span>
                  <span className="text-base font-extrabold text-slate-900">{problemsSolved} / 323</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Accuracy</span>
                  <span className="text-base font-extrabold text-emerald-600">{codingAccuracy}%</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Points</span>
                  <span className="font-bold text-slate-800">{codingPoints} pts</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Rank</span>
                  <span className="font-bold text-slate-800">#{codingRank}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-100">
              <Link
                to="/candidate/skill-arena/coding"
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 shadow-xs"
              >
                <span>💻</span> {problemsSolved > 0 ? 'Continue Coding' : 'Start Coding Challenge'}
              </Link>
            </div>
          </div>

          {/* 2. APTITUDE ASSESSMENT CARD */}
          <div className="card border-2 border-teal-100 hover:border-teal-300 bg-gradient-to-b from-white to-teal-50/20 p-6 rounded-2xl flex flex-col justify-between space-y-5 transition-all shadow-xs hover:shadow-md group">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl border border-teal-200 shadow-2xs">
                  🧠
                </div>
                <span className={`badge ${aptitudeTaken ? 'badge-teal' : 'badge-gray'} font-bold text-xs`}>
                  {aptitudeTaken ? (aptitudeScore >= 60 ? 'Passed' : 'Completed') : 'Available'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Aptitude Assessment
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Test logical reasoning, quantitative analysis, verbal ability, and analytical problem-solving with timed assessment sets.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-teal-100/80 text-xs">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Best Score</span>
                  <span className="text-base font-extrabold text-teal-700">
                    {aptitudeTaken ? `${aptitudeScore}%` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Percentile</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {aptitudePercentile > 0 ? `${aptitudePercentile}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="font-bold text-slate-800">{aptitudeTaken ? 'Attempted' : 'Pending'}</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Cohort Rank</span>
                  <span className="font-bold text-slate-800">#{aptitudeRank}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-teal-100">
              <Link
                to="/candidate/skill-arena/aptitude"
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 !bg-teal-600 hover:!bg-teal-700 !border-teal-600 shadow-xs"
              >
                <span>🧠</span> {aptitudeTaken ? 'Retake / Practice Aptitude' : 'Take Aptitude Test'}
              </Link>
            </div>
          </div>

          {/* 3. AI MOCK INTERVIEW CARD */}
          <div className="card border-2 border-rose-100 hover:border-rose-300 bg-gradient-to-b from-white to-rose-50/20 p-6 rounded-2xl flex flex-col justify-between space-y-5 transition-all shadow-xs hover:shadow-md group">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl border border-rose-200 shadow-2xs">
                  🎙️
                </div>
                <span className={`badge ${completedInterviews.length > 0 ? 'badge-rose' : 'badge-gray'} font-bold text-xs`}>
                  {completedInterviews.length > 0 ? `${completedInterviews.length} Completed` : 'Ready to Start'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-rose-700 transition-colors">
                  AI Mock Interview
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Practice live voice technical and behavioral interviews with real-time speech-to-text, expected answer point scoring, and instant feedback.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-rose-100/80 text-xs">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Latest Score</span>
                  <span className="text-base font-extrabold text-rose-600">
                    {interviewScore > 0 ? `${interviewScore}%` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Completed</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {completedInterviews.length} Rounds
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Speech API</span>
                  <span className="font-bold text-emerald-600">✓ WebSpeech</span>
                </div>
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Rubric Mode</span>
                  <span className="font-bold text-slate-800">70% Cov + 30% Sem</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-rose-100">
              <Link
                to="/candidate/skill-arena/interview"
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 !bg-rose-600 hover:!bg-rose-700 !border-rose-600 shadow-xs"
              >
                <span>🎙️</span> {completedInterviews.length > 0 ? 'Start New AI Interview' : 'Start First AI Mock Interview'}
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Activity & Assessment History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Activity List */}
        <div className="lg:col-span-8 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="section-title !mb-0 font-extrabold text-slate-900 flex items-center gap-2 text-base">
              <span>📋</span> Recent Assessment Activity
            </h3>
            <span className="text-xs text-slate-400">Live database audit</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="empty-state py-8 text-center space-y-3">
              <div className="text-3xl">🎯</div>
              <h4 className="text-sm font-bold text-slate-800">Start Your First Assessment Challenge</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No assessment attempts recorded yet. Solve a coding problem, take an aptitude test, or start an AI mock interview to see your activity timeline here.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/candidate/skill-arena/coding" className="btn-primary btn-sm text-xs">Try Coding Problem</Link>
                <Link to="/candidate/skill-arena/aptitude" className="btn-secondary btn-sm text-xs">Take Aptitude</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.map((act, idx) => (
                <Link
                  key={idx}
                  to={act.link}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{act.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {act.title}
                        </span>
                        <span className={`badge ${act.badgeClass} text-[10px] font-bold`}>{act.type}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Status: {act.status} · {act.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      Score: {act.score}
                    </span>
                    <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-sm">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Candidate Strengths & Skill Gap Summary */}
        <div className="lg:col-span-4 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="section-title !mb-0 font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>💡</span> Capability Strengths
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Programming & Algorithms</span>
                <span className="text-[11px] text-slate-500">Problem Solving & Code Accuracy</span>
              </div>
              <span className={`badge ${codingScore >= 75 ? 'badge-emerald' : codingScore >= 40 ? 'badge-amber' : 'badge-gray'} font-bold`}>
                {codingScore >= 75 ? 'Strong' : codingScore >= 40 ? 'Moderate' : 'Developing'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Logical & Analytical Aptitude</span>
                <span className="text-[11px] text-slate-500">Quantitative & Reasoning Speed</span>
              </div>
              <span className={`badge ${aptitudeScore >= 75 ? 'badge-teal' : aptitudeScore >= 40 ? 'badge-amber' : 'badge-gray'} font-bold`}>
                {aptitudeScore >= 75 ? 'Strong' : aptitudeScore >= 40 ? 'Moderate' : 'Developing'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Technical Communication</span>
                <span className="text-[11px] text-slate-500">Live AI Speech & Rubric Coverage</span>
              </div>
              <span className={`badge ${interviewScore >= 75 ? 'badge-rose' : interviewScore >= 40 ? 'badge-amber' : 'badge-gray'} font-bold`}>
                {interviewScore >= 75 ? 'Strong' : interviewScore >= 40 ? 'Moderate' : 'Developing'}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs">
            <Link to="/candidate/jobs" className="text-blue-600 font-bold hover:underline flex items-center justify-between">
              <span>Explore Matched Openings</span>
              <span>→</span>
            </Link>
            <Link to="/candidate/market-intelligence" className="text-indigo-600 font-bold hover:underline flex items-center justify-between">
              <span>View Tech Market Demand Trends</span>
              <span>→</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  )
}
