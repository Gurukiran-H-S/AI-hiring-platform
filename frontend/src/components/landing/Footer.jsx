import React from 'react'
import { Link } from 'react-router-dom'

export const Footer = () => {
  return (
    <footer className="border-t border-line bg-white text-ink-2 py-12 px-6 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center font-bold text-white text-sm">
              AI
            </div>
            <span className="font-display font-extrabold text-base text-ink">
              HireAI
            </span>
          </div>
          <p className="text-ink-3 text-[11px] leading-relaxed">
            AI-Powered Hiring & Candidate Evaluation Platform — From Resume Parsing to Recruiter Decision Support.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-ink font-display mb-3 uppercase tracking-wider text-[11px]">Candidate Portal</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/candidate/resumes" className="hover:text-brand transition-colors">Resume Analyzer & ATS</Link></li>
            <li><Link to="/candidate/jobs" className="hover:text-brand transition-colors">Job Search & Matching</Link></li>
            <li><Link to="/candidate/coding" className="hover:text-brand transition-colors">Coding Assessment</Link></li>
            <li><Link to="/candidate/aptitude" className="hover:text-brand transition-colors">Skill Gap Intelligence</Link></li>
            <li><Link to="/candidate/interview" className="hover:text-brand transition-colors">AI Mock Interview</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-ink font-display mb-3 uppercase tracking-wider text-[11px]">Recruiter Portal</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/recruiter/jobs/create" className="hover:text-brand transition-colors">Post Job Posting</Link></li>
            <li><Link to="/recruiter/jobs" className="hover:text-brand transition-colors">Manage Jobs & Applications</Link></li>
            <li><Link to="/recruiter/rankings" className="hover:text-brand transition-colors">Explainable Candidate Rankings</Link></li>
            <li><Link to="/recruiter/candidates" className="hover:text-brand transition-colors">360° Candidate Profile Search</Link></li>
            <li><Link to="/recruiter/interviews" className="hover:text-brand transition-colors">Interview Scheduler</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-ink font-display mb-3 uppercase tracking-wider text-[11px]">Platform Access</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/login" className="text-brand hover:underline">Candidate / Recruiter Login</Link></li>
            <li><Link to="/register" className="text-ok hover:underline">Create Free Candidate Account</Link></li>
            <li><Link to="/admin" className="text-ink hover:underline">Admin System Analytics</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] text-ink-3">
        <div>© 2026 HireAI. All rights reserved.</div>
        <div className="flex gap-4 mt-2 sm:mt-0 font-mono">
          <span>spaCy NLP</span>
          <span>Sentence Transformers</span>
          <span>FastAPI</span>
          <span>Docker Sandbox</span>
        </div>
      </div>
    </footer>
  )
}
