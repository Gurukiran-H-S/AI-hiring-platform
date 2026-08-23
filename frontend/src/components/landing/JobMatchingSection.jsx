import React from 'react'
import { FloatingJobCard } from './FloatingJobCard'

export const JobMatchingSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-canvas">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <FloatingJobCard />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
            SEMANTIC JOB MATCHING
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink mt-4 mb-4">
            Match Candidates With the Right Opportunities
          </h2>
          <p className="text-ink-soft text-sm md:text-base leading-relaxed mb-6">
            Candidates can browse both <strong>Active Recruiter Postings</strong> and <strong>Demo Jobs</strong>. Sentence-Transformers embeddings compare candidate profiles against full job specifications to calculate high-precision relevance matches.
          </p>

          <div className="space-y-3 text-xs">
            <div className="card !p-3 flex items-center justify-between">
              <div>
                <strong className="text-ink font-display block">AI / ML Engineer</strong>
                <span className="text-ink-muted text-[11px]">Required: Python, PyTorch, Docker</span>
              </div>
              <span className="text-ok font-mono font-extrabold text-sm">94% Match</span>
            </div>

            <div className="card !p-3 flex items-center justify-between">
              <div>
                <strong className="text-ink font-display block">Full-Stack Web Developer</strong>
                <span className="text-ink-muted text-[11px]">Required: React, FastAPI, PostgreSQL</span>
              </div>
              <span className="text-brand font-mono font-extrabold text-sm">88% Match</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
