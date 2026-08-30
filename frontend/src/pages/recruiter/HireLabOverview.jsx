import React from 'react'
import { Link } from 'react-router-dom'

export const HireLabOverview = () => {
  const modules = [
    {
      title: 'Coding & Rankings',
      icon: '💻',
      desc: 'Manage coding assessments, evaluate technical performance, configure evaluation weights, and review ranked candidate leaderboards.',
      link: '/recruiter/rankings',
      badge: 'Evaluation Engine',
      badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnCls: 'btn-success',
    },
    {
      title: 'Aptitude Builder',
      icon: '🧠',
      desc: 'Create job-specific aptitude tests, configure question banks, set negative marking, and generate secure candidate launch codes.',
      link: '/recruiter/aptitude',
      badge: 'Assessment Creator',
      badgeCls: 'bg-teal-100 text-teal-800 border-teal-300',
      btnCls: 'btn-primary',
    },
    {
      title: 'Interviews',
      icon: '🎤',
      desc: 'Schedule candidate interview rounds, track status, generate structured evaluation rubrics, and log meeting timelines.',
      link: '/recruiter/interviews',
      badge: 'Interview Management',
      badgeCls: 'bg-rose-100 text-rose-800 border-rose-300',
      btnCls: 'btn-secondary',
    },
  ]

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto text-ink pb-12">
      <header className="card bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-emerald-50/40 border border-blue-200/70 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
              ⚡ Recruiter Evaluation Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            HireLab — Candidate Evaluation &amp; Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Unified workspace for technical coding evaluations, aptitude assessments, and candidate interview management.
          </p>
        </div>
      </header>

      {/* Evaluation Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((m) => (
          <div key={m.title} className="card card-hover flex flex-col justify-between p-6 space-y-4 border border-line bg-canvas">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{m.icon}</span>
                <span className={`text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${m.badgeCls}`}>
                  {m.badge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink">{m.title}</h2>
              <p className="text-xs text-ink-3 leading-relaxed">{m.desc}</p>
            </div>

            <div className="pt-3 border-t border-line">
              <Link to={m.link} className={`${m.btnCls} w-full text-center block text-xs font-bold py-2`}>
                Open {m.title} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
