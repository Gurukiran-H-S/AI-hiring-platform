import React from 'react'
import { FloatingJobCard } from './FloatingJobCard'

export const JobMatchingSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="absolute -inset-4 bg-cyan-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <FloatingJobCard />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            SEMANTIC JOB MATCHING
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent mt-4 mb-4">
            Match Candidates With the Right Opportunities
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Candidates can browse both <strong>Active Recruiter Postings</strong> and <strong>Demo Jobs</strong>. Sentence-Transformers embeddings compare candidate profiles against full job specifications to calculate high-precision relevance matches.
          </p>

          <div className="space-y-3 text-xs">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <strong className="text-white font-display block">AI / ML Engineer</strong>
                <span className="text-slate-400 text-[11px]">Required: Python, PyTorch, Docker</span>
              </div>
              <span className="text-emerald-400 font-mono font-extrabold text-sm">94% Match</span>
            </div>

            <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <strong className="text-white font-display block">Full-Stack Web Developer</strong>
                <span className="text-slate-400 text-[11px]">Required: React, FastAPI, PostgreSQL</span>
              </div>
              <span className="text-indigo-300 font-mono font-extrabold text-sm">88% Match</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
