import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const candidateNavLinks = [
    { to: '/candidate', label: 'Dashboard' },
    { to: '/candidate/resumes', label: 'Resume' },
    { to: '/candidate/jobs', label: 'Jobs' },
    { to: '/candidate/coding', label: 'Coding Assessment' },
    { to: '/candidate/aptitude', label: 'Skill Gap' },
    { to: '/candidate/interview', label: 'Interview' },
    { to: '/candidate/applications', label: 'Applications' },
  ]

  const recruiterNavLinks = [
    { to: '/recruiter', label: 'Dashboard' },
    { to: '/recruiter/post-job', label: 'Post Job' },
    { to: '/recruiter/jobs', label: 'Manage Jobs' },
    { to: '/recruiter/candidates', label: 'Candidates' },
    { to: '/recruiter/rankings', label: 'Rankings' },
  ]

  const navLinks = user?.role === 'recruiter' ? recruiterNavLinks : candidateNavLinks

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b14]/90 backdrop-blur-md border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/30">
          AI
        </div>
        <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent hidden sm:inline">
          HireAI Unified
        </span>
      </Link>

      {/* Center Navigation Links (when authenticated) */}
      {user && (
        <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl text-xs">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/candidate' || link.to === '/recruiter'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  isActive ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Right User Controls & Logout Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-white">Welcome, {user.full_name?.split(' ')[0]}</div>
              <div className="text-[10px] text-indigo-400 capitalize font-mono">{user.role}</div>
            </div>

            {/* Clearly Visible Top-Right Logout Button */}
            <button
              onClick={logout}
              className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Secure Logout"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs">
            <Link to="/login" className="btn-secondary px-3.5 py-2">
              Login
            </Link>
            <Link to="/register" className="btn-primary px-3.5 py-2">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
