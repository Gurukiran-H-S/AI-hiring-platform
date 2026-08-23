import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Navbar } from '../../components/common/Navbar'
import { Sidebar } from '../../components/common/Sidebar'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { useAuth, api } from '../../context/AuthContext'
import { DatabaseViewer } from './DatabaseViewer'
import { UserManagement } from './UserManagement'
import { SystemAnalytics } from './SystemAnalytics'
import { MarketIntelligence } from '../candidate/MarketIntelligence'

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
    <div className="space-y-8 w-full max-w-7xl text-ink pt-2 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-line">
        <div>
          <h1 className="page-title text-ink font-display">
            🛡️ï¸ Admin Control & Platform Governance
          </h1>
          <p className="text-ink-3 text-sm mt-1">
            System overview, live PostgreSQL database inspection, user management, and metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/analytics" className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span>📈</span> System Analytics
          </Link>
          <button
            onClick={logout}
            className="btn-danger px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Clickable Admin Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              to="/admin/users"
              className="card card-hover p-6 transition-all cursor-pointer group"
            >
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 group-hover:text-brand transition-colors">Total Users</div>
              <div className="text-3xl font-bold text-ink flex items-center justify-between">
                <span>{data?.stats?.total_users || 0}</span>
                <span className="text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">Manage →</span>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="card card-hover p-6 transition-all cursor-pointer group"
            >
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 group-hover:text-brand transition-colors">Candidates</div>
              <div className="text-3xl font-bold text-brand flex items-center justify-between">
                <span>{data?.stats?.total_candidates || 0}</span>
                <span className="text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="card card-hover p-6 transition-all cursor-pointer group"
            >
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 group-hover:text-ok transition-colors">Recruiters</div>
              <div className="text-3xl font-bold text-ok flex items-center justify-between">
                <span>{data?.stats?.total_recruiters || 0}</span>
                <span className="text-xs text-ok opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </Link>

            <Link
              to="/admin/database"
              className="card card-hover p-6 transition-all cursor-pointer group"
            >
              <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1 group-hover:text-warn transition-colors">Total Resumes</div>
              <div className="text-3xl font-bold text-warn flex items-center justify-between">
                <span>{data?.stats?.total_resumes || 0}</span>
                <span className="text-xs text-warn opacity-0 group-hover:opacity-100 transition-opacity">Explore DB →</span>
              </div>
            </Link>
          </div>

          {/* Clickable Quick Admin Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/admin/analytics"
              className="card card-hover p-6 hover:border-brand/50 space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-ink font-display flex items-center justify-between">
                <span>📈 System Analytics</span>
                <span className="text-xs text-brand font-bold">View Analytics →</span>
              </h3>
              <p className="text-xs text-ink-3">
                Visual charts for user growth, recruitment funnels, ATS score distributions, skill gaps, and hiring conversion.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="card card-hover p-6 hover:border-brand/50 space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-ink font-display flex items-center justify-between">
                <span>👥 User Management</span>
                <span className="text-xs text-brand font-bold">Manage Users →</span>
              </h3>
              <p className="text-xs text-ink-3">
                View candidate, recruiter, and admin accounts, filter status, and toggle account activation.
              </p>
            </Link>

            <Link
              to="/admin/database"
              className="card card-hover p-6 hover:border-brand/50 space-y-4 transition-all cursor-pointer"
            >
              <h3 className="font-bold text-lg text-ink font-display flex items-center justify-between">
                <span>🗄️ï¸ Database Explorer</span>
                <span className="text-xs text-brand font-bold">Explore DB →</span>
              </h3>
              <p className="text-xs text-ink-3">
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
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Sidebar role="admin" collapsed={collapsed} onToggle={() => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('sidebar_collapsed', String(next))
      }} />
      <main className={`pt-16 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/database" element={<DatabaseViewer />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/analytics" element={<SystemAnalytics />} />
            <Route path="/market-intelligence" element={<MarketIntelligence />} />
          </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
