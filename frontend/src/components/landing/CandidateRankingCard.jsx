import React from 'react'
import { Link } from 'react-router-dom'

export const CandidateRankingCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#0e0a1b]/90 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="font-bold font-display text-indigo-300">🏆 Recruiter Candidate Ranking</h4>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded">
          Job: Senior Developer
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">#1</span>
            <span>Rahul S. (Candidate A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-emerald-500/30 px-1.5 py-0.5 rounded font-sans font-bold">RECOMMENDED</span>
            <strong className="text-emerald-400 text-xs">94%</strong>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-xl text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">#2</span>
            <span>Priya M. (Candidate B)</span>
          </div>
          <strong className="text-indigo-300 text-xs">89%</strong>
        </div>

        <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-xl text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">#3</span>
            <span>Anil K. (Candidate C)</span>
          </div>
          <strong className="text-indigo-300 text-xs">84%</strong>
        </div>
      </div>

      <Link
        to="/recruiter/rankings"
        className="btn-primary w-full py-1.5 text-center text-xs font-semibold rounded-xl block mt-3"
      >
        View Recruiter Ranking Board →
      </Link>
    </div>
  )
}
