import React from 'react'
import { CandidateRankingCard } from './CandidateRankingCard'

export const RecruiterIntelligenceSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            RECRUITER DECISION-SUPPORT DASHBOARD
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-200 to-emerald-300 bg-clip-text text-transparent mt-4 mb-4">
            Recruiters See More Than a Resume
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Recruiters receive automated 4-signal candidate rankings, customizable evaluation weights sliders, 360° profile views, and instant decision actions (Shortlist, Schedule Interview, Reject).
          </p>

          <div className="space-y-3 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Configurable Evaluation Weights:</span>
              <span className="text-indigo-300 font-mono">ATS + Coding + Skill + Interview</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Mismatch Alerts:</span>
              <span className="text-amber-400 font-mono">High ATS + Low Coding Warning</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">One-Click Actions:</span>
              <span className="text-emerald-400 font-mono">[Shortlist] [Interview] [Reject]</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <CandidateRankingCard />
        </div>
      </div>
    </section>
  )
}
