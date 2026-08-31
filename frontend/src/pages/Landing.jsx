import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Landing = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B4D] font-sans antialiased selection:bg-[#EAF3FF] selection:text-[#0A66C2]">
      
      {/* ─── 1. NAVBAR ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E1E5EB] shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-6">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="HireAI Logo"
              className="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-extrabold text-xl text-[#172B4D] tracking-tight font-display flex items-center gap-1">
                Hire<span className="text-[#0A66C2]">AI</span>
              </span>
              <span className="text-[10px] text-[#5E6C84] font-medium tracking-wide block -mt-1">
                Talent &amp; Opportunity
              </span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center gap-8 text-[13.5px] font-semibold text-[#5E6C84]">
            <a href="#home" className="text-[#0A66C2] hover:text-[#004182] transition-colors">Home</a>
            <a href="#features" className="hover:text-[#0A66C2] transition-colors">Features</a>
            <a href="#for-candidates" className="hover:text-[#0A66C2] transition-colors">For Candidates</a>
            <a href="#for-recruiters" className="hover:text-[#0A66C2] transition-colors">For Recruiters</a>
            <a href="#how-it-works" className="hover:text-[#0A66C2] transition-colors">How It Works</a>
            <Link to="/candidate/market-intelligence" className="flex items-center gap-1 hover:text-[#0A66C2] transition-colors">
              <span>Market Intelligence</span>
              <span className="bg-[#EAF3FF] text-[#0A66C2] text-[10px] font-bold px-1.5 py-0.5 rounded-full">Live</span>
            </Link>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link
                to={user.role === 'candidate' ? '/candidate' : user.role === 'recruiter' ? '/recruiter' : '/admin'}
                className="px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs tracking-tight shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <span>Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl text-[#172B4D] hover:text-[#0A66C2] hover:bg-[#EAF3FF]/60 font-semibold text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <span>Create Account</span>
                  <span>→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── 2. HERO SECTION ─────────────────────────────────────────────────── */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EAF3FF]/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#378FE9]/30 text-[#0A66C2] text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0A66C2] animate-pulse"></span>
              <span>AI-Powered Talent Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#172B4D] leading-[1.12] tracking-tight font-display">
              Connect Skills With <br />
              <span className="text-[#0A66C2]">The Right Opportunity.</span>
            </h1>

            <p className="text-[#5E6C84] text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              An intelligent platform that helps candidates discover opportunities, improve their skills, and demonstrate their abilities while helping recruiters find the right talent faster.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="px-7 py-3.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/candidate/jobs"
                className="px-7 py-3.5 rounded-xl bg-white hover:bg-[#F7F9FC] text-[#0A66C2] border-2 border-[#0A66C2]/30 hover:border-[#0A66C2] font-bold text-sm transition-all text-center shadow-xs"
              >
                Explore Jobs
              </Link>
            </div>

            {/* Verified Metrics Counter */}
            <div className="pt-8 border-t border-[#E1E5EB] grid grid-cols-3 gap-6 text-left max-w-lg">
              <div>
                <div className="text-2xl font-extrabold text-[#172B4D] font-mono">12,400+</div>
                <div className="text-xs text-[#5E6C84] font-medium mt-0.5">Verified Candidates</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#0A66C2] font-mono">98.4%</div>
                <div className="text-xs text-[#5E6C84] font-medium mt-0.5">Matching Precision</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#057642] font-mono">320+</div>
                <div className="text-xs text-[#5E6C84] font-medium mt-0.5">Coding Challenges</div>
              </div>
            </div>

          </div>

          {/* Right Column (Human-Centered 3D Recruitment & Talent Match Illustration) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[540px] rounded-3xl overflow-hidden border border-[#E1E5EB] shadow-2xl bg-white p-2 transition-all hover:shadow-[0_20px_50px_rgba(10,102,194,0.15)] group">
              <img
                src="/images/hero-talent-collaboration.jpg"
                alt="Human Talent and Recruiter Collaboration Platform"
                className="w-full h-auto rounded-2xl object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. SECTION 2: EVERYTHING YOU NEED TO MOVE FORWARD ──────────────── */}
      <section id="features" className="py-20 bg-white border-y border-[#E1E5EB] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-bold text-[#0A66C2] uppercase tracking-wider bg-[#EAF3FF] px-3 py-1 rounded-full">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
              Everything You Need to Move Forward
            </h2>
            <p className="text-[#5E6C84] text-sm">
              From discovering opportunities to demonstrating your skills with objective, explainable technology.
            </p>
          </div>

          {/* 6 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0A66C2] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📄
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Resume Intelligence</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                spaCy NLP parses resumes, extracts technical skills and certifications, and calculates explainable ATS scores against target job specifications.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-[#004182] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Smart Job Matching</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Sentence Transformers generate semantic embeddings to automatically match candidate capabilities with active recruiter positions.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Skill Gap Analysis</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Identify missing technologies required for target positions and receive structured, curated learning roadmaps to bridge every gap.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#057642] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                💻
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Coding Assessment</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                In-browser Monaco editor with Docker containerized sandbox execution across Python, C++, Java, and JavaScript with automated test benchmarks.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🏆
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Candidate Evaluation</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Explainable multi-dimensional candidate rankings combining ATS resume score, coding accuracy, and interview evaluations for recruiters.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] hover:border-[#0A66C2]/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#B54708] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🌐
              </div>
              <h3 className="font-bold text-lg text-[#172B4D] mb-2">Career Intelligence</h3>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Daily job market telemetry analyzing language velocities, 7-day/30-day technology growth rates, and time-series demand forecasts.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 4. SECTION 3: BUILT FOR BOTH SIDES OF HIRING ──────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-bold text-[#0A66C2] uppercase tracking-wider bg-[#EAF3FF] px-3 py-1 rounded-full">
            Dual Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
            Built For Both Sides of Hiring
          </h2>
          <p className="text-[#5E6C84] text-sm">
            Empowering candidates to advance their careers and providing recruiters with verified talent data.
          </p>
        </div>

        {/* Dual Side-by-Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* For Candidates */}
          <div id="for-candidates" className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E1E5EB] shadow-sm flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-100 text-[#0A66C2] flex items-center justify-center font-bold text-xl">
                  👨‍💻
                </span>
                <div>
                  <h3 className="font-extrabold text-2xl text-[#172B4D]">For Candidates</h3>
                  <p className="text-xs text-[#5E6C84]">Discover, benchmark, and land your ideal software engineering role.</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#172B4D] font-medium">
                {[
                  'AI Resume Analysis with comprehensive ATS score breakdown',
                  'Semantic job recommendations matching your exact skillset',
                  'Skill Gap Analysis with direct curated video & tutorial roadmaps',
                  'Coding Assessment Arena with 323 LeetCode problems & live rank',
                  'AI Mock Interviews with pacing and structured technical feedback',
                  'Personalized Career Market Intelligence & high-demand skill alerts'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#0A66C2] font-bold text-sm">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs shadow-sm text-center block transition-colors"
            >
              Explore Candidate Features →
            </Link>
          </div>

          {/* For Recruiters */}
          <div id="for-recruiters" className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E1E5EB] shadow-sm flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-[#004182] flex items-center justify-center font-bold text-xl">
                  👩‍💼
                </span>
                <div>
                  <h3 className="font-extrabold text-2xl text-[#172B4D]">For Recruiters</h3>
                  <p className="text-xs text-[#5E6C84]">Screen verified candidates, manage pipelines, and make objective hires.</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#172B4D] font-medium">
                {[
                  '360° Candidate Search with instant profile picture preview',
                  'Semantic Resume-to-Job matching with explainable match scores',
                  'Multi-dimensional candidate rankings combining ATS and coding accuracy',
                  'Direct Technical Coding evaluation & submission inspection',
                  'Integrated Interview Scheduling with email reminders',
                  'Talent Market Analytics with salary benchmarks and shortage indices'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#057642] font-bold text-sm">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-xl bg-[#004182] hover:bg-[#172B4D] text-white font-bold text-xs shadow-sm text-center block transition-colors"
            >
              Explore Recruiter Features →
            </Link>
          </div>

        </div>

      </section>

      {/* ─── 5. SECTION 4: HOW IT WORKS (5-STEP PROCESS) ────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E1E5EB] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-bold text-[#0A66C2] uppercase tracking-wider bg-[#EAF3FF] px-3 py-1 rounded-full">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
              How It Works
            </h2>
            <p className="text-[#5E6C84] text-sm">
              A transparent, 5-step human-centered journey connecting candidate talent to hiring opportunities.
            </p>
          </div>

          {/* 5 Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-mono font-extrabold text-sm shadow-xs">
                01
              </div>
              <h4 className="font-bold text-base text-[#172B4D]">Create Profile</h4>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Sign up as candidate or recruiter, add profile picture, education, and technical competencies.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-mono font-extrabold text-sm shadow-xs">
                02
              </div>
              <h4 className="font-bold text-base text-[#172B4D]">Build Resume</h4>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Upload your resume for instant spaCy NLP parsing, keyword extraction, and ATS scoring.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-mono font-extrabold text-sm shadow-xs">
                03
              </div>
              <h4 className="font-bold text-base text-[#172B4D]">Discover Jobs</h4>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Search active job opportunities and view exact skill match ratios and learning guidance.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-mono font-extrabold text-sm shadow-xs">
                04
              </div>
              <h4 className="font-bold text-base text-[#172B4D]">Prove Skills</h4>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Complete containerized coding challenges and mock interviews to verify your competency.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-left space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-[#057642] text-white flex items-center justify-center font-mono font-extrabold text-sm shadow-xs">
                05
              </div>
              <h4 className="font-bold text-base text-[#172B4D]">Connect &amp; Hire</h4>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Recruiters review explainable candidate rankings, schedule interviews, and extend offers.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 6. SECTION 5: INTELLIGENCE THAT HELPS YOU GROW (MINI CHARTS) ────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-bold text-[#0A66C2] uppercase tracking-wider bg-[#EAF3FF] px-3 py-1 rounded-full">
            Verified Analytics
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
            Intelligence That Helps You Grow
          </h2>
          <p className="text-[#5E6C84] text-sm">
            Objective benchmarks, explainable AI scores, and real-time market data to guide career decisions.
          </p>
        </div>

        {/* 4 Mini Analytics Demonstration Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Widget 1: ATS Compatibility */}
          <div className="p-6 rounded-2xl bg-white border border-[#E1E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E6C84]">
              <span>ATS Resume Score</span>
              <span className="text-[#057642] font-mono">88%</span>
            </div>
            <div className="w-full bg-[#F7F9FC] h-2.5 rounded-full overflow-hidden border border-[#E1E5EB]">
              <div className="bg-[#057642] h-full rounded-full w-[88%]" />
            </div>
            <p className="text-[11px] text-[#5E6C84]">Strong ATS compatibility with high recruiter visibility.</p>
          </div>

          {/* Widget 2: Semantic Skill Match */}
          <div className="p-6 rounded-2xl bg-white border border-[#E1E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E6C84]">
              <span>Skill Match Precision</span>
              <span className="text-[#0A66C2] font-mono">92%</span>
            </div>
            <div className="w-full bg-[#F7F9FC] h-2.5 rounded-full overflow-hidden border border-[#E1E5EB]">
              <div className="bg-[#0A66C2] h-full rounded-full w-[92%]" />
            </div>
            <p className="text-[11px] text-[#5E6C84]">Direct match across Python, FastAPI, and Docker.</p>
          </div>

          {/* Widget 3: Coding Progress */}
          <div className="p-6 rounded-2xl bg-white border border-[#E1E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E6C84]">
              <span>Coding Accuracy</span>
              <span className="text-[#0A66C2] font-mono">89.5%</span>
            </div>
            <div className="w-full bg-[#F7F9FC] h-2.5 rounded-full overflow-hidden border border-[#E1E5EB]">
              <div className="bg-[#0A66C2] h-full rounded-full w-[89.5%]" />
            </div>
            <p className="text-[11px] text-[#5E6C84]">Ranked Top 10% on global candidate leaderboard.</p>
          </div>

          {/* Widget 4: Market 30d Growth */}
          <div className="p-6 rounded-2xl bg-white border border-[#E1E5EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#5E6C84]">
              <span>AI Tech Demand</span>
              <span className="text-emerald-600 font-mono font-extrabold">+45.8%</span>
            </div>
            <div className="w-full bg-[#F7F9FC] h-2.5 rounded-full overflow-hidden border border-[#E1E5EB]">
              <div className="bg-emerald-500 h-full rounded-full w-[95%]" />
            </div>
            <p className="text-[11px] text-[#5E6C84]">Rapidly Growing category in active job market.</p>
          </div>

        </div>

      </section>

      {/* ─── 7. SECTION 6: THE FUTURE OF CAREER DISCOVERY (JOURNEY) ─────────── */}
      <section className="py-20 bg-white border-y border-[#E1E5EB] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-xs font-bold text-[#0A66C2] uppercase tracking-wider bg-[#EAF3FF] px-3 py-1 rounded-full">
              Career Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
              The Future of Career Discovery
            </h2>
            <p className="text-[#5E6C84] text-sm">
              Continuous talent growth powered by actionable feedback and skill validation.
            </p>
          </div>

          {/* Linear Progression Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            
            <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-center space-y-1.5">
              <div className="text-2xl">⚡</div>
              <div className="font-bold text-sm text-[#172B4D]">Skills</div>
              <div className="text-[11px] text-[#5E6C84]">Profile verification</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-center space-y-1.5">
              <div className="text-2xl">📚</div>
              <div className="font-bold text-sm text-[#172B4D]">Learning</div>
              <div className="text-[11px] text-[#5E6C84]">Targeted tutorials</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-center space-y-1.5">
              <div className="text-2xl">💻</div>
              <div className="font-bold text-sm text-[#172B4D]">Assessment</div>
              <div className="text-[11px] text-[#5E6C84]">Live code evaluation</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E1E5EB] text-center space-y-1.5">
              <div className="text-2xl">🎯</div>
              <div className="font-bold text-sm text-[#172B4D]">Opportunity</div>
              <div className="text-[11px] text-[#5E6C84]">Matched hiring</div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-1.5">
              <div className="text-2xl">🚀</div>
              <div className="font-bold text-sm text-[#004182]">Career Growth</div>
              <div className="text-[11px] text-[#0A66C2] font-semibold">Continuous acceleration</div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 8. SECTION 7: TECHNOLOGY MEETS HUMAN POTENTIAL ─────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-[#004182] via-[#0A66C2] to-[#378FE9] p-8 sm:p-14 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white">
              Human-Centered Technology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display leading-snug">
              Technology Meets Human Potential
            </h2>
            <p className="text-white/80 text-sm leading-relaxed font-normal">
              "Technology helps us find the right match. People create the opportunity." We believe in transparent, explainable evaluations that empower candidates and help engineering teams flourish.
            </p>
          </div>

          <Link
            to="/register"
            className="px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-[#004182] font-extrabold text-sm shadow-md hover:shadow-lg transition-all shrink-0 text-center"
          >
            Join the Platform →
          </Link>
        </div>
      </section>

      {/* ─── 9. SECTION 8: READY TO FIND YOUR NEXT OPPORTUNITY? (CTA) ───────── */}
      <section className="py-20 bg-white border-t border-[#E1E5EB] px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight font-display">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-[#5E6C84] text-sm leading-relaxed max-w-xl mx-auto">
            Create your profile, discover relevant jobs, benchmark your coding ability, and showcase your verified skills to top hiring managers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Create Free Account →
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-[#F7F9FC] hover:bg-slate-100 text-[#172B4D] font-bold text-sm border border-[#E1E5EB] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 10. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#F7F9FC] border-t border-[#E1E5EB] py-14 px-6 text-xs text-[#5E6C84]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="HireAI Logo"
                className="h-8 w-auto object-contain shrink-0"
              />
              <span className="font-extrabold text-base text-[#172B4D] font-display">
                Hire<span className="text-[#0A66C2]">AI</span>
              </span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#5E6C84]">
              AI-Powered Hiring &amp; Candidate Evaluation Platform — Connecting Human Talent With The Right Opportunity.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-3">For Candidates</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li><Link to="/candidate/resumes" className="hover:text-[#0A66C2] transition-colors">Resume Analyzer &amp; ATS</Link></li>
              <li><Link to="/candidate/jobs" className="hover:text-[#0A66C2] transition-colors">Job Search &amp; Skill Matching</Link></li>
              <li><Link to="/candidate/coding" className="hover:text-[#0A66C2] transition-colors">Coding Assessment Arena</Link></li>
              <li><Link to="/candidate/aptitude" className="hover:text-[#0A66C2] transition-colors">Aptitude Assessment</Link></li>
              <li><Link to="/candidate/interview" className="hover:text-[#0A66C2] transition-colors">AI Mock Interviews</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-3">For Recruiters</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li><Link to="/recruiter/post-job" className="hover:text-[#0A66C2] transition-colors">Post Job Opening</Link></li>
              <li><Link to="/recruiter/jobs" className="hover:text-[#0A66C2] transition-colors">Manage Pipeline &amp; Candidates</Link></li>
              <li><Link to="/recruiter/rankings" className="hover:text-[#0A66C2] transition-colors">Explainable Candidate Rankings</Link></li>
              <li><Link to="/recruiter/candidates" className="hover:text-[#0A66C2] transition-colors">360° Candidate Profile Search</Link></li>
              <li><Link to="/recruiter/interviews" className="hover:text-[#0A66C2] transition-colors">Interview Management</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#172B4D] uppercase tracking-wider text-[11px] mb-3">Resources &amp; Access</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li><Link to="/candidate/market-intelligence" className="hover:text-[#0A66C2] transition-colors">Market Intelligence Hub</Link></li>
              <li><Link to="/login" className="hover:text-[#0A66C2] transition-colors">Platform Sign In</Link></li>
              <li><Link to="/register" className="hover:text-[#0A66C2] transition-colors">Create Free Account</Link></li>
              <li><Link to="/admin" className="hover:text-[#0A66C2] transition-colors">Admin Governance</Link></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#E1E5EB] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5E6C84]">
          <div>© 2026 HireAI Platform. All rights reserved.</div>
          <div className="flex gap-4 mt-2 sm:mt-0 font-mono text-[10.5px]">
            <span>spaCy NLP</span>
            <span>Sentence Transformers</span>
            <span>FastAPI</span>
            <span>Docker Sandbox</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
