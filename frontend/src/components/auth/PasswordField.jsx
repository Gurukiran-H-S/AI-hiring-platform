import React, { useState } from 'react'

export const PasswordField = ({ value, onChange, label = 'Password', placeholder = '••••••••' }) => {
  const [showPassword, setShowPassword] = useState(false)

  const getStrength = (pwd) => {
    if (!pwd) return { label: '', percent: 0, color: 'bg-line' }
    let score = 0
    if (pwd.length >= 8) score += 30
    if (/[A-Z]/.test(pwd)) score += 20
    if (/[0-9]/.test(pwd)) score += 25
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25

    if (score < 40) return { label: 'Weak', percent: 33, color: '!bg-bad' }
    if (score < 75) return { label: 'Medium', percent: 66, color: '!bg-warn' }
    return { label: 'Strong', percent: 100, color: '!bg-ok' }
  }

  const strength = getStrength(value)

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
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
          className="input w-full p-3 pr-10 text-xs"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs select-none"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {value && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-ink-soft">
            <span>Password Strength:</span>
            <span className="font-semibold text-ink">{strength.label}</span>
          </div>
          <div className="progress-bar !h-1">
            <div
              className={`progress-fill ${strength.color} transition-all duration-500`}
              style={{ width: `${strength.percent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
