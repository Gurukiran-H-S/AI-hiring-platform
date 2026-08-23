import React from 'react'
import toast from 'react-hot-toast'

export const RoleSelector = ({ selectedRole, onChange }) => {
  const handleSelectRole = (roleId) => {
    if (roleId === 'admin') {
      toast.error('Registration for Admin is not available', {
        duration: 4000,
        style: {
          background: '#FEF0F0',
          color: '#D92D20',
          border: '1px solid #FECDCA',
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
      disabled: false,
    },
    {
      id: 'recruiter',
      label: 'Recruiter',
      subtitle: 'Hiring Manager & HR',
      icon: '💼',
      disabled: false,
    },
    {
      id: 'admin',
      label: 'Admin',
      subtitle: 'Not Available for Registration',
      icon: '🛡️',
      disabled: true,
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Select Account Role *
        </label>
        <span className="text-[10px] text-warn font-mono">
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
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                r.disabled
                  ? 'opacity-60 cursor-not-allowed bg-canvas border-line'
                  : isSelected
                  ? 'bg-brand-light border-brand border-2 shadow-sm'
                  : 'bg-white border-line hover:border-brand'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{r.icon}</span>
                {isSelected && !r.disabled && (
                  <span className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                {r.disabled && (
                  <span className="text-[9px] bg-bad-soft text-bad border border-bad/30 px-1.5 py-0.5 rounded uppercase font-bold">
                    Unavailable
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className={`font-bold text-xs font-display ${r.disabled ? 'text-bad' : isSelected ? 'text-brand' : 'text-ink'}`}>
                  {r.label}
                </div>
                <div className="text-[10px] text-ink-muted truncate">{r.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
