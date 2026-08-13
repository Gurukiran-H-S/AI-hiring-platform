import React from 'react'

export const FloatingResumeCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#0c0d1c]/90 border border-purple-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-purple-500/10">
      {/* Animated AI Scanning Beam Line */}
      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-beam z-20 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-purple-300 flex items-center gap-1.5">
          <span>📄</span> spaCy NLP Resume Parser
        </h4>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
          SCANNING ACTIVE
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px]">PARSED CANDIDATE NAME</div>
          <div className="text-white font-bold text-xs">Rahul Sharma</div>
        </div>

        <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px]">ROLE & TITLE</div>
          <div className="text-indigo-300 font-semibold">AI / Full-Stack Developer</div>
        </div>

        <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px]">EXTRACTED SKILLS (NORMALIZED)</div>
          <div className="text-emerald-300 text-[11px]">
            ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "AWS"]
          </div>
        </div>
      </div>
    </div>
  )
}
