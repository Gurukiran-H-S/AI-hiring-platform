import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const InteractiveAvatar = () => {
  const navigate = useNavigate()
  const [position, setPosition] = useState({ x: 40, y: 75 })

  // Floating animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => ({
        x: 40 + Math.sin(Date.now() / 1000) * 15,
        y: 75 + Math.cos(Date.now() / 1200) * 5,
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const handleGlobalClick = () => {
    navigate('/login')
  }

  return (
    <div
      onClick={handleGlobalClick}
      className="fixed z-40 cursor-pointer select-none transition-all duration-300 hover:scale-105"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      title="Click anywhere to open Login!"
    >
      <div className="relative flex flex-col items-center group">
        {/* Speech bubble */}
        <div className="bg-brand text-white font-semibold px-4 py-2 rounded-xl shadow-card-hover text-xs flex items-center gap-2 mb-2">
          <span className="text-lg">👋</span>
          <span>Hi! Click anywhere to Sign In!</span>
        </div>

        {/* Avatar chip */}
        <div className="w-14 h-14 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center shadow-card">
          <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
      </div>
    </div>
  )
}
