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
        {/* Animated Speech Bubble saying HI */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 text-white font-bold px-4 py-2 rounded-2xl shadow-xl border border-white/20 text-xs animate-bounce flex items-center gap-2 mb-2 font-display">
          <span className="text-lg">👋</span>
          <span>Hi! Click anywhere to Sign In!</span>
        </div>

        {/* Floating Animated Avatar Graphic */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-3xl shadow-2xl border-2 border-white/30 shadow-indigo-500/50 animate-pulse">
          🤖
        </div>
      </div>
    </div>
  )
}
