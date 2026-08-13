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
    <section className="py-20 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/10">
      <div className="text-center space-y-3 mb-16">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
          AI & ENGINEERING STACK
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold font-display bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
          Powered by Verified Modern AI Architecture
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {techStack.map((tech) => (
          <div key={tech.name} className="glass-card p-4 text-center rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:scale-105 transition-all">
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold block mb-2">
              {tech.badge}
            </span>
            <strong className="text-white text-xs font-display block">{tech.name}</strong>
            <span className="text-[10px] text-slate-400 mt-1 block">{tech.category}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
