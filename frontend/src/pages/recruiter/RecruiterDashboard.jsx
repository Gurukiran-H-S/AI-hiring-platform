import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Sidebar } from '../../components/common/Sidebar'
import { useAuth, api } from '../../context/AuthContext'
import { PostJob } from './PostJob'
import { ManageJobs } from './ManageJobs'
import { CandidateSearch } from './CandidateSearch'
import { CandidateRankings } from './CandidateRankings'
import { InterviewScheduler } from './InterviewScheduler'

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
    <div className="space-y-8 w-full max-w-7xl text-white pt-2 pb-12">
      <div className="flex items-center justify-between mb-2 pb-4 border-b border-white/10">
        <div>
          <h1 className="section-title text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            Recruiter & Talent Evaluation Portal
          </h1>
          <p className="section-subtitle text-slate-400 text-sm mt-1">
            Welcome, <strong className="text-white">{user?.full_name || 'Recruiter'}</strong>! Real-time candidate evaluation & application metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/jobs/create"
            className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl"
          >
            + Post a New Job
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
            <div key={i} className="skeleton h-32 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Clickable KPI Cards (Real Database Values Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/recruiter/jobs"
              className="stat-card p-6 glass-card rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-indigo-300 transition-colors">
                Total Active Jobs
              </div>
              <div className="text-3xl font-display font-extrabold flex items-center justify-between">
                <span>{stats?.summary?.active_jobs ?? 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Manage →</span>
              </div>
            </Link>

            <Link
              to="/recruiter/candidates"
              className="stat-card p-6 glass-card rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-indigo-300 transition-colors">
                Total Applications
              </div>
              <div className="text-3xl font-display font-extrabold text-indigo-400 flex items-center justify-between">
                <span>{stats?.summary?.total_applications ?? 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Search →</span>
              </div>
            </Link>

            <Link
              to="/recruiter/rankings"
              className="stat-card p-6 glass-card rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-emerald-300 transition-colors">
                Shortlisted Candidates
              </div>
              <div className="text-3xl font-display font-extrabold text-emerald-400 flex items-center justify-between">
                <span>{stats?.summary?.shortlisted ?? 0}</span>
                <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Rank →</span>
              </div>
            </Link>

            <Link
              to="/recruiter/interviews"
              className="stat-card p-6 glass-card rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-amber-300 transition-colors">
                Interviews Scheduled
              </div>
              <div className="text-3xl font-display font-extrabold text-amber-400 flex items-center justify-between">
                <span>{stats?.summary?.interviews ?? 0}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Schedule →</span>
              </div>
            </Link>
          </div>

          {/* Quick Start Module Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/recruiter/jobs/create"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-indigo-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">➕</span>
                <h3 className="font-bold text-lg mt-2 font-display">Post a New Job</h3>
                <p className="text-slate-400 text-xs mt-1">Define requirements, skills, location, and salary ranges.</p>
              </div>
              <span className="text-xs text-indigo-400 font-bold">Post Job →</span>
            </Link>

            <Link
              to="/recruiter/jobs"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-emerald-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">💼</span>
                <h3 className="font-bold text-lg mt-2 font-display">Manage Jobs</h3>
                <p className="text-slate-400 text-xs mt-1">View active postings, edit status, and track application counts.</p>
              </div>
              <span className="text-xs text-emerald-400 font-bold">Manage Jobs →</span>
            </Link>

            <Link
              to="/recruiter/candidates"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-purple-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">🔎</span>
                <h3 className="font-bold text-lg mt-2 font-display">Search Candidates</h3>
                <p className="text-slate-400 text-xs mt-1">Filter candidates by skill, experience, location, and ATS score.</p>
              </div>
              <span className="text-xs text-purple-400 font-bold">Search Candidates →</span>
            </Link>

            <Link
              to="/recruiter/interviews"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-transparent flex flex-col justify-between space-y-4 hover:border-amber-500/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div>
                <span className="text-3xl">📅</span>
                <h3 className="font-bold text-lg mt-2 font-display">Interview Scheduler</h3>
                <p className="text-slate-400 text-xs mt-1">Schedule technical rounds, reschedule slots, and send notifications.</p>
              </div>
              <span className="text-xs text-amber-400 font-bold">View Scheduler →</span>
            </Link>
          </div>
        </div>
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
    <div className="flex min-h-screen bg-[#0a0b14] text-white">
      <Sidebar role="recruiter" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`flex-1 min-h-screen overflow-y-auto pl-4 pr-6 py-6 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<RecruiterHome />} />
            <Route path="/jobs/create" element={<PostJob />} />
            <Route path="/jobs" element={<ManageJobs />} />
            <Route path="/candidates" element={<CandidateSearch />} />
            <Route path="/rankings" element={<CandidateRankings />} />
            <Route path="/interviews" element={<InterviewScheduler />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
