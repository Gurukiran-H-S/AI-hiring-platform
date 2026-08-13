import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Sidebar } from '../../components/common/Sidebar'
import { useAuth, api } from '../../context/AuthContext'
import { ResumeAnalyzer } from './ResumeAnalyzer'
import { CodingPlayground } from './CodingPlayground'
import { AptitudeTest } from './AptitudeTest'
import { MockInterview } from './MockInterview'
import { JobSearch } from './JobSearch'
import { ApplicationTracker } from './ApplicationTracker'


const DashboardHome = ({ stats, loading }) => {
  const [trends, setTrends] = useState(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data } = await api.get('/trends/')
        setTrends(data)
      } catch (err) {
        setTrends({
          high_demand_skills: [
            { skill: 'Python', growth_rate: '+34%', demand_score: 96, category: 'Programming' },
            { skill: 'AWS', growth_rate: '+28%', demand_score: 92, category: 'Cloud' },
            { skill: 'Docker', growth_rate: '+25%', demand_score: 88, category: 'DevOps' },
            { skill: 'FastAPI / Node.js', growth_rate: '+31%', demand_score: 90, category: 'Backend' },
          ],
          emerging_roles: [
            { role: 'AI / LLM Engineer', growth_rate: '+65%', key_skills: ['PyTorch', 'LangChain', 'Transformers'] },
            { role: 'Cloud Native Architect', growth_rate: '+42%', key_skills: ['Kubernetes', 'Terraform', 'AWS'] },
          ]
        })
      }
    }
    fetchTrends()
  }, [])

  return (
    <div className="space-y-8 w-full max-w-7xl text-white pt-2 pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-300 to-emerald-300 bg-clip-text text-transparent mb-1 font-display">
            AI Unified Candidate Portal
          </h1>
          <p className="text-slate-400 text-sm">
            Welcome, <strong className="text-white">{user?.full_name || 'Candidate'}</strong>! Track your resumes, coding scores & job applications.
            {user?.phone && <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">📞 {user.phone}</span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/candidate/jobs"
            className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            <span>🔎</span> Search Jobs
          </Link>
          <button
            onClick={logout}
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-32 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Clickable Summary KPI Cards (Strict Real Database Values Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/candidate/applications"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 font-display group-hover:text-indigo-300 transition-colors">
                Total Applications
              </div>
              <div className="text-3xl font-display font-extrabold text-white flex items-center justify-between">
                <span>{stats?.summary?.total_applications ?? 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </Link>

            <Link
              to="/candidate/resumes"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 font-display group-hover:text-indigo-300 transition-colors">
                Uploaded Resumes
              </div>
              <div className="text-3xl font-display font-extrabold text-white flex items-center justify-between">
                <span>{stats?.summary?.total_resumes ?? 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Analyze →</span>
              </div>
            </Link>

            <Link
              to="/candidate/resumes"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-emerald-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 font-display group-hover:text-emerald-300 transition-colors">
                Avg ATS Score
              </div>
              <div className="text-3xl font-display font-extrabold text-emerald-400 flex items-center justify-between">
                <span>{stats?.summary?.average_ats_score ? `${stats.summary.average_ats_score}%` : '--'}</span>
                <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Check →</span>
              </div>
            </Link>

            <Link
              to="/candidate/interview"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 font-display group-hover:text-purple-300 transition-colors">
                Interviews / Shortlisted
              </div>
              <div className="text-3xl font-display font-extrabold text-indigo-400 flex items-center justify-between">
                <span>{stats?.summary?.interviews ?? 0} / {stats?.summary?.shortlisted ?? 0}</span>
                <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Practice →</span>
              </div>
            </Link>
          </div>

          {/* Quick Start Module Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/candidate/resumes"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-indigo-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">📄</span>
                <h3 className="font-bold text-lg mt-2 font-display">Resume Analyzer</h3>
                <p className="text-slate-400 text-xs mt-1">spaCy NLP skill extraction, explainable ATS scoring, and deletion controls.</p>
              </div>
              <span className="text-xs text-indigo-400 font-bold">Launch Analyzer →</span>
            </Link>

            <Link
              to="/candidate/coding"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-emerald-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">💻</span>
                <h3 className="font-bold text-lg mt-2 font-display">Coding Assessment</h3>
                <p className="text-slate-400 text-xs mt-1">Multi-language Docker execution, hidden testcases, and global leaderboards.</p>
              </div>
              <span className="text-xs text-emerald-400 font-bold">Start Practice →</span>
            </Link>

            <Link
              to="/candidate/jobs"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-purple-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">🔎</span>
                <h3 className="font-bold text-lg mt-2 font-display">Job Search Engine</h3>
                <p className="text-slate-400 text-xs mt-1">Modular live/demo provider job listings with job-specific ATS relevance.</p>
              </div>
              <span className="text-xs text-purple-400 font-bold">Explore Jobs →</span>
            </Link>

            <Link
              to="/candidate/applications"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-amber-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">💼</span>
                <h3 className="font-bold text-lg mt-2 font-display">Application Tracker</h3>
                <p className="text-slate-400 text-xs mt-1">Track external applications, update 11 status stages, and view timeline history.</p>
              </div>
              <span className="text-xs text-amber-400 font-bold">View Tracker →</span>
            </Link>
          </div>

          {/* Market Demand & Future Trends Section */}
          {trends && (
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold font-display text-white">
                  📈 High-Demand Skill Forecasts & Job Market Trends
                </h2>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  Recommended Learning Video: <a href="https://www.youtube.com/results?search_query=full+stack+web+development+course" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Full Stack Web Development (Example Link)</a>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Top High-Demand Skills</h3>
                  <div className="space-y-2">
                    {trends.high_demand_skills.map((item) => (
                      <div key={item.skill} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 text-xs">
                        <span className="font-bold text-slate-200">{item.skill} ({item.category})</span>
                        <span className="font-mono text-emerald-400 font-bold">{item.growth_rate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Emerging Roles</h3>
                  <div className="space-y-2">
                    {trends.emerging_roles.map((role) => (
                      <div key={role.role} className="bg-black/40 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300">{role.role}</span>
                          <span className="font-mono text-indigo-400 font-bold">{role.growth_rate}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Key Skills: {role.key_skills.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const CandidateDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => {
    const handleToggle = () => setCollapsed(localStorage.getItem('sidebar_collapsed') === 'true')
    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [])

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

  return (
    <div className="flex min-h-screen bg-[#0a0b14] text-white">
      <Sidebar role="candidate" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`flex-1 min-h-screen overflow-y-auto pl-4 pr-6 py-6 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} loading={loading} />} />
            <Route path="/resumes" element={<ResumeAnalyzer onPrimaryChange={fetchAnalytics} />} />
            <Route path="/coding" element={<CodingPlayground />} />
            <Route path="/aptitude" element={<AptitudeTest />} />
            <Route path="/interview" element={<MockInterview />} />
            <Route path="/jobs" element={<JobSearch />} />
            <Route path="/applications" element={<ApplicationTracker />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
