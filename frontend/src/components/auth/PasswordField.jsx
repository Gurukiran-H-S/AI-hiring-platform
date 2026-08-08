import React, { useState } from 'react'

export const PasswordField = ({ value, onChange, label = 'Password', placeholder = '••••••••' }) => {
  const [showPassword, setShowPassword] = useState(false)

  const getStrength = (pwd) => {
    if (!pwd) return { label: '', percent: 0, color: 'bg-slate-700' }
    let score = 0
    if (pwd.length >= 8) score += 30
    if (/[A-Z]/.test(pwd)) score += 20
    if (/[0-9]/.test(pwd)) score += 25
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25

    if (score < 40) return { label: 'Weak', percent: 33, color: 'bg-rose-500' }
    if (score < 75) return { label: 'Medium', percent: 66, color: 'bg-amber-500' }
    return { label: 'Strong', percent: 100, color: 'bg-emerald-500' }
  }

  const strength = getStrength(value)

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label} *
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-[#0a0b14]/80 border border-white/15 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs select-none"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {value && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Password Strength:</span>
            <span className="font-semibold text-slate-200">{strength.label}</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-500`}
              style={{ width: `${strength.percent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
