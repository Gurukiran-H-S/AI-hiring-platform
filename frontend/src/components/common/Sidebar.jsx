import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const Sidebar = ({ role, collapsed: externalCollapsed, onToggle: externalOnToggle }) => {
  const { user, logout } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed

  const toggleSidebar = () => {
    const nextState = !isCollapsed
    if (externalOnToggle) {
      externalOnToggle()
    } else {
      setInternalCollapsed(nextState)
      localStorage.setItem('sidebar_collapsed', String(nextState))
      window.dispatchEvent(new Event('sidebar-toggle'))
    }
  }

  const candidateLinks = [
    { to: '/candidate', label: 'Dashboard', icon: '📊' },
    { to: '/candidate/resumes', label: 'Resume Analyzer', icon: '📄' },
    { to: '/candidate/coding', label: 'Coding Assessment', icon: '💻' },
    { to: '/candidate/aptitude', label: 'Aptitude Tests', icon: '🧠' },
    { to: '/candidate/interview', label: 'AI Mock Interview', icon: '🎙️' },
    { to: '/candidate/jobs', label: 'Job Search', icon: '🔍' },
    { to: '/candidate/applications', label: 'My Applications', icon: '💼' },
  ]

  const recruiterLinks = [
    { to: '/recruiter', label: 'Dashboard', icon: '📊' },
    { to: '/recruiter/jobs/create', label: 'Post a New Job', icon: '➕' },
    { to: '/recruiter/jobs', label: 'Manage Jobs', icon: '💼' },
    { to: '/recruiter/candidates', label: 'Search Candidates', icon: '🔎' },
    { to: '/recruiter/rankings', label: 'Candidate Rankings', icon: '🏆' },
    { to: '/recruiter/interviews', label: 'Interview Scheduler', icon: '📅' },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: '🛡️' },
    { to: '/admin/database', label: 'Database Explorer', icon: '🗄️' },
    { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/analytics', label: 'System Analytics', icon: '📈' },
  ]

  const links = role === 'admin' ? adminLinks : role === 'recruiter' ? recruiterLinks : candidateLinks

  return (
    <aside
      className={`sidebar flex flex-col justify-between h-screen fixed left-0 top-0 bg-[#0d0e19] border-r border-white/10 p-3 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Header & 3-Dots Collapse Toggle */}
        <div className="p-2 border-b border-white/10 flex items-center justify-between gap-2 mb-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                {role ? role[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="font-display font-bold text-xs text-white capitalize truncate">{role} Portal</div>
                <div className="text-[11px] text-slate-400 truncate max-w-[110px]">{user?.full_name || user?.email}</div>
              </div>
            </div>
          )}

          {/* 3-Dots Menu Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all mx-auto"
          >
            <span className="text-sm font-bold tracking-widest">⋮⋮⋮</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/candidate' || link.to === '/recruiter' || link.to === '/admin'}
              title={isCollapsed ? link.label : ''}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-white font-semibold shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-lg shrink-0">{link.icon}</span>
              {!isCollapsed && <span className="text-xs truncate">{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <button
          onClick={logout}
          title={isCollapsed ? 'Logout Account' : ''}
          className={`w-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            isCollapsed ? 'px-0' : 'px-3'
          }`}
        >
          <span className="text-base shrink-0">🚪</span>
          {!isCollapsed && <span className="truncate">Logout Account</span>}
        </button>

        {!isCollapsed && (
          <div className="text-[10px] text-slate-500 text-center font-mono">
            HireAI Platform v1.0.0
          </div>
        )}
      </div>
    </aside>
  )
}
