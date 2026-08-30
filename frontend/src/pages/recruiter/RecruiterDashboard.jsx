import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Navbar } from '../../components/common/Navbar'
import { Sidebar } from '../../components/common/Sidebar'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { useAuth, api } from '../../context/AuthContext'
import { PostJob } from './PostJob'
import { ManageJobs } from './ManageJobs'
import { CandidateSearch } from './CandidateSearch'
import { CandidateRankings } from './CandidateRankings'
import { InterviewScheduler } from './InterviewScheduler'
import { MarketIntelligence } from '../candidate/MarketIntelligence'
import { AptitudeAssessmentBuilder } from './AptitudeAssessmentBuilder'

const pipelineSteps = [
  { label: 'Applied', cls: 'badge-blue' },
  { label: 'Screening', cls: 'badge-indigo' },
  { label: 'Shortlisted', cls: 'badge-purple' },
  { label: 'Interview', cls: 'badge-amber' },
  { label: 'Selected / Hired', cls: 'badge-emerald' },
]

const RecruiterHome = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/recruiter')
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="card bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-emerald-50/40 border border-blue-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
              Recruiter & Talent Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Recruiter'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time talent sourcing, explainable ATS candidate scoring, and coding performance evaluations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/recruiter/post-job" className="btn-primary">
            <span>+</span> Post a New Job
          </Link>
          <button onClick={logout} className="btn-danger">
            Logout
          </button>
        </div>
      </header>

      {/* Candidate Pipeline Strip */}
      <div className="card !py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-2">
            Hiring Workflow:
          </span>
          {pipelineSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              {i > 0 && <span className="text-slate-400 text-xs font-bold">→</span>}
              <span className={`badge ${step.cls} font-semibold`}>{step.label}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Differentiated KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Active Jobs */}
            <Link to="/recruiter/jobs" className="stat-card-blue flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Active Job Openings
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                    💼
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.summary?.active_jobs ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Live vacancies published</div>
              </div>
              <div className="pt-3 mt-3 border-t border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                <span>Manage Jobs</span>
                <span>→</span>
              </div>
            </Link>

            {/* Total Applications */}
            <Link to="/recruiter/candidates" className="stat-card-indigo flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Candidate Pool
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                    👥
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.summary?.total_applications ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Total applications received</div>
              </div>
              <div className="pt-3 mt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
                <span>Search Candidates</span>
                <span>→</span>
              </div>
            </Link>

            {/* Shortlisted / Top Talent */}
            <Link to="/recruiter/rankings" className="stat-card-emerald flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Top Ranked Candidates
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-100">
                    🏆
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {stats?.summary?.shortlisted ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Shortlisted by ATS &amp; Coding</div>
              </div>
              <div className="pt-3 mt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-800">
                <span>View Coding Leaderboard</span>
                <span>→</span>
              </div>
            </Link>

            {/* Interviews Scheduled */}
            <Link to="/recruiter/interviews" className="stat-card-amber flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Interviews Scheduled
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold border border-amber-100">
                    📅
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.summary?.interviews ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Confirmed interview sessions</div>
              </div>
              <div className="pt-3 mt-3 border-t border-amber-100 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-800">
                <span>Manage Schedule</span>
                <span>→</span>
              </div>
            </Link>

          </div>

          {/* Quick Modules */}
          <div>
            <h2 className="section-title mb-4">Recruitment Workspaces</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <Link to="/recruiter/post-job" className="module-blue flex flex-col justify-between min-h-[160px] group cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-3 border border-blue-200">
                    📝
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Post a New Job</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Define requirements, skills, location, and salary ranges with AI auto-tagging.
                  </p>
                </div>
                <span className="text-blue-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Create Posting →
                </span>
              </Link>

              <Link to="/recruiter/candidates" className="module-indigo flex flex-col justify-between min-h-[160px] group cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl mb-3 border border-indigo-200">
                    🔍
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Candidate Search</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Filter by skills, ATS matching scores, coding performance, and experience.
                  </p>
                </div>
                <span className="text-indigo-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Search Pool →
                </span>
              </Link>

              <Link to="/recruiter/rankings" className="module-emerald flex flex-col justify-between min-h-[160px] group cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-3 border border-emerald-200">
                    📊
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Rankings &amp; Solved Stats</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Inspect candidates ranked by total coding problems solved, accuracy, and ATS scores.
                  </p>
                </div>
                <span className="text-emerald-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Leaderboard →
                </span>
              </Link>

              <Link to="/recruiter/interviews" className="module-amber flex flex-col justify-between min-h-[160px] group cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3 border border-amber-200">
                    📅
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Interview Scheduler</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Organize technical and HR interview rounds with email reminders.
                  </p>
                </div>
                <span className="text-amber-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Schedule →
                </span>
              </Link>

              <Link to="/recruiter/market-intelligence" className="module-blue flex flex-col justify-between min-h-[160px] group cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-3 border border-blue-200">
                    📈
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Talent Market Intelligence</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Live hiring demand analytics, tech growth benchmarks, and salary insights.
                  </p>
                </div>
                <span className="text-blue-600 text-xs font-bold mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore Talent Market →
                </span>
              </Link>

            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const RecruiterDashboard = () => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => {
    const handleToggle = () => setCollapsed(localStorage.getItem('sidebar_collapsed') === 'true')
    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Sidebar role="recruiter" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`pt-16 transition-all duration-200 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<RecruiterHome />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/jobs/create" element={<PostJob />} />
              <Route path="/jobs" element={<ManageJobs />} />
              <Route path="/candidates" element={<CandidateSearch />} />
              <Route path="/aptitude" element={<AptitudeAssessmentBuilder />} />
              <Route path="/assessments" element={<AptitudeAssessmentBuilder />} />
              <Route path="/rankings" element={<CandidateRankings />} />
              <Route path="/interviews" element={<InterviewScheduler />} />
              <Route path="/market-intelligence" element={<MarketIntelligence />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
