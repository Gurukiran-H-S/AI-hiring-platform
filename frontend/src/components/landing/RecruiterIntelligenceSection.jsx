import React from 'react'
import { CandidateRankingCard } from './CandidateRankingCard'

export const RecruiterIntelligenceSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-canvas">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
            RECRUITER DECISION-SUPPORT DASHBOARD
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink mt-4 mb-4">
            Recruiters See More Than a Resume
          </h2>
          <p className="text-ink-soft text-sm md:text-base leading-relaxed mb-6">
            Recruiters receive automated 4-signal candidate rankings, customizable evaluation weights sliders, 360° profile views, and instant decision actions (Shortlist, Schedule Interview, Reject).
          </p>

          <div className="space-y-3 text-xs">
            <div className="card !p-3 flex items-center justify-between">
              <span className="text-ink font-semibold">Configurable Evaluation Weights:</span>
              <span className="text-brand font-mono">ATS + Coding + Skill + Interview</span>
            </div>
            <div className="card !p-3 flex items-center justify-between">
              <span className="text-ink font-semibold">Mismatch Alerts:</span>
              <span className="text-warn font-mono">High ATS + Low Coding Warning</span>
            </div>
            <div className="card !p-3 flex items-center justify-between">
              <span className="text-ink font-semibold">One-Click Actions:</span>
              <span className="text-ok font-mono">[Shortlist] [Interview] [Reject]</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <CandidateRankingCard />
        </div>
      </div>
    </section>
  )
}
