import React from 'react'

export const DifferentiationSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-white">
      <div className="text-center space-y-3 mb-16">
        <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
          WHY HIREAI UNIFIED
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink">
          Traditional Recruitment vs. HireAIUnified
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
        {/* Traditional Recruitment */}
        <div className="card !p-6 space-y-4 border-bad/30 bg-bad-soft/50">
          <h3 className="text-base font-bold text-bad font-display flex items-center gap-2">
            <span>❌</span> Traditional Hiring Process
          </h3>
          <ul className="space-y-2.5 text-ink-soft">
            <li className="flex items-center gap-2"><span>•</span> Black-box resume screening with arbitrary rejections.</li>
            <li className="flex items-center gap-2"><span>•</span> No skill gap guidance or learning resources for candidates.</li>
            <li className="flex items-center gap-2"><span>•</span> Self-reported resume claims unverified until final round.</li>
            <li className="flex items-center gap-2"><span>•</span> Disconnected tools for coding, aptitude, and interviews.</li>
            <li className="flex items-center gap-2"><span>•</span> Subjective, unexplainable recruiter decision making.</li>
          </ul>
        </div>

        {/* HireAIUnified */}
        <div className="card !p-6 space-y-4 border-ok/30 bg-ok-soft/50 hover-lift">
          <h3 className="text-base font-bold text-ok font-display flex items-center gap-2">
            <span>✨</span> HireAIUnified Platform
          </h3>
          <ul className="space-y-2.5 text-ink font-medium">
            <li className="flex items-center gap-2 text-ok"><span>✓</span> <strong>spaCy NLP & Explainable ATS</strong> formula breakdowns.</li>
            <li className="flex items-center gap-2 text-ok"><span>✓</span> <strong>Low ATS Skill Gap Intelligence</strong> + YouTube tutorials.</li>
            <li className="flex items-center gap-2 text-ok"><span>✓</span> <strong>Verified vs Self-Reported Skill Mapping</strong>.</li>
            <li className="flex items-center gap-2 text-ok"><span>✓</span> <strong>Docker Code Sandbox + AI Mock Interview</strong>.</li>
            <li className="flex items-center gap-2 text-ok"><span>✓</span> <strong>Multi-Signal Recruiter Ranking & Decision-Support</strong>.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
