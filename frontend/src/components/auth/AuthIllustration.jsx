import React from 'react'

export const AuthIllustration = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center p-8 relative overflow-hidden select-none">
      <div className="relative z-10 text-center max-w-md space-y-6">
        {/* Illustration Area */}
        <div className="relative flex justify-center items-center py-6">
          {/* Outer Dashed Ring */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-line"></div>

          {/* AI Mascot Tile */}
          <div className="w-28 h-28 rounded-3xl bg-brand-light border border-line shadow-sm flex items-center justify-center p-3">
            <img
              src="/logo-mark.png"
              alt="AI Hiring Logo"
              className="w-20 h-auto object-contain"
            />
          </div>

          {/* Floating Card 1: ATS Score */}
          <div className="absolute -top-2 right-2 card !p-0 px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="text-ink font-bold font-mono">ATS SCORE</span>
            <span className="bg-ok-soft text-ok px-2 py-0.5 rounded font-mono font-bold">87% ✓</span>
          </div>

          {/* Floating Card 2: Skill Match */}
          <div className="absolute -bottom-2 -left-4 card !p-0 px-3.5 py-1.5 flex items-center gap-2 text-xs">
            <span className="text-brand font-bold">Python ✓ SQL ✓ AWS</span>
          </div>

          {/* Floating Card 3: Job Match Found */}
          <div className="absolute top-1/2 -right-10 translate-y-4 card !p-0 px-3 py-1.5 flex items-center gap-1.5 text-xs text-brand font-semibold">
            <span>🎯 Job Match Found</span>
          </div>
        </div>

        {/* Branding & Subtitle */}
        <div className="space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-light border border-line text-brand text-xs font-semibold">
            <span>✨</span> AI Hiring Platform
          </div>
          <h2 className="text-3xl font-extrabold font-display text-ink">
            {title || 'AI-Powered Recruitment'}
          </h2>
          <p className="text-ink-soft text-xs leading-relaxed max-w-sm mx-auto">
            {subtitle || 'Smarter Careers. NLP Resume Parsing, Explainable ATS Scoring & Automated Candidate Evaluation.'}
          </p>
        </div>
      </div>
    </div>
  )
}
