import React from 'react'

export const AuthIllustration = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center p-8 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl -top-10 -left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl -bottom-10 -right-10 animate-pulse"></div>

      <div className="relative z-10 text-center max-w-md space-y-6">
        {/* Floating Hero AI Mascot */}
        <div className="relative flex justify-center items-center py-6">
          {/* Outer Rotating Ring */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-indigo-500/30 animate-spin-slow"></div>

          {/* AI Robot Mascot */}
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 shadow-2xl shadow-indigo-500/40 animate-float">
            <div className="w-full h-full bg-[#0d0e19] rounded-[22px] flex items-center justify-center text-5xl">
              🤖
            </div>
          </div>

          {/* Floating Card 1: ATS Score */}
          <div className="absolute -top-2 right-2 bg-[#0d0e19]/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md animate-float-delayed flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-bold font-mono">ATS SCORE</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">87% ✓</span>
          </div>

          {/* Floating Card 2: Skill Match */}
          <div className="absolute -bottom-2 -left-4 bg-[#0d0e19]/90 border border-indigo-500/40 px-3.5 py-1.5 rounded-xl shadow-xl backdrop-blur-md animate-float flex items-center gap-2 text-xs">
            <span className="text-indigo-300 font-bold">Python ✓ SQL ✓ AWS</span>
          </div>

          {/* Floating Card 3: Job Match Found */}
          <div className="absolute top-1/2 -right-10 translate-y-4 bg-[#0d0e19]/90 border border-purple-500/40 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md animate-float-delayed flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
            <span>🎯 Job Match Found</span>
          </div>
        </div>

        {/* Branding & Subtitle */}
        <div className="space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <span>✨</span> HireAI Unified Platform
          </div>
          <h2 className="text-3xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
            {title || 'AI-Powered Recruitment'}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
            {subtitle || 'Smarter Careers. NLP Resume Parsing, Explainable ATS Scoring & Automated Candidate Evaluation.'}
          </p>
        </div>
      </div>
    </div>
  )
}
