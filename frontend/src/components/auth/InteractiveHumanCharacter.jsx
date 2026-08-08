import React, { useState, useEffect } from 'react'

/**
 * 3D Professional Full-Body Human Character Component for HireAI Unified Authentication.
 * Features:
 * - Blonde/light-colored hair
 * - Light grey blazer/jacket, dark trousers, white sneakers
 * - Standing full-body relaxed posture with one leg slightly angled
 * - Floating AI recruitment badges ("Resume Analyzed ✓", "ATS Score 87%", "Skill Match 92%", "Job Match Found")
 * - Dynamic Reaction States: IDLE, LOOKING_NAME, LOOKING_EMAIL, PASSWORD_PRIVACY, BUTTON_HOVER, OTP_WAITING, SUCCESS, ERROR
 */

export const InteractiveHumanCharacter = ({ activeState = 'IDLE' }) => {
  const [blinking, setBlinking] = useState(false)

  // Natural eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 180)
    }, 3800)
    return () => clearInterval(blinkInterval)
  }, [])

  // Reaction State Speech Prompts
  const statePrompts = {
    IDLE: "Hi! Welcome to HireAI Unified! 👋",
    LOOKING_NAME: "Enter your full name to start! ✍️",
    LOOKING_EMAIL: "We'll send your 6-digit OTP here 📧",
    PASSWORD_PRIVACY: "Your password is 100% private! 🙈",
    BUTTON_HOVER: "Ready? Let's get started! 🚀",
    OTP_WAITING: "Check your email for the 6-digit OTP! ✉️",
    SUCCESS: "Awesome! Email Verified & Account Ready! 🎉",
    ERROR: "Oops! Incorrect code. Let me check... ⚠️",
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none relative z-20 transition-all duration-500 w-full max-w-sm mx-auto">
      {/* Speech Bubble */}
      <div className="mb-3 bg-[#0d0e19]/90 border border-indigo-500/40 text-indigo-200 text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md animate-scale-up flex items-center gap-2 max-w-xs text-center font-display">
        <span>{statePrompts[activeState] || statePrompts.IDLE}</span>
      </div>

      {/* Floating AI Recruitment Context Badges */}
      <div className="relative w-full max-w-[280px] h-[340px] flex items-center justify-center">
        {/* Ambient Halo */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-emerald-500/15 filter blur-2xl animate-pulse"></div>

        {/* Floating Card 1: Resume Analyzed */}
        <div className="absolute top-2 left-0 bg-[#0d0e19]/90 border border-emerald-500/40 px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md animate-float flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold z-30">
          <span>📄 Resume Analyzed ✓</span>
        </div>

        {/* Floating Card 2: ATS Score */}
        <div className="absolute top-8 -right-2 bg-[#0d0e19]/90 border border-indigo-500/40 px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md animate-float-delayed flex items-center gap-1.5 text-[10px] z-30">
          <span className="text-indigo-300 font-bold font-mono">ATS SCORE</span>
          <span className="bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">87% ✓</span>
        </div>

        {/* Floating Card 3: Skill Match */}
        <div className="absolute bottom-16 -left-3 bg-[#0d0e19]/90 border border-purple-500/40 px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-md animate-float flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold z-30">
          <span>🧠 Skill Match 92%</span>
        </div>

        {/* Floating Context Badge for States */}
        {activeState === 'OTP_WAITING' && (
          <div className="absolute top-24 right-0 bg-emerald-500/25 border border-emerald-500/50 px-3 py-1.5 rounded-2xl animate-bounce flex items-center gap-1.5 text-xs text-emerald-300 font-bold z-40 shadow-xl">
            <span className="text-base">📧</span> Check Email
          </div>
        )}

        {activeState === 'SUCCESS' && (
          <div className="absolute top-24 right-0 bg-emerald-500/30 border border-emerald-500/60 px-3 py-1.5 rounded-2xl animate-scale-up flex items-center gap-1.5 text-xs text-emerald-300 font-bold z-40 shadow-xl">
            <span className="text-base">✓</span> Email Verified!
          </div>
        )}

        {/* Full-Body 3D Cartoon Professional Human Character (Blonde Hair, Light Grey Blazer, Dark Trousers, White Shoes) */}
        <svg
          viewBox="0 0 200 320"
          className={`w-full h-full drop-shadow-2xl transition-transform duration-500 ${
            activeState === 'PASSWORD_PRIVACY'
              ? 'scale-95 rotate-2'
              : activeState === 'LOOKING_EMAIL' || activeState === 'LOOKING_NAME'
              ? 'scale-105 -translate-x-2'
              : activeState === 'BUTTON_HOVER'
              ? 'scale-105 -translate-y-1'
              : activeState === 'ERROR'
              ? 'animate-shake'
              : 'animate-float'
          }`}
        >
          <defs>
            {/* Light Grey Blazer Gradient */}
            <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Dark Trousers Gradient */}
            <linearGradient id="trouserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Skin Tone Gradient */}
            <linearGradient id="skinToneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdfc4" />
              <stop offset="100%" stopColor="#f1c27d" />
            </linearGradient>

            {/* Blonde Hair Gradient */}
            <linearGradient id="blondeHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            {/* White Shoes Gradient */}
            <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Ground Shadow */}
          <ellipse cx="100" cy="305" rx="60" ry="8" fill="#000" opacity="0.35" />

          {/* 1. LEGS & DARK TROUSERS (Relaxed Standing Pose, Right Leg Slightly Cross-Angled) */}
          <g>
            {/* Left Leg */}
            <path d="M 82 180 L 78 280 L 92 280 L 94 180 Z" fill="url(#trouserGrad)" />
            {/* Right Leg (Slightly Angled/Crossed Relaxed Pose) */}
            <path d="M 112 180 L 122 280 L 108 280 L 100 180 Z" fill="url(#trouserGrad)" />
          </g>

          {/* 2. WHITE SNEAKERS / SHOES */}
          <g>
            {/* Left Shoe */}
            <path d="M 68 280 Q 75 272 94 280 Q 94 290 68 290 Z" fill="url(#shoeGrad)" stroke="#cbd5e1" strokeWidth="1" />
            {/* Right Shoe */}
            <path d="M 106 280 Q 125 272 132 280 Q 132 290 106 290 Z" fill="url(#shoeGrad)" stroke="#cbd5e1" strokeWidth="1" />
          </g>

          {/* 3. TORSO (White Shirt + Light Grey Blazer) */}
          <g>
            {/* White Shirt Collar Base */}
            <polygon points="90,105 110,105 106,145 94,145" fill="#ffffff" />
            {/* Teal Business Tie */}
            <polygon points="98,110 102,110 104,140 100,145 96,140" fill="#0d9488" />

            {/* Light Grey Blazer Body */}
            <path
              d="M 60 110 Q 100 98 140 110 L 148 185 L 52 185 Z"
              fill="url(#blazerGrad)"
            />
            {/* Lapels */}
            <path d="M 60 110 L 88 150 L 75 185 Z" fill="#94a3b8" />
            <path d="M 140 110 L 112 150 L 125 185 Z" fill="#94a3b8" />
          </g>

          {/* 4. HEAD & NECK */}
          <rect x="91" y="90" width="18" height="20" rx="4" fill="url(#skinToneGrad)" />
          {/* Head Base */}
          <ellipse cx="100" cy="68" rx="28" ry="32" fill="url(#skinToneGrad)" />

          {/* 5. BLONDE HAIR (Styled Modern Professional Cut) */}
          <path
            d="M 72 65 C 72 32 128 32 128 65 C 128 48 116 35 100 35 C 84 35 72 48 72 65 Z"
            fill="url(#blondeHairGrad)"
          />
          <path d="M 72 65 C 80 50 100 50 105 60 C 110 50 125 55 128 65" fill="none" stroke="#fef08a" strokeWidth="2.5" />

          {/* 6. EYES & PUPILS (Reacts dynamically to user focus) */}
          {activeState === 'PASSWORD_PRIVACY' ? (
            /* Covered / Closed eyes */
            <g stroke="#334155" strokeWidth="2.5" strokeLinecap="round">
              <path d="M 86 67 Q 91 71 96 67" fill="none" />
              <path d="M 104 67 Q 109 71 114 67" fill="none" />
            </g>
          ) : (
            <g>
              {/* Left Eye */}
              <ellipse cx="89" cy="66" rx="5.5" ry={blinking ? "0.8" : "5"} fill="#ffffff" />
              {!blinking && (
                <circle
                  cx={
                    activeState === 'LOOKING_NAME' || activeState === 'LOOKING_EMAIL'
                      ? '91'
                      : '89'
                  }
                  cy="66"
                  r="2.8"
                  fill="#1e293b"
                />
              )}

              {/* Right Eye */}
              <ellipse cx="111" cy="66" rx="5.5" ry={blinking ? "0.8" : "5"} fill="#ffffff" />
              {!blinking && (
                <circle
                  cx={
                    activeState === 'LOOKING_NAME' || activeState === 'LOOKING_EMAIL'
                      ? '113'
                      : '111'
                  }
                  cy="66"
                  r="2.8"
                  fill="#1e293b"
                />
              )}
            </g>
          )}

          {/* 7. MOUTH EXPRESSION */}
          {activeState === 'SUCCESS' || activeState === 'BUTTON_HOVER' ? (
            /* Broad Happy Smile */
            <path d="M 88 80 Q 100 90 112 80" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          ) : activeState === 'ERROR' ? (
            /* Concerned Mouth */
            <path d="M 90 85 Q 100 78 110 85" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            /* Gentle Friendly Smile */
            <path d="M 90 80 Q 100 86 110 80" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* 8. ARMS & HAND GESTURES (Reacts to form interaction states) */}
          {activeState === 'PASSWORD_PRIVACY' ? (
            /* Hand covering eyes for privacy */
            <g fill="url(#skinToneGrad)">
              <ellipse cx="88" cy="66" rx="8" ry="10" />
              <ellipse cx="112" cy="66" rx="8" ry="10" />
            </g>
          ) : activeState === 'LOOKING_EMAIL' || activeState === 'LOOKING_NAME' ? (
            /* Attentive Gesture Pointing toward Form */
            <g stroke="url(#blazerGrad)" strokeWidth="10" strokeLinecap="round">
              <path d="M 135 120 Q 160 95 178 85" fill="none" />
              <circle cx="180" cy="83" r="5" fill="url(#skinToneGrad)" stroke="none" />
            </g>
          ) : activeState === 'SUCCESS' ? (
            /* Raised Arm Victory Gesture */
            <g stroke="url(#blazerGrad)" strokeWidth="10" strokeLinecap="round">
              <path d="M 60 120 L 40 85" fill="none" />
              <path d="M 140 120 L 160 85" fill="none" />
              <circle cx="38" cy="81" r="5.5" fill="url(#skinToneGrad)" stroke="none" />
              <circle cx="162" cy="81" r="5.5" fill="url(#skinToneGrad)" stroke="none" />
            </g>
          ) : (
            /* Relaxed Position: Arms Positioned Naturally in Front */
            <g stroke="url(#blazerGrad)" strokeWidth="10" strokeLinecap="round">
              <path d="M 60 120 Q 80 145 90 155" fill="none" />
              <path d="M 140 120 Q 120 145 110 155" fill="none" />
              <circle cx="100" cy="157" r="6" fill="url(#skinToneGrad)" stroke="none" />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
