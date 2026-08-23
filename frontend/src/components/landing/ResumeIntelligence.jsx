import React from 'react'
import { FloatingResumeCard } from './FloatingResumeCard'

export const ResumeIntelligence = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
            RESUME PARSING INTELLIGENCE
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink mt-4 mb-4">
            Understand Every Candidate Beyond the Resume
          </h2>
          <p className="text-ink-soft text-sm md:text-base leading-relaxed mb-6">
            Our hybrid spaCy NLP engine parses unstructured PDF and DOCX documents in under 2 seconds. It extracts entities, normalizes variations (e.g. <em>ReactJS $\rightarrow$ React</em>), and categorizes candidate experience cleanly.
          </p>

          <div className="space-y-3">
            {[
              { label: 'spaCy Entity Recognition', desc: 'Identifies Person, Email, Phone, University, and Location.' },
              { label: 'Canonical Skill Normalization', desc: 'Map alias variations into canonical tech stack keywords.' },
              { label: 'PyMuPDF Text Extraction', desc: 'Handles formatted PDFs, multi-column layouts & Word docs.' },
              { label: 'Zero Hallucination Guarantee', desc: 'Only extracts real text present in candidate files.' },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 card !p-3">
                <span className="text-ok text-base">✓</span>
                <div>
                  <strong className="text-ink text-xs font-bold font-display block">{f.label}</strong>
                  <span className="text-ink-muted text-[11px]">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <FloatingResumeCard />
        </div>
      </div>
    </section>
  )
}
