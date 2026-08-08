import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/common/Navbar'

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0a0b14] text-white relative overflow-hidden">
      <Navbar />

      {/* Hero Orbs */}
      <div className="orb-primary w-[500px] h-[500px] -top-32 -left-32"></div>
      <div className="orb-accent w-[400px] h-[400px] top-1/2 -right-32"></div>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
          <span>🚀</span> Powered by Sentence Transformers & spaCy NLP
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
          Next-Gen AI Hiring & <br />
          <span className="text-gradient">Candidate Evaluation Platform</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          Transform your recruitment with NLP Resume Parsing, ATS Score Prediction, Semantic Matching, and Explainable AI Rankings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            Get Started Free
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            Live Demo Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="glass-card p-8">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="font-display font-bold text-xl mb-2">Smart Resume Parsing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Extract skills, experience, education, and projects automatically with spaCy NLP and NLTK.
            </p>
          </div>

          <div className="glass-card p-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-display font-bold text-xl mb-2">ATS Score & Quality Check</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get detailed feedback on resume formatting, keyword density, and actionable suggestions to pass ATS filters.
            </p>
          </div>

          <div className="glass-card p-8">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-display font-bold text-xl mb-2">Explainable AI Ranking</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Recruiters get instant candidate rankings with clear breakdowns explaining why each candidate received their score.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
