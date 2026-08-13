import React from 'react'
import toast from 'react-hot-toast'

export const RoleSelector = ({ selectedRole, onChange }) => {
  const handleSelectRole = (roleId) => {
    if (roleId === 'admin') {
      toast.error('Registration for Admin is not available', {
        duration: 4000,
        style: {
          background: '#1a1114',
          color: '#f87171',
          border: '1px solid #ef4444',
        },
      })
      if (selectedRole === 'admin') onChange('candidate')
      return
    }
    onChange(roleId)
  }

  const roles = [
    {
      id: 'candidate',
      label: 'Candidate',
      subtitle: 'Job Seeker & Student',
      icon: '👤',
      color: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500',
      disabled: false,
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      subtitle: 'Hiring Manager & HR',
      icon: '💼',
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500',
      disabled: false,
    },
    {
      id: 'admin',
      label: 'Admin',
      subtitle: 'Not Available for Registration',
      icon: '🛡️',
      color: 'from-rose-500/10 to-red-500/10',
      border: 'border-rose-500/30',
      disabled: true,
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Account Role *
        </label>
        <span className="text-[10px] text-amber-400 font-mono">
          * Admin registration not available
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {roles.map((r) => {
          const isSelected = selectedRole === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRole(r.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                r.disabled
                  ? 'opacity-60 cursor-not-allowed bg-black/40 border-rose-500/20'
                  : isSelected
                  ? `bg-gradient-to-br ${r.color} ${r.border} border-2 shadow-lg shadow-indigo-500/10 scale-[1.02]`
                  : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{r.icon}</span>
                {isSelected && !r.disabled && (
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                {r.disabled && (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded uppercase font-bold">
                    Unavailable
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className={`font-bold text-xs font-display ${r.disabled ? 'text-rose-300' : isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {r.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{r.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
