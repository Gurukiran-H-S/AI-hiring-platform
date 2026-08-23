import React from 'react'
import { Link } from 'react-router-dom'

export const FinalCTA = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto text-center">
      <div className="card !p-12 md:!p-16 bg-brand-dark relative overflow-hidden space-y-8 border-brand-dark">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-mono font-bold">
          ⚡ READY TO TRANSFORM HIRING?
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold font-display text-white max-w-3xl mx-auto leading-tight">
          Evaluate Candidates with Explainable AI Today
        </h2>

        <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto">
          Join candidates and recruiters using HireAIUnified for NLP resume parsing, ATS scoring, coding assessments, and AI mock interviews.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="bg-white text-brand-dark hover:bg-blue-50 text-sm px-8 py-3.5 w-full sm:w-auto font-semibold rounded-xl inline-block"
          >
            Get Started Free →
          </Link>
          <Link
            to="/login"
            className="border border-white/40 text-white hover:bg-white/10 text-sm px-8 py-3.5 w-full sm:w-auto font-semibold rounded-xl inline-block"
          >
            Access Live Portal Login
          </Link>
        </div>
      </div>
    </section>
  )
}
