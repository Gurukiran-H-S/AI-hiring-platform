import React from 'react'

export const FloatingATSCard = () => {
  return (
    <div className="card hover-lift">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-ok">🎯 ATS Match Gauge</h4>
        <span className="badge-neutral !text-[10px] font-mono">Weighted Formula</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular Meter */}
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-line"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-ok"
              strokeDasharray="87, 100"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-sm font-extrabold font-mono text-ok">87%</span>
        </div>

        {/* Sub-breakdown bars */}
        <div className="flex-1 space-y-1.5 text-[11px]">
          <div>
            <div className="flex justify-between text-ink-soft"><span>Skill Match (30%)</span><strong className="text-ok font-mono">92%</strong></div>
            <div className="w-full bg-canvas border border-line-soft h-1 rounded-full overflow-hidden">
              <div className="bg-ok h-full w-[92%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-ink-soft"><span>Semantic Match (20%)</span><strong className="text-brand font-mono">84%</strong></div>
            <div className="w-full bg-canvas border border-line-soft h-1 rounded-full overflow-hidden">
              <div className="bg-brand h-full w-[84%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-ink-soft"><span>Experience Match (15%)</span><strong className="text-warn font-mono">81%</strong></div>
            <div className="w-full bg-canvas border border-line-soft h-1 rounded-full overflow-hidden">
              <div className="bg-warn h-full w-[81%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
