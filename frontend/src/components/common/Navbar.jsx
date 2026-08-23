import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-line">
      <div className="h-full px-6 flex items-center justify-between gap-6">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm tracking-tight">
            Hi
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="font-bold text-[17px] text-ink tracking-tight">HireAI</span>
            <div className="text-[10px] text-ink-3 hidden md:block">AI-Powered Hiring Platform</div>
          </div>
        </Link>

        {/* Search */}
        {user && (
          <div className="hidden lg:block relative w-full max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search jobs, skills or companies..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-line text-[13px] text-ink placeholder-ink-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
            />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {user ? (
            <>
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-page text-ink-2 transition-colors" title="Notifications">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-err rounded-full"></span>
              </button>

              {/* Messages */}
              <button className="relative p-2 rounded-lg hover:bg-page text-ink-2 transition-colors hidden sm:block" title="Messages">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="w-px h-7 bg-line mx-1 hidden sm:block"></div>

              {/* Profile - Clickable to open Profile */}
              <Link
                to={user.role === 'candidate' ? '/candidate/profile' : user.role === 'recruiter' ? '/recruiter' : '/admin'}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 rounded-lg px-2 py-1.5 transition-colors group"
                title="View My Profile"
              >
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={user.full_name || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-blue-200 group-hover:scale-105 transition-transform shadow-sm"
                  />
                ) : (
                  <div className="avatar w-8 h-8 text-xs bg-blue-600 group-hover:scale-105 transition-transform shadow-sm">
                    {(user.full_name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block leading-tight text-left">
                  <div className="text-[12.5px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {user.full_name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="text-[10.5px] text-slate-400 capitalize">{user.role}</div>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-lg text-ink-2 hover:text-err hover:bg-err-bg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
