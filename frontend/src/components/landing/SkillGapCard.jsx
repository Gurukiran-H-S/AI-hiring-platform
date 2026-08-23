import React from 'react'
import { Link } from 'react-router-dom'

export const SkillGapCard = () => {
  return (
    <div className="card hover-lift border-warn/40">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-warn">⚠️ Low ATS Skill Gap Alert</h4>
        <span className="badge-warning !text-[10px] font-mono font-bold">
          Target: 60%+
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between bg-canvas p-2 rounded-lg border border-line-soft">
          <span className="text-ink-soft">Current Resume ATS:</span>
          <strong className="text-warn font-mono text-sm">48%</strong>
        </div>

        <div>
          <span className="text-[10px] text-warn uppercase font-bold block mb-1">Missing Priority Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Docker', 'Kubernetes', 'AWS'].map((skill) => (
              <span key={skill} className="badge-warning !text-[10px] font-mono">
                + {skill}
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/candidate/aptitude"
          className="btn-secondary w-full py-1.5 text-center text-xs font-semibold rounded-lg block mt-2"
        >
          View Skill Improvement Path →
        </Link>
      </div>
    </div>
  )
}
