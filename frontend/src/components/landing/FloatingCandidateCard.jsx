import React from 'react'

export const FloatingCandidateCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#0f1126]/80 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 transition-all hover:scale-105 hover:border-indigo-400">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
            AI
          </div>
          <div>
            <div className="text-xs font-bold text-white font-display">Candidate Profile</div>
            <div className="text-[10px] text-indigo-300 font-mono">Software Engineer</div>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
          Strong Match
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-slate-400">ATS Match Score:</span>
          <span className="font-extrabold text-emerald-400 font-mono text-sm">87%</span>
        </div>

        <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl border border-white/5">
          <span className="text-slate-400">Experience:</span>
          <span className="font-semibold text-white">2.8 Years</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Extracted Core Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Python', 'React', 'SQL', 'FastAPI', 'Machine Learning'].map((skill) => (
              <span key={skill} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded text-[10px] font-mono">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
