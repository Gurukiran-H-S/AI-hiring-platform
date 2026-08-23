import React from 'react'

export const FloatingResumeCard = () => {
  return (
    <div className="card hover-lift">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-brand flex items-center gap-1.5">
          <span>📄</span> spaCy NLP Resume Parser
        </h4>
        <span className="badge-primary !text-[10px] font-mono font-bold">
          SCANNING ACTIVE
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="bg-canvas p-2 rounded-lg border border-line-soft space-y-1">
          <div className="text-ink-muted text-[10px]">PARSED CANDIDATE NAME</div>
          <div className="text-ink font-bold text-xs">Rahul Sharma</div>
        </div>

        <div className="bg-canvas p-2 rounded-lg border border-line-soft space-y-1">
          <div className="text-ink-muted text-[10px]">ROLE & TITLE</div>
          <div className="text-brand font-semibold">AI / Full-Stack Developer</div>
        </div>

        <div className="bg-canvas p-2 rounded-lg border border-line-soft space-y-1">
          <div className="text-ink-muted text-[10px]">EXTRACTED SKILLS (NORMALIZED)</div>
          <div className="text-ok text-[11px]">
            ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "AWS"]
          </div>
        </div>
      </div>
    </div>
  )
}
