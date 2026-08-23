import React from 'react'

export const FloatingJobCard = () => {
  return (
    <div className="card hover-lift">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-brand">🔎 AI Job Recommendation</h4>
        <span className="badge-primary !text-[10px] font-mono font-bold">
          94% Match
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="font-bold text-ink text-sm font-display">AI / ML Engineer</div>
          <div className="text-[11px] text-ink-muted">TechCorp AI Solutions • Remote</div>
        </div>

        <div>
          <span className="text-[10px] text-ink-soft uppercase font-semibold block mb-1">Required Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Python', 'PyTorch', 'NLP', 'FastAPI', 'Docker'].map((s) => (
              <span key={s} className="skill-tag !text-[10px]">
                {s}
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/candidate/jobs"
          className="btn-primary w-full py-1.5 text-center text-xs font-semibold rounded-lg block mt-3"
        >
          View Job & Apply →
        </Link>
      </div>
    </div>
  )
}
