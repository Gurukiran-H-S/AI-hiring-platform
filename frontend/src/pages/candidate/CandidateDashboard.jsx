import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Sidebar } from '../../components/common/Sidebar'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { Navbar } from '../../components/common/Navbar'
import { useAuth, api } from '../../context/AuthContext'
import { ResumeAnalyzer } from './ResumeAnalyzer'
import { CodingPlayground } from './CodingPlayground'
import { AptitudeTest } from './AptitudeTest'
import { MockInterview } from './MockInterview'
import { JobSearch } from './JobSearch'
import { ApplicationTracker } from './ApplicationTracker'
import { CandidateProfile } from './CandidateProfile'
import { MarketIntelligence } from './MarketIntelligence'
import { SkillArena } from './SkillArena'

const DashboardHome = ({ stats, loading }) => {
  const [trends, setTrends] = useState(null)
  const [jobAssessments, setJobAssessments] = useState([])
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data } = await api.get('/trends')
        setTrends(data)
      } catch (err) {
        console.error('Could not load trends data:', err)
        setTrends({ high_demand_skills: [], emerging_roles: [] })
      }
    }

    const fetchAssessments = async () => {
      try {
        const { data } = await api.get('/candidate/aptitude-assessments')
        setJobAssessments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Could not load candidate assessments:', err)
      } finally {
        setLoadingAssessments(false)
      }
    }

    fetchTrends()
    fetchAssessments()
  }, [])

  const pendingAssessments = jobAssessments.filter(a => !a.is_completed)
  const completedAssessments = jobAssessments.filter(a => a.is_completed)

  const s = stats?.summary || {}
  const atsScore = Math.round(s.average_ats_score || 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const getSkillCategoryClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'programming': return 'badge-blue'
      case 'cloud': return 'badge-amber'
      case 'devops': return 'badge-teal'
      case 'full stack': return 'badge-emerald'
      default: return 'badge-purple'
    }
  }

  return (
    <div className="page-enter pb-12 space-y-8">

      {/* Hero Welcome Banner with Differentiated Header */}
      <div className="card bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-purple-50/50 border border-blue-100/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                Candidate Dashboard
              </span>
              <span className="text-xs text-slate-500 font-medium">· {todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {user?.full_name?.split(' ')[0] || 'Candidate'} 👋
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Track your ATS resume health, practice coding assessments, and manage your job application pipeline in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/candidate/jobs" className="btn-primary">
              <span>🔍</span> Find Jobs
            </Link>
            <Link to="/candidate/profile" className="btn-secondary">
              <span>👤</span> View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MANDATORY RECRUITER JOB ASSESSMENTS PANEL (Visible until submitted) ─── */}
      {pendingAssessments.length > 0 && (
        <div className="card bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-400 p-6 rounded-2xl space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs animate-pulse">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-amber-950">
                    Mandatory Job Assessments Pending ({pendingAssessments.length})
                  </h2>
                  <span className="badge badge-amber text-[10px] font-extrabold px-2 py-0.5">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Recruiters require you to complete these examinations to qualify for technical shortlisting and interview rounds.
                </p>
              </div>
            </div>
            <Link
              to="/candidate/skill-arena/aptitude"
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline self-start sm:self-auto"
            >
              View Assessment Arena →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingAssessments.map((ass) => (
              <div
                key={ass.id}
                className="bg-white border border-amber-200/90 rounded-xl p-4.5 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-400 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        {ass.company}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1.5">
                        {ass.job_title} • {ass.title}
                      </h3>
                    </div>
                    {ass.has_active_attempt ? (
                      <span className="badge-rose text-[10px] font-extrabold shrink-0 animate-pulse">
                        ⚡ Exam In Progress
                      </span>
                    ) : (
                      <span className="badge-amber text-[10px] font-extrabold shrink-0">
                        ⏳ Pending Exam
                      </span>
                    )}
                  </div>

                  {ass.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {ass.description}
                    </p>
                  )}

                  {/* Assessment Meta Badges */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">⏱ {ass.duration_minutes} Mins</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">❓ {ass.total_questions} Questions</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">🎯 Passing: {ass.passing_score}%</span>
                    {ass.negative_marking && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">⚠️ Negative Marking</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/candidate/skill-arena/aptitude"
                    className="btn-primary w-full text-xs font-bold flex items-center justify-center gap-1.5 py-2 shadow-sm"
                  >
                    <span>🚀</span> {ass.has_active_attempt ? 'Resume Active Exam' : 'Enter Waiting Room & Launch Exam'} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low ATS Score Warning Alert Banner (Below 60%) */}
      {atsScore > 0 && atsScore < 60 && (
        <div className="card bg-rose-50 border border-rose-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-rose font-extrabold text-xs">ATS Score Critical ({atsScore}%)</span>
                <span className="text-xs text-rose-800 font-semibold">Below 60% Shortlisting Threshold</span>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                Your primary resume score is low. Enterprise recruiters typically require at least <strong>60%</strong> to proceed with interview shortlisting.
              </p>
            </div>
          </div>
          <Link
            to="/candidate/resumes"
            className="btn-danger btn-sm shrink-0 px-4 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>⚡</span> Optimize Resume Keywords →
          </Link>
        </div>
      )}


      {/* 4 Differentiated High-Contrast KPI Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Key Performance Metrics</h2>
          <span className="text-xs text-slate-400">Live synchronized with database</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-36 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. ATS Score Card (Royal Blue) */}
            <Link to="/candidate/resumes" className="stat-card-blue flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    ATS Resume Score
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                    📄
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {atsScore > 0 ? `${atsScore}%` : '--'}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  {atsScore >= 80 ? (
                    <span className="badge-emerald font-semibold">Strong Match</span>
                  ) : atsScore >= 60 ? (
                    <span className="badge-amber font-semibold">Fair Match</span>
                  ) : atsScore > 0 ? (
                    <span className="badge-rose font-semibold">Needs Polish</span>
                  ) : (
                    <span className="badge-gray">No resume uploaded</span>
                  )}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-blue-100/60 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                <span>Analyze Resume</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* 2. Job Matches Card (Deep Indigo) */}
            <Link to="/candidate/jobs" className="stat-card-indigo flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Job Matches
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                    💼
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {s.job_matches ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  {(s.job_matches > 0) ? (
                    <span className="badge-indigo font-semibold">Matched to your skills</span>
                  ) : (
                    <span className="badge-gray font-semibold">No direct matches</span>
                  )}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-indigo-100/60 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
                <span>Explore Opportunities</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* 3. Applications Pipeline Card (Warm Amber) */}
            <Link to="/candidate/applications" className="stat-card-amber flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Active Applications
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold border border-amber-100">
                    📊
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {s.total_applications ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="badge-amber font-semibold">{s.interviews ?? 0} Interviews</span>
                  <span className="badge-emerald font-semibold">{s.shortlisted ?? 0} Shortlisted</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-amber-100/60 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-800">
                <span>View Pipeline</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* 4. Problems Solved & Coding Progress Card (Emerald Green) */}
            <Link to="/candidate/coding" className="stat-card-emerald flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Problems Solved
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-100">
                    💻
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {s.coding_progress?.problems_solved ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="badge-emerald font-bold">
                    Rank #{s.coding_progress?.rank ?? '-'}
                  </span>
                  <span className="text-slate-500">
                    {s.coding_progress?.points ?? 0} pts Â· {s.coding_progress?.accuracy ?? 0}% Acc
                  </span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-800">
                <span>Practice Arena (323 Problems)</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

          </div>
        )}
      </div>

      {/* 4 Differentiated Quick Action Modules */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="section-title">Career Acceleration Tools</h2>
          <span className="text-xs text-slate-400">Launch integrated modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Module 1: Resume Analyzer */}
          <Link to="/candidate/resumes" className="module-blue flex flex-col justify-between min-h-[170px] group cursor-pointer">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-3 border border-blue-200">
                📄
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Resume Analyzer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                spaCy NLP skill extraction, ATS score breakdowns, and keyword optimization insights.
              </p>
            </div>
            <div className="text-blue-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Launch Analyzer <span>→</span>
            </div>
          </Link>

          {/* Module 2: Coding Assessment */}
          <Link to="/candidate/skill-arena/coding" className="module-emerald flex flex-col justify-between min-h-[170px] group cursor-pointer">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-3 border border-emerald-200">
                💻
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Coding Assessment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-language Docker execution, 323 curated LeetCode problems, and real-time rank.
              </p>
            </div>
            <div className="text-emerald-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Launch Coding Arena <span>→</span>
            </div>
          </Link>

          {/* Module 3: Aptitude Assessment */}
          <Link to="/candidate/skill-arena/aptitude" className="module-purple flex flex-col justify-between min-h-[170px] group cursor-pointer">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-3 border border-purple-200">
                🧠
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Aptitude Assessment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practice numerical, verbal, reasoning, and technical timed online assessment test sets with rank analytics.
              </p>
            </div>
            <div className="text-purple-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Assessment <span>→</span>
            </div>
          </Link>

          {/* Module 4: Mock Interview */}
          <Link to="/candidate/skill-arena/interview" className="module-rose flex flex-col justify-between min-h-[170px] group cursor-pointer">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mb-3 border border-rose-200">
                🎙️
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Mock Interview</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practice realistic technical and behavioral interview sessions with live AI feedback.
              </p>
            </div>
            <div className="text-rose-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Start AI Interview <span>→</span>
            </div>
          </Link>


        </div>
      </div>

      {/* Career Market Intelligence Section with Color-Coded Skills */}
      {trends && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-blue font-extrabold text-xs">Career Market Intelligence</span>
                <span className="badge-emerald font-bold text-xs">Live 24h Sync</span>
              </div>
              <h2 className="section-title !mb-0 mt-1">📈 High-Demand Skills &amp; Technology Trends</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time market analytics and recruiter demand scores to steer your preparation</p>
            </div>
            <Link
              to="/candidate/market-intelligence"
              className="btn-primary btn-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto text-xs"
            >
              <span>🌐</span> Full Market Intelligence →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Top In-Demand Skills */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span>🔥</span> Top In-Demand Skills</span>
                <Link to="/candidate/market-intelligence" className="text-[11px] text-blue-600 hover:underline font-bold">View all →</Link>
              </h3>
              <div className="space-y-2.5">
                {trends.high_demand_skills.map((item) => (
                  <div key={item.skill} className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.skill}</span>
                      <span className={getSkillCategoryClass(item.category)}>{item.category}</span>
                      {item.source === 'trained_model' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded" title="Forecast from HireAI's trained Holt-Winters demand model">AI</span>
                      )}
                    </div>
                    <span className={`font-bold font-mono ${item.source === 'trained_model' ? 'text-blue-600' : 'text-emerald-600'}`}>{item.growth_rate}</span>
                  </div>
                ))}
              </div>

              {/* Real forecast projections from the trained model */}
              {trends.skill_forecasts?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-200/80">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <span>🔮</span> 3-Month Demand Forecast
                    <span className="font-normal normal-case text-slate-400">(mentions per 1,000 postings Â· Holt-Winters)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {trends.skill_forecasts.slice(0, 6).map((f) => (
                      <div key={f.skill} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-800 truncate">{f.skill}</span>
                          <span className={`text-[11px] font-bold font-mono ${
                            f.trend === 'Emerging' ? 'text-emerald-600' : f.trend === 'Declining' ? 'text-red-600' : 'text-slate-500'
                          }`}>{f.growth}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{f.current} → {f.projected}</span>
                          <span className={f.confidence === 'Medium' ? 'text-emerald-600 font-semibold' : ''}>{f.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Emerging Roles */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span>🚀</span> Emerging Industry Roles</span>
                <Link to="/candidate/market-intelligence" className="text-[11px] text-indigo-600 hover:underline font-bold">View salaries →</Link>
              </h3>
              <div className="space-y-2.5">
                {trends.emerging_roles.map((role) => (
                  <div key={role.role} className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm space-y-1.5 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">{role.role}</span>
                      <span className="badge-indigo font-bold">{role.growth_rate}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-1.5">
                      <span className="text-slate-400">Key:</span>
                      {role.key_skills.map((sk) => (
                        <span key={sk} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export const CandidateDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/analytics/candidate')
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => {
    const handleToggle = () => setCollapsed(localStorage.getItem('sidebar_collapsed') === 'true')
    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Sidebar role="candidate" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`pt-16 transition-all duration-200 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} loading={loading} />} />
            <Route path="/resumes" element={<ResumeAnalyzer onPrimaryChange={fetchAnalytics} />} />
            
            {/* 🏆 Unified Skill Arena Routes */}
            <Route path="/skill-arena" element={<SkillArena />} />
            <Route path="/skill-arena/coding" element={<CodingPlayground />} />
            <Route path="/skill-arena/aptitude" element={<AptitudeTest />} />
            <Route path="/skill-arena/interview" element={<MockInterview />} />

            {/* Direct / Backward-compatible Legacy Routes */}
            <Route path="/coding" element={<CodingPlayground />} />
            <Route path="/aptitude" element={<AptitudeTest />} />
            <Route path="/interview" element={<MockInterview />} />

            <Route path="/jobs" element={<JobSearch />} />
            <Route path="/applications" element={<ApplicationTracker />} />
            <Route path="/profile" element={<CandidateProfile />} />
            <Route path="/market-intelligence" element={<MarketIntelligence />} />
          </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

