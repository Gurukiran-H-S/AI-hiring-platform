import React from 'react'
import { Link } from 'react-router-dom'

export const FinalCTA = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 text-center">
      <div className="glass-card p-12 md:p-16 rounded-3xl bg-gradient-to-tr from-indigo-900/30 via-[#0a0b1e] to-purple-900/30 border border-indigo-500/30 backdrop-blur-2xl relative overflow-hidden shadow-2xl space-y-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
          ⚡ READY TO TRANSFORM HIRING?
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-200 to-emerald-300 bg-clip-text text-transparent max-w-3xl mx-auto leading-tight">
          Evaluate Candidates with Explainable AI Today
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Join candidates and recruiters using HireAIUnified for NLP resume parsing, ATS scoring, coding assessments, and AI mock interviews.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="btn-primary text-sm px-8 py-4 w-full sm:w-auto font-bold rounded-2xl shadow-xl shadow-indigo-500/25"
          >
            Get Started Free →
          </Link>
          <Link
            to="/login"
            className="btn-secondary text-sm px-8 py-4 w-full sm:w-auto font-bold rounded-2xl"
          >
            Access Live Portal Login
          </Link>
        </div>
      </div>
    </section>
  )
}
