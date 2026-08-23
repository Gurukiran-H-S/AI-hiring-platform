import React from 'react'
import { FloatingATSCard } from './FloatingATSCard'

export const ATSSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-canvas">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <FloatingATSCard />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
            EXPLAINABLE ATS ENGINE
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink mt-4 mb-4">
            Know How Strong a Candidate Really Is
          </h2>
          <p className="text-ink-soft text-sm md:text-base leading-relaxed mb-6">
            Unlike black-box resume filters, HireAIUnified provides an explainable weighted formula breakdown. Candidates and recruiters see exactly how every score is derived.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="card !p-3 bg-white">
              <span className="text-ink-muted block mb-1">30% Skill Match</span>
              <strong className="text-ok text-sm font-mono">Job vs Resume Skills</strong>
            </div>
            <div className="card !p-3 bg-white">
              <span className="text-ink-muted block mb-1">20% Semantic Match</span>
              <strong className="text-brand text-sm font-mono">Sentence Transformers</strong>
            </div>
            <div className="card !p-3 bg-white">
              <span className="text-ink-muted block mb-1">15% Experience Match</span>
              <strong className="text-warn text-sm font-mono">Years & Industry</strong>
            </div>
            <div className="card !p-3 bg-white">
              <span className="text-ink-muted block mb-1">10% Education & Projects</span>
              <strong className="text-brand-dark text-sm font-mono">Degrees & Portfolios</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
