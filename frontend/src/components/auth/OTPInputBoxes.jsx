import React, { useState, useEffect, useRef } from 'react'

export const OTPInputBoxes = ({ value, onChange, onVerify, onResend, loading, errorShake }) => {
  const [timer, setTimer] = useState(300) // 5 minutes (300 seconds)
  const inputRefs = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleDigitChange = (idx, e) => {
    const val = e.target.value
    if (!/^\d*$/.test(val)) return // Numeric only

    const newDigits = [...digits]
    newDigits[idx] = val.slice(-1)
    const newOtp = newDigits.join('').trim()
    onChange(newOtp)

    // Auto advance to next input box
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  return (
    <div className={`space-y-6 ${errorShake ? 'animate-shake' : ''}`}>
      {/* 6 Digit Input Boxes */}
      <div className="flex justify-between items-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[idx] || ''}
            onChange={(e) => handleDigitChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`input w-12 h-14 text-center font-mono font-bold text-2xl rounded-2xl transition-all duration-200 focus:outline-none ${
              digits[idx]
                ? 'border-brand bg-brand-light text-ink scale-105'
                : 'border-line hover:border-ink-faint focus:border-brand'
            }`}
          />
        ))}
      </div>

      {/* Countdown Timer & Resend */}
      <div className="flex items-center justify-between text-xs text-ink-soft border-t border-b border-line-soft py-3">
        <div className="flex items-center gap-2">
          <span>⏱️ Expires in:</span>
          <span className={`font-mono font-bold ${timer < 60 ? 'text-bad animate-pulse' : 'text-ok'}`}>
            {formatTimer(timer)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setTimer(300)
            onResend()
          }}
          disabled={loading || timer > 270}
          className="text-brand hover:text-brand-dark font-semibold disabled:text-ink-faint disabled:cursor-not-allowed"
        >
          Resend Code
        </button>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={onVerify}
        disabled={loading || value.length < 6}
        className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            Verifying Code...
          </span>
        ) : (
          'Verify OTP & Complete Registration →'
        )}
      </button>
    </div>
  )
}
