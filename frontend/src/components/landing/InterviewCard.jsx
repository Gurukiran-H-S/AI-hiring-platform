import React from 'react'

export const InterviewCard = () => {
  return (
    <div className="card hover-lift text-xs">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="font-bold font-display text-brand">🎙️ AI Technical Mock Interview</h4>
        <span className="badge-primary !text-[10px] font-mono font-bold">
          88% Evaluation
        </span>
      </div>

      <div className="space-y-2">
        <div className="bg-canvas p-2 rounded-lg border border-line-soft italic text-ink-soft text-[11px]">
          "Explain your approach to optimizing a high-throughput REST API with caching & indexing."
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="bg-canvas p-1.5 rounded-lg border border-line-soft">
            <span className="text-ink-muted block">Comm</span>
            <strong className="text-brand">88%</strong>
          </div>
          <div className="bg-canvas p-1.5 rounded-lg border border-line-soft">
            <span className="text-ink-muted block">Tech</span>
            <strong className="text-ok">91%</strong>
          </div>
          <div className="bg-canvas p-1.5 rounded-lg border border-line-soft">
            <span className="text-ink-muted block">Solving</span>
            <strong className="text-brand">86%</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
