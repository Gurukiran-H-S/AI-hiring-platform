import React from 'react'
import { Link } from 'react-router-dom'

export const SkillGapCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#140e1d]/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-amber-300">⚠️ Low ATS Skill Gap Alert</h4>
        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded">
          Target: 60%+
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
          <span className="text-slate-400">Current Resume ATS:</span>
          <strong className="text-amber-400 font-mono text-sm">48%</strong>
        </div>

        <div>
          <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">Missing Priority Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Docker', 'Kubernetes', 'AWS'].map((skill) => (
              <span key={skill} className="bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                + {skill}
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/candidate/aptitude"
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 w-full py-1.5 text-center text-xs font-semibold rounded-xl block mt-2 transition-colors"
        >
          View Skill Improvement Path →
        </Link>
      </div>
    </div>
  )
}
