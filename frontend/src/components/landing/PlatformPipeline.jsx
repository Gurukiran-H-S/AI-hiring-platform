import React from 'react'

export const PlatformPipeline = () => {
  const steps = [
    { num: '01', title: 'Upload Resume', icon: '📄', desc: 'Candidate uploads PDF or DOCX file.' },
    { num: '02', title: 'NLP Parsing', icon: '⚡', desc: 'spaCy extracts contact info, summary, education & experience.' },
    { num: '03', title: 'Skill Extraction', icon: '🧠', desc: 'Normalizes technical & soft skills into canonical forms.' },
    { num: '04', title: 'ATS Analysis', icon: '🎯', desc: 'Calculates explainable ATS match score (30% skills, 20% semantic).' },
    { num: '05', title: 'Skill Gap Detection', icon: '⚠️', desc: 'Identifies missing job skills & triggers Low ATS alert if < 60%.' },
    { num: '06', title: 'Job Matching', icon: '🔎', desc: 'Semantic Sentence-Transformers job recommendations.' },
    { num: '07', title: 'Coding Assessment', icon: '💻', desc: 'Multi-language Docker execution with LeetCode-style judge.' },
    { num: '08', title: 'AI Mock Interview', icon: '🎙️', desc: 'Technical & situational audio/text evaluation.' },
    { num: '09', title: 'Candidate Ranking', icon: '🏆', desc: 'Recruiter decision-support dashboard with weighted overall scores.' },
    { num: '10', title: 'Hiring Decision', icon: '✅', desc: 'Recruiter shortlists, schedules interview, or offers role.' },
  ]

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center space-y-3 mb-16">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          END-TO-END INTELLIGENCE WORKFLOW
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
          From Resume to Hiring Decision — Powered by AI
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          Every candidate passes through a transparent, 10-stage AI evaluation pipeline that replaces guesswork with empirical data.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className="glass-card p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-mono font-bold text-indigo-400 opacity-60 group-hover:opacity-100">
                  {step.num}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm font-display group-hover:text-indigo-300 transition-colors">
                {step.title}
              </h3>
              <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                {step.desc}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div className="text-right text-indigo-400/40 text-xs font-mono hidden lg:block">→</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
