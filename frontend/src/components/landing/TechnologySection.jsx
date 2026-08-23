import React from 'react'

export const TechnologySection = () => {
  const techStack = [
    { name: 'spaCy NLP', category: 'NLP & Entity Parsing', badge: 'v3.7' },
    { name: 'Sentence Transformers', category: 'Semantic Match Vector', badge: 'MiniLM-L6' },
    { name: 'Docker Execution Engine', category: 'Isolated Code Sandbox', badge: 'Multi-Lang' },
    { name: 'Monaco Code Editor', category: 'LeetCode-Style IDE', badge: 'Interactive' },
    { name: 'FastAPI & PostgreSQL', category: 'High-Performance Backend', badge: 'REST API' },
    { name: 'Explainable AI Engine', category: 'Decision-Support Rules', badge: 'Transparent' },
  ]

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-line bg-canvas">
      <div className="text-center space-y-3 mb-16">
        <span className="inline-block text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand-light border border-line px-3 py-1 rounded-full">
          AI & ENGINEERING STACK
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold font-display text-ink">
          Powered by Verified Modern AI Architecture
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {techStack.map((tech) => (
          <div key={tech.name} className="card hover-lift !p-4 text-center">
            <span className="badge-primary !text-[10px] font-mono font-bold block mb-2 w-max mx-auto">
              {tech.badge}
            </span>
            <strong className="text-ink text-xs font-display block">{tech.name}</strong>
            <span className="text-[10px] text-ink-muted mt-1 block">{tech.category}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
