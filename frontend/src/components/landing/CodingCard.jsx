import React from 'react'

export const CodingCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#081215]/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="font-bold text-emerald-300 font-display text-xs">💻 Coding Assessment</h4>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
          ✓ PASSED (10/10)
        </span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between text-slate-400">
          <span>Problem:</span> <strong className="text-white">Three Sum (LeetCode)</strong>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Language:</span> <strong className="text-indigo-300">Java / Python 3</strong>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Execution Time:</span> <strong className="text-emerald-400">12ms (Docker)</strong>
        </div>
        <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5 mt-2">
          <span className="text-slate-300 font-sans font-semibold">Coding Score:</span>
          <span className="text-emerald-400 font-extrabold text-sm">92 / 100</span>
        </div>
      </div>
    </div>
  )
}
