import React from 'react'
import { CodingCard } from './CodingCard'
import { InterviewCard } from './InterviewCard'

export const EvaluationSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-white">
      <div className="text-center space-y-3 mb-16">
        <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
          MULTI-DIMENSIONAL CANDIDATE EVALUATION
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink">
          Empirical Coding & AI Mock Interview Assessments
        </h2>
        <p className="text-ink-soft text-sm md:text-base max-w-2xl mx-auto">
          Verify candidate claims through isolated Docker LeetCode-style coding execution and AI-powered technical interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CodingCard />
        <InterviewCard />
      </div>
    </section>
  )
}
