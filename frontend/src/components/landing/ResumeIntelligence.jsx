import React from 'react'
import { FloatingResumeCard } from './FloatingResumeCard'

export const ResumeIntelligence = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            RESUME PARSING INTELLIGENCE
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent mt-4 mb-4">
            Understand Every Candidate Beyond the Resume
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Our hybrid spaCy NLP engine parses unstructured PDF and DOCX documents in under 2 seconds. It extracts entities, normalizes variations (e.g. <em>ReactJS $\rightarrow$ React</em>), and categorizes candidate experience cleanly.
          </p>

          <div className="space-y-3">
            {[
              { label: 'spaCy Entity Recognition', desc: 'Identifies Person, Email, Phone, University, and Location.' },
              { label: 'Canonical Skill Normalization', desc: 'Map alias variations into canonical tech stack keywords.' },
              { label: 'PyMuPDF Text Extraction', desc: 'Handles formatted PDFs, multi-column layouts & Word docs.' },
              { label: 'Zero Hallucination Guarantee', desc: 'Only extracts real text present in candidate files.' },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-emerald-400 text-base">✓</span>
                <div>
                  <strong className="text-white text-xs font-bold font-display block">{f.label}</strong>
                  <span className="text-slate-400 text-[11px]">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl pointer-events-none" />
          <FloatingResumeCard />
        </div>
      </div>
    </section>
  )
}
