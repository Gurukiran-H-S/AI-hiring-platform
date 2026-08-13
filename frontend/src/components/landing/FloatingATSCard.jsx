import React from 'react'

export const FloatingATSCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#0b1220]/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="text-xs font-bold font-display text-emerald-300">🎯 ATS Match Gauge</h4>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Weighted Formula</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Animated Circular Meter */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-400"
              strokeDasharray="87, 100"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-sm font-extrabold font-mono text-emerald-400">87%</span>
        </div>

        {/* Sub-breakdown bars */}
        <div className="flex-1 space-y-1.5 text-[11px]">
          <div>
            <div className="flex justify-between text-slate-300"><span>Skill Match (30%)</span><strong className="text-emerald-400 font-mono">92%</strong></div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[92%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300"><span>Semantic Match (20%)</span><strong className="text-indigo-400 font-mono">84%</strong></div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full w-[84%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300"><span>Experience Match (15%)</span><strong className="text-amber-400 font-mono">81%</strong></div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[81%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
