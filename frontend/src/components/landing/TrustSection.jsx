import React from 'react'

export const TrustSection = () => {
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto border-t border-line bg-white">
      <div className="card !rounded-xl bg-canvas text-center space-y-6 !py-12">
        <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
          RESPONSIBLE & TRANSPARENT AI HIRING
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold font-display text-ink">
          Built for Responsible, Fair & Explainable Recruitment
        </h2>
        <p className="text-ink-soft text-xs md:text-sm max-w-3xl mx-auto leading-relaxed">
          HireAIUnified is designed strictly as a <strong>Recruiter Decision-Support Tool</strong>. AI evaluations serve as transparent scoring signals based on job-relevant skills, experience, and assessment performance. Final hiring and rejection decisions remain strictly with human recruiters.
        </p>
      </div>
    </section>
  )
}
