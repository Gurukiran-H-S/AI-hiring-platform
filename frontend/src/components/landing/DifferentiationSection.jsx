import React from 'react'

export const DifferentiationSection = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="text-center space-y-3 mb-16">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
          WHY HIREAI UNIFIED
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
          Traditional Recruitment vs. HireAIUnified
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
        {/* Traditional Recruitment */}
        <div className="glass-card p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
          <h3 className="text-base font-bold text-rose-400 font-display flex items-center gap-2">
            <span>❌</span> Traditional Hiring Process
          </h3>
          <ul className="space-y-2.5 text-slate-300">
            <li className="flex items-center gap-2"><span>•</span> Black-box resume screening with arbitrary rejections.</li>
            <li className="flex items-center gap-2"><span>•</span> No skill gap guidance or learning resources for candidates.</li>
            <li className="flex items-center gap-2"><span>•</span> Self-reported resume claims unverified until final round.</li>
            <li className="flex items-center gap-2"><span>•</span> Disconnected tools for coding, aptitude, and interviews.</li>
            <li className="flex items-center gap-2"><span>•</span> Subjective, unexplainable recruiter decision making.</li>
          </ul>
        </div>

        {/* HireAIUnified */}
        <div className="glass-card p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 backdrop-blur-xl shadow-xl shadow-emerald-500/10">
          <h3 className="text-base font-bold text-emerald-400 font-display flex items-center gap-2">
            <span>✨</span> HireAIUnified Platform
          </h3>
          <ul className="space-y-2.5 text-slate-200 font-medium">
            <li className="flex items-center gap-2 text-emerald-300"><span>✓</span> <strong>spaCy NLP & Explainable ATS</strong> formula breakdowns.</li>
            <li className="flex items-center gap-2 text-emerald-300"><span>✓</span> <strong>Low ATS Skill Gap Intelligence</strong> + YouTube tutorials.</li>
            <li className="flex items-center gap-2 text-emerald-300"><span>✓</span> <strong>Verified vs Self-Reported Skill Mapping</strong>.</li>
            <li className="flex items-center gap-2 text-emerald-300"><span>✓</span> <strong>Docker Code Sandbox + AI Mock Interview</strong>.</li>
            <li className="flex items-center gap-2 text-emerald-300"><span>✓</span> <strong>Multi-Signal Recruiter Ranking & Decision-Support</strong>.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
