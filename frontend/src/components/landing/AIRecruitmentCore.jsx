import React from 'react'

export const AIRecruitmentCore = ({ mousePos = { x: 0, y: 0 } }) => {
  return (
    <div className="relative w-full max-w-md mx-auto card text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center text-3xl mx-auto">
        🤖
      </div>
      <h3 className="section-title">AI Recruitment Core</h3>
      <p className="text-xs text-ink-soft leading-relaxed">
        Resume parsing, explainable ATS scoring, semantic matching and candidate ranking — all working together.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {['📄 Resume NLP', '🎯 ATS Match', '🧠 Skill Gap', '🏆 Ranking'].map((tag) => (
          <span key={tag} className="skill-tag !text-[11px]">{tag}</span>
        ))}
      </div>
    </div>
  )
}
