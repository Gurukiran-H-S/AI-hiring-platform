import React from 'react'

export const InterviewCard = () => {
  return (
    <div className="glass-card p-5 rounded-2xl bg-[#120a1f]/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10 text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <h4 className="font-bold font-display text-purple-300">🎙️ AI Technical Mock Interview</h4>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono font-bold px-2 py-0.5 rounded">
          88% Evaluation
        </span>
      </div>

      <div className="space-y-2">
        <div className="bg-black/40 p-2 rounded-xl border border-white/5 italic text-slate-300 text-[11px]">
          "Explain your approach to optimizing a high-throughput REST API with caching & indexing."
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
            <span className="text-slate-400 block">Comm</span>
            <strong className="text-purple-300">88%</strong>
          </div>
          <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
            <span className="text-slate-400 block">Tech</span>
            <strong className="text-emerald-400">91%</strong>
          </div>
          <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
            <span className="text-slate-400 block">Solving</span>
            <strong className="text-indigo-300">86%</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
