import React from 'react'
import { Link } from 'react-router-dom'

export const FloatingJobCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#091122]/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-cyan-300">🔎 AI Job Recommendation</h4>
        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded">
          94% Match
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="font-bold text-white text-sm font-display">AI / ML Engineer</div>
          <div className="text-[11px] text-slate-400">TechCorp AI Solutions • Remote</div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Required Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Python', 'PyTorch', 'NLP', 'FastAPI', 'Docker'].map((s) => (
              <span key={s} className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                {s}
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/candidate/jobs"
          className="btn-primary w-full py-1.5 text-center text-xs font-semibold rounded-xl block mt-3"
        >
          View Job & Apply →
        </Link>
      </div>
    </div>
  )
}
