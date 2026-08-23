import React from 'react'

export const CodingCard = () => {
  return (
    <div className="card hover-lift font-mono text-xs">
      <div className="flex items-center justify-between border-b border-line-soft pb-2 mb-3">
        <h4 className="font-bold text-ok font-display text-xs">💻 Coding Assessment</h4>
        <span className="badge-success !text-[10px] font-bold">
          ✓ PASSED (10/10)
        </span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between text-ink-soft">
          <span>Problem:</span> <strong className="text-ink">Three Sum (LeetCode)</strong>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Language:</span> <strong className="text-brand">Java / Python 3</strong>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Execution Time:</span> <strong className="text-ok">12ms (Docker)</strong>
        </div>
        <div className="flex justify-between items-center bg-canvas p-2 rounded-lg border border-line-soft mt-2">
          <span className="text-ink font-sans font-semibold">Coding Score:</span>
          <span className="text-ok font-extrabold text-sm">92 / 100</span>
        </div>
      </div>
    </div>
  )
}
