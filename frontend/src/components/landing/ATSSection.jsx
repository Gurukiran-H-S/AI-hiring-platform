import React from 'react'
import { FloatingATSCard } from './FloatingATSCard'

export const ATSSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <FloatingATSCard />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            EXPLAINABLE ATS ENGINE
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent mt-4 mb-4">
            Know How Strong a Candidate Really Is
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Unlike black-box resume filters, HireAIUnified provides an explainable weighted formula breakdown. Candidates and recruiters see exactly how every score is derived.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-1">30% Skill Match</span>
              <strong className="text-emerald-400 text-sm font-mono">Job vs Resume Skills</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-1">20% Semantic Match</span>
              <strong className="text-indigo-400 text-sm font-mono">Sentence Transformers</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-1">15% Experience Match</span>
              <strong className="text-amber-400 text-sm font-mono">Years & Industry</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block mb-1">10% Education & Projects</span>
              <strong className="text-purple-400 text-sm font-mono">Degrees & Portfolios</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
