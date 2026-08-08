import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Sidebar } from '../../components/common/Sidebar'
import { useAuth, api } from '../../context/AuthContext'
import { DatabaseViewer } from './DatabaseViewer'
import { UserManagement } from './UserManagement'
import { SystemAnalytics } from './SystemAnalytics'

const AdminHome = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        setData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAdminData()
  }, [])

  return (
    <div className="space-y-8 w-full max-w-7xl text-white pt-2 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            🛡️ Admin Control & Platform Governance
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System overview, live PostgreSQL database inspection, user management, and metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/analytics" className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span>📈</span> System Analytics
          </Link>
          <button
            onClick={logout}
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Clickable Admin Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/admin/users"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-indigo-300 transition-colors">Total Users</div>
              <div className="text-3xl font-display font-extrabold text-white flex items-center justify-between">
                <span>{data?.stats?.total_users || 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Manage →</span>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-indigo-300 transition-colors">Candidates</div>
              <div className="text-3xl font-display font-extrabold text-indigo-400 flex items-center justify-between">
                <span>{data?.stats?.total_candidates || 0}</span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-emerald-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-emerald-300 transition-colors">Recruiters</div>
              <div className="text-3xl font-display font-extrabold text-emerald-400 flex items-center justify-between">
                <span>{data?.stats?.total_recruiters || 0}</span>
                <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </Link>

            <Link
              to="/admin/database"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-amber-500/50 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 text-xs uppercase font-semibold mb-1 group-hover:text-amber-300 transition-colors">Total Resumes</div>
              <div className="text-3xl font-display font-extrabold text-amber-400 flex items-center justify-between">
                <span>{data?.stats?.total_resumes || 0}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Explore DB →</span>
              </div>
            </Link>
          </div>

          {/* Clickable Quick Admin Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/admin/analytics"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:scale-[1.01] space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-white font-display flex items-center justify-between">
                <span>📈 System Analytics</span>
                <span className="text-xs text-indigo-400 font-bold">View Analytics →</span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual charts for user growth, recruitment funnels, ATS score distributions, skill gaps, and hiring conversion.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:scale-[1.01] space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-white font-display flex items-center justify-between">
                <span>👥 User Management</span>
                <span className="text-xs text-indigo-400 font-bold">Manage Users →</span>
              </h3>
              <p className="text-xs text-slate-400">
                View candidate, recruiter, and admin accounts, filter status, and toggle account activation.
              </p>
            </Link>

            <Link
              to="/admin/database"
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 hover:border-indigo-500/50 hover:scale-[1.01] space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-white font-display flex items-center justify-between">
                <span>🗄️ Database Explorer</span>
                <span className="text-xs text-indigo-400 font-bold">Explore DB →</span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect live PostgreSQL table schemas, column types, primary keys, and real records for faculty presentation.
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')

  useEffect(() => {
    const handleToggle = () => setCollapsed(localStorage.getItem('sidebar_collapsed') === 'true')
    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [])

  return (
    <div className="flex min-h-screen bg-[#0a0b14] text-white">
      <Sidebar role="admin" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`flex-1 min-h-screen overflow-y-auto pl-4 pr-6 py-6 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/database" element={<DatabaseViewer />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/analytics" element={<SystemAnalytics />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
