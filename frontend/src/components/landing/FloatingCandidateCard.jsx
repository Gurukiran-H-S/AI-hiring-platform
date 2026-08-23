import React from 'react'

export const FloatingCandidateCard = () => {
  return (
    <div className="card hover-lift">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="avatar">AI</div>
          <div>
            <div className="text-xs font-bold text-ink font-display">Candidate Profile</div>
            <div className="text-[10px] text-ink-muted font-mono">Software Engineer</div>
          </div>
        </div>
        <span className="badge-success !text-[10px] font-bold font-mono">
          Strong Match
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between bg-canvas p-2 rounded-lg border border-line-soft">
          <span className="text-ink-soft">ATS Match Score:</span>
          <span className="font-extrabold text-ok font-mono text-sm">87%</span>
        </div>

        <div className="flex items-center justify-between bg-canvas p-2 rounded-lg border border-line-soft">
          <span className="text-ink-soft">Experience:</span>
          <span className="font-semibold text-ink">2.8 Years</span>
        </div>

        <div>
          <span className="text-[10px] text-ink-soft uppercase font-semibold block mb-1">Extracted Core Skills:</span>
          <div className="flex flex-wrap gap-1">
            {['Python', 'React', 'SQL', 'FastAPI', 'Machine Learning'].map((skill) => (
              <span key={skill} className="skill-tag !text-[10px]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
