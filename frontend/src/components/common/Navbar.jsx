import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isRecruiter = user?.role === 'recruiter'
  const isCandidate = user?.role === 'candidate'
  const isAdmin = user?.role === 'admin'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 shadow-xs">
      <div className="h-full px-6 flex items-center justify-between gap-4">

        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="HireAI Logo"
              className="w-10 h-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[18px] text-slate-900 tracking-tight font-display group-hover:text-[#0A66C2] transition-colors">
                  HireAI
                </span>
                {isRecruiter && (
                  <span className="badge-purple font-extrabold text-[10.5px] px-2 py-0.5 hidden sm:inline-flex">
                    🏢 Recruiter Portal
                  </span>
                )}
                {isCandidate && (
                  <span className="badge-indigo font-extrabold text-[10.5px] px-2 py-0.5 hidden sm:inline-flex">
                    🎯 Candidate Portal
                  </span>
                )}
                {isAdmin && (
                  <span className="badge-amber font-extrabold text-[10.5px] px-2 py-0.5 hidden sm:inline-flex">
                    ⚙️ Admin Console
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                AI-Powered Candidate Evaluation &amp; Hiring Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Search & Quick Status */}
        {user && (
          <div className="hidden lg:flex items-center max-w-md w-full mx-4">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                readOnly
                placeholder={
                  isRecruiter
                    ? "Active Pipeline: AI ranking, coding tests & ATS scoring live..."
                    : "Discover matched jobs, practice coding & evaluate resume..."
                }
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 focus:outline-none cursor-default select-none"
              />
            </div>
          </div>
        )}

        {/* Right side: Quick Action + Profile Avatar + Logout */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {user ? (
            <>
              {/* Contextual Quick Action */}
              {isRecruiter && (
                <Link
                  to="/recruiter/post-job"
                  className="btn-primary btn-sm !py-1.5 !px-3 text-xs font-bold shadow-xs flex items-center gap-1 hidden sm:inline-flex"
                >
                  <span>+</span> Post Job
                </Link>
              )}
              {isCandidate && (
                <Link
                  to="/candidate/jobs"
                  className="btn-primary btn-sm !py-1.5 !px-3 text-xs font-bold shadow-xs flex items-center gap-1 hidden sm:inline-flex"
                >
                  <span>🔍</span> Find Jobs
                </Link>
              )}

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

              {/* Profile Pill */}
              <Link
                to={isCandidate ? '/candidate/profile' : isRecruiter ? '/recruiter' : '/admin'}
                className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100/80 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
                title={`Logged in as ${user.full_name || 'User'} (${user.role})`}
              >
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={user.full_name || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-200 group-hover:scale-105 transition-transform shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {(user.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#0A66C2] transition-colors">
                    {user.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    {user.role}
                  </div>
                </div>
              </Link>

              {/* Explicit Logout Button */}
              <button
                onClick={logout}
                className="btn-ghost btn-sm !py-1.5 !px-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Logout of your account"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

