import React from 'react'
import { Link } from 'react-router-dom'

export const CandidateRankingCard = () => {
  return (
    <div className="card hover-lift text-xs">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="font-bold font-display text-brand">🏆 Recruiter Candidate Ranking</h4>
        <span className="badge-primary !text-[10px] font-mono font-bold">
          Job: Senior Developer
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between bg-ok-soft border border-ok/30 p-2 rounded-lg text-ok">
          <div className="flex items-center gap-2">
            <span className="font-bold text-warn">#1</span>
            <span>Rahul S. (Candidate A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-white text-ok px-1.5 py-0.5 rounded font-sans font-bold">RECOMMENDED</span>
            <strong className="text-ok text-xs">94%</strong>
          </div>
        </div>

        <div className="flex items-center justify-between bg-canvas border border-line-soft p-2 rounded-lg text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-muted">#2</span>
            <span>Priya M. (Candidate B)</span>
          </div>
          <strong className="text-brand text-xs">89%</strong>
        </div>

        <div className="flex items-center justify-between bg-canvas border border-line-soft p-2 rounded-lg text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-muted">#3</span>
            <span>Anil K. (Candidate C)</span>
          </div>
          <strong className="text-brand text-xs">84%</strong>
        </div>
      </div>

      <Link
        to="/recruiter/rankings"
        className="btn-primary w-full py-1.5 text-center text-xs font-semibold rounded-lg block mt-3"
      >
        View Recruiter Ranking Board →
      </Link>
    </div>
  )
}
