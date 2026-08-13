import React from 'react'
import { Link } from 'react-router-dom'

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#060712] text-slate-400 py-12 px-6 relative z-10 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
              AI
            </div>
            <span className="font-display font-extrabold text-base text-white">
              HireAIUnified
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            AI-Powered Hiring & Candidate Evaluation Platform — From Resume Parsing to Recruiter Decision Support.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white font-display mb-3 uppercase tracking-wider text-[11px]">Candidate Portal</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/candidate/resumes" className="hover:text-white transition-colors">Resume Analyzer & ATS</Link></li>
            <li><Link to="/candidate/jobs" className="hover:text-white transition-colors">Job Search & Matching</Link></li>
            <li><Link to="/candidate/coding" className="hover:text-white transition-colors">Coding Assessment</Link></li>
            <li><Link to="/candidate/aptitude" className="hover:text-white transition-colors">Skill Gap Intelligence</Link></li>
            <li><Link to="/candidate/interview" className="hover:text-white transition-colors">AI Mock Interview</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white font-display mb-3 uppercase tracking-wider text-[11px]">Recruiter Portal</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/recruiter/jobs/create" className="hover:text-white transition-colors">Post Job Posting</Link></li>
            <li><Link to="/recruiter/jobs" className="hover:text-white transition-colors">Manage Jobs & Applications</Link></li>
            <li><Link to="/recruiter/rankings" className="hover:text-white transition-colors">Explainable Candidate Rankings</Link></li>
            <li><Link to="/recruiter/candidates" className="hover:text-white transition-colors">360° Candidate Profile Search</Link></li>
            <li><Link to="/recruiter/interviews" className="hover:text-white transition-colors">Interview Scheduler</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white font-display mb-3 uppercase tracking-wider text-[11px]">Platform Access</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/login" className="text-indigo-400 hover:underline">Candidate / Recruiter Login</Link></li>
            <li><Link to="/register" className="text-emerald-400 hover:underline">Create Free Candidate Account</Link></li>
            <li><Link to="/admin" className="text-purple-400 hover:underline">Admin System Analytics</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
        <div>© 2026 HireAIUnified. All rights reserved.</div>
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
