import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* Consistent line icons (Lucide-style inline SVGs) */
const Icon = ({ d, extra }) => (
  <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} strokeLinecap="round" strokeLinejoin="round" />) : <path d={d} strokeLinecap="round" strokeLinejoin="round" />}
    {extra}
  </svg>
)

const icons = {
  dashboard: <Icon d={["M3 3h7v9H3z", "M14 3h7v5h-7z", "M14 12h7v9h-7z", "M3 16h7v5H3z"]} />,
  jobs: <Icon d={["M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z", "M22 10v6", "M6 12.5V16a6 3 0 0 0 12 0v-3.5"]} />,
  applications: <Icon d={["M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z", "M15 5l3 3"]} />,
  resume: <Icon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} />,
  skill: <Icon d={["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "m9 12 2 2 4-4"]} />,
  coding: <Icon d={["m16 18 6-6-6-6", "m8 6-6 6 6 6"]} />,
  assessment: <Icon d={["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} />,
  interview: <Icon d={["M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z", "M19 10v2a7 7 0 0 1-14 0v-2", "M12 19v3"]} />,
  profile: <Icon d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
  plus: <Icon d={["M12 5v14", "M5 12h14"]} />,
  briefcase: <Icon d={["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "rect width='20' height='14' x='2' y='6' rx='2'"]} />,
  search: <Icon d={["m21 21-4.34-4.34", "circle cx='11' cy='11' r='8'"]} extra={<circle cx="11" cy="11" r="8" />} />,
  trophy: <Icon d={["M6 9H4.5a2.5 2.5 0 0 1 0-5H6", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", "M18 2H6v7a6 6 0 0 0 12 0z"]} />,
  calendar: <Icon d={["M8 2v4", "M16 2v4", "rect width='18' height='18' x='3' y='4' rx='2'", "M3 10h18"]} />,
  shield: <Icon d={["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"]} />,
  database: <Icon d={["ellipse cx='12' cy='5' rx='9' ry='3'", "M3 5V19A9 3 0 0 0 21 19V5", "M3 12A9 3 0 0 0 21 12"]} />,
  users: <Icon d={["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "circle cx='9' cy='7' r='4'", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} />,
  chart: <Icon d={["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"]} />,
  market: <Icon d={["M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 17.93V18a2 2 0 0 0-2-2h-1v-2a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1V9.5a1.5 1.5 0 0 0-1.5-1.5H13V6a2 2 0 0 0-2-2H9.5a1.5 1.5 0 0 0-1.5 1.5V7a1 1 0 0 1-1 1H5.1A8 8 0 0 1 13 3.93z"]} />,
}

export const Sidebar = ({ role }) => {
  const { logout } = useAuth()

  const candidateLinks = [
    { to: '/candidate', label: 'Dashboard', icon: icons.dashboard, color: 'text-blue-600', activeBg: 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600', end: true },
    { to: '/candidate/jobs', label: 'Find Jobs', icon: icons.jobs, color: 'text-indigo-600', activeBg: 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' },
    { to: '/candidate/applications', label: 'Applications', icon: icons.applications, color: 'text-amber-600', activeBg: 'bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-600' },
    { to: '/candidate/resumes', label: 'Resume Analysis', icon: icons.resume, color: 'text-blue-600', activeBg: 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' },
    { to: '/candidate/market-intelligence', label: 'Market Intelligence', icon: icons.market, color: 'text-indigo-600', activeBg: 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' },
    { to: '/candidate/aptitude', label: 'Aptitude Assessment', icon: icons.assessment, color: 'text-teal-600', activeBg: 'bg-teal-50 text-teal-700 font-bold border-l-4 border-teal-600' },
    { to: '/candidate/coding', label: 'Coding Arena', icon: icons.coding, color: 'text-emerald-600', activeBg: 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600' },
    { to: '/candidate/interview', label: 'Mock Interviews', icon: icons.interview, color: 'text-rose-600', activeBg: 'bg-rose-50 text-rose-700 font-bold border-l-4 border-rose-600' },
    { to: '/candidate/profile', label: 'My Profile', icon: icons.profile, color: 'text-purple-600', activeBg: 'bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-600' },
  ]

  const recruiterLinks = [
    { to: '/recruiter', label: 'Dashboard', icon: icons.dashboard, color: 'text-blue-600', activeBg: 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600', end: true },
    { to: '/recruiter/post-job', label: 'Post Job', icon: icons.plus, color: 'text-emerald-600', activeBg: 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600' },
    { to: '/recruiter/jobs', label: 'Manage Jobs', icon: icons.briefcase, color: 'text-indigo-600', activeBg: 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' },
    { to: '/recruiter/candidates', label: 'Search Candidates', icon: icons.search, color: 'text-purple-600', activeBg: 'bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-600' },
    { to: '/recruiter/rankings', label: 'Rankings & Coding', icon: icons.trophy, color: 'text-amber-600', activeBg: 'bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-600' },
    { to: '/recruiter/market-intelligence', label: 'Market Intelligence', icon: icons.market, color: 'text-indigo-600', activeBg: 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' },
    { to: '/recruiter/interviews', label: 'Interviews', icon: icons.calendar, color: 'text-rose-600', activeBg: 'bg-rose-50 text-rose-700 font-bold border-l-4 border-rose-600' },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: icons.shield, color: 'text-blue-600', activeBg: 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600', end: true },
    { to: '/admin/database', label: 'Database Health', icon: icons.database, color: 'text-purple-600', activeBg: 'bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-600' },
    { to: '/admin/users', label: 'User Directory', icon: icons.users, color: 'text-emerald-600', activeBg: 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600' },
    { to: '/admin/market-intelligence', label: 'Market Analytics', icon: icons.market, color: 'text-indigo-600', activeBg: 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' },
    { to: '/admin/analytics', label: 'Platform Analytics', icon: icons.chart, color: 'text-amber-600', activeBg: 'bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-600' },
  ]

  const links = role === 'admin' ? adminLinks : role === 'recruiter' ? recruiterLinks : candidateLinks

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] bg-white border-r border-slate-200 z-40 flex flex-col overflow-y-auto">
      <nav className="flex-1 py-4">
        <div className="px-6 pb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end || false}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2.5 rounded-lg text-[13.5px] font-medium transition-all ${
                isActive
                  ? link.activeBg
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className={link.color}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout at bottom */}
      <div className="border-t border-line p-3">
        <button
          onClick={logout}
          className="sidebar-link w-full text-err hover:!bg-err-bg hover:!text-err"
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
          </svg>
          <span>Logout</span>
        </button>
        <div className="text-center text-[10px] text-ink-3 pt-2">HireAI v1.0</div>
      </div>
    </aside>
  )
}
