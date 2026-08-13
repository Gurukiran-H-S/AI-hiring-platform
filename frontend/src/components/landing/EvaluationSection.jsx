import React from 'react'
import { CodingCard } from './CodingCard'
import { InterviewCard } from './InterviewCard'

export const EvaluationSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="text-center space-y-3 mb-16">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          MULTI-DIMENSIONAL CANDIDATE EVALUATION
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-emerald-200 to-indigo-300 bg-clip-text text-transparent">
          Empirical Coding & AI Mock Interview Assessments
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Verify candidate claims through isolated Docker LeetCode-style coding execution and AI-powered technical interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <CodingCard />
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <InterviewCard />
        </div>
      </div>
    </section>
  )
}
