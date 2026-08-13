import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/common/Navbar'
import { AIRecruitmentCore } from '../components/landing/AIRecruitmentCore'
import { FloatingCandidateCard } from '../components/landing/FloatingCandidateCard'
import { FloatingATSCard } from '../components/landing/FloatingATSCard'
import { FloatingResumeCard } from '../components/landing/FloatingResumeCard'
import { FloatingJobCard } from '../components/landing/FloatingJobCard'
import { SkillGapCard } from '../components/landing/SkillGapCard'
import { CodingCard } from '../components/landing/CodingCard'
import { InterviewCard } from '../components/landing/InterviewCard'
import { CandidateRankingCard } from '../components/landing/CandidateRankingCard'
import { PlatformPipeline } from '../components/landing/PlatformPipeline'
import { ResumeIntelligence } from '../components/landing/ResumeIntelligence'
import { ATSSection } from '../components/landing/ATSSection'
import { LowAtsIntelligenceSection } from '../components/landing/LowAtsIntelligenceSection'
import { JobMatchingSection } from '../components/landing/JobMatchingSection'
import { EvaluationSection } from '../components/landing/EvaluationSection'
import { RecruiterIntelligenceSection } from '../components/landing/RecruiterIntelligenceSection'
import { DifferentiationSection } from '../components/landing/DifferentiationSection'
import { TechnologySection } from '../components/landing/TechnologySection'
import { TrustSection } from '../components/landing/TrustSection'
import { FinalCTA } from '../components/landing/FinalCTA'
import { Footer } from '../components/landing/Footer'

export const Landing = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth) * 2 - 1
    const y = -(clientY / innerHeight) * 2 + 1
    setMousePos({ x, y })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#070814] text-white relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white"
    >
      <Navbar />

      {/* 3D Background Glowing Orbs */}
      <div className="orb-primary w-[600px] h-[600px] -top-40 -left-40 pointer-events-none opacity-60 animate-pulse" />
      <div className="orb-accent w-[500px] h-[500px] top-1/3 -right-40 pointer-events-none opacity-50" />
      <div className="orb-primary w-[450px] h-[450px] bottom-1/4 left-1/4 pointer-events-none opacity-40" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold tracking-wide shadow-lg shadow-indigo-500/10">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              AI-POWERED RECRUITMENT INTELLIGENCE
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-6xl leading-tight">
              Next-Gen AI Hiring & <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                Candidate Intelligence
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Transform recruitment with intelligent resume parsing, explainable ATS scoring, semantic job matching, skill-gap intelligence, coding assessments, and AI candidate rankings.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                to="/register"
                className="btn-primary text-sm px-8 py-4 w-full sm:w-auto font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                <span>🚀</span> Get Started Free
              </Link>
              <a
                href="#features"
                className="btn-secondary text-sm px-8 py-4 w-full sm:w-auto font-bold rounded-2xl text-center"
              >
                Explore Platform ↓
              </a>
            </div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 pt-2">
              <span className="text-emerald-400">✓</span> No credit card required • Enterprise Ready
            </div>
          </div>

          {/* Right Column: Interactive 3D AI Recruitment Core */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10">
              <AIRecruitmentCore mousePos={mousePos} />
            </div>
          </div>
        </div>

        {/* 3D Floating Feature Cards Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 text-left">
          <div className="transform transition-all duration-300 hover:-translate-y-2">
            <FloatingCandidateCard />
          </div>
          <div className="transform transition-all duration-300 hover:-translate-y-2">
            <FloatingATSCard />
          </div>
          <div className="transform transition-all duration-300 hover:-translate-y-2">
            <FloatingResumeCard />
          </div>
        </div>
      </section>

      {/* Main Feature & Story Sections */}
      <div id="features">
        <PlatformPipeline />
        <ResumeIntelligence />
        <ATSSection />
        <LowAtsIntelligenceSection />
        <JobMatchingSection />
        <EvaluationSection />
        <RecruiterIntelligenceSection />
        <DifferentiationSection />
        <TechnologySection />
        <TrustSection />
        <FinalCTA />
      </div>

      <Footer />
    </div>
  )
}
