import React from 'react'

export const RoleSelector = ({ selectedRole, onChange }) => {
  const roles = [
    {
      id: 'candidate',
      label: 'Candidate',
      subtitle: 'Job Seeker & Student',
      icon: '👤',
      color: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500',
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      subtitle: 'Hiring Manager & HR',
      icon: '💼',
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500',
    },
    {
      id: 'admin',
      label: 'Admin',
      subtitle: 'Platform Controller',
      icon: '🛡️',
      color: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500',
    },
  ]

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Select Account Role *
      </label>
      <div className="grid grid-cols-3 gap-3">
        {roles.map((r) => {
          const isSelected = selectedRole === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? `bg-gradient-to-br ${r.color} ${r.border} border-2 shadow-lg shadow-indigo-500/10 scale-[1.02]`
                  : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{r.icon}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className={`font-bold text-xs font-display ${isSelected ? 'text-white' : 'text-slate-300'}`}>
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
