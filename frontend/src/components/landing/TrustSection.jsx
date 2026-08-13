import React from 'react'

export const TrustSection = () => {
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-black to-purple-950/40 border border-white/10 text-center space-y-6">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          RESPONSIBLE & TRANSPARENT AI HIRING
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold font-display text-white">
          Built for Responsible, Fair & Explainable Recruitment
        </h2>
        <p className="text-slate-400 text-xs md:text-sm max-w-3xl mx-auto leading-relaxed">
          HireAIUnified is designed strictly as a <strong>Recruiter Decision-Support Tool</strong>. AI evaluations serve as transparent scoring signals based on job-relevant skills, experience, and assessment performance. Final hiring and rejection decisions remain strictly with human recruiters.
        </p>
      </div>
    </section>
  )
}
