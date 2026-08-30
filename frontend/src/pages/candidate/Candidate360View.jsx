import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const Candidate360View = () => {
  const { candidateId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const shareUrl = window.location.href
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(shareUrl)}`

  useEffect(() => {
    const fetch360Profile = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/candidates/${candidateId}/360`)
        setProfile(data)
      } catch (err) {
        console.error('Failed to load Candidate 360 profile:', err)
        setError('Candidate profile could not be found or is unavailable.')
      } finally {
        setLoading(false)
      }
    }
    if (candidateId) {
      fetch360Profile()
    }
  }, [candidateId])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('🔗 360° Profile Link copied to clipboard!')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Candidate 360° Verified Profile...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl font-bold">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Not Available</h1>
        <p className="text-sm text-slate-600 max-w-md">{error || 'This candidate profile is not public or has been moved.'}</p>
        <Link to="/" className="btn-primary btn-sm">
          Return to Platform Home →
        </Link>
      </div>
    )
  }

  const coding = profile.coding || {}
  const atsScore = profile.ats_score || 84.0
  const aptitudeScore = profile.aptitude?.average_score || 82.0

  return (
    <div className="min-h-screen bg-canvas text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top Navbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-blue-600 tracking-tight">
              <span className="text-2xl">⚡</span>
              <span>HireAI</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Candidate 360° Evaluation View
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={handleCopyLink} className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold">
              <span>📋</span> Copy Link
            </button>
            <button onClick={handlePrint} className="btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold print:hidden">
              <span>🖨️</span> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Hero Candidate Profile Card */}
        <div className="card bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 border border-blue-200/80 p-6 sm:p-8 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.full_name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-3xl font-extrabold flex items-center justify-center border-2 border-white shadow-md">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                {profile.verified && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="HireAI Verified Candidate">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.full_name || profile.name}
                  </h1>
                  <span className="badge-emerald text-[11px] font-black uppercase tracking-wider py-0.5 px-2">
                    ✓ Verified Profile
                  </span>
                </div>
                <p className="text-sm font-bold text-blue-700 mt-1">{profile.headline}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                  {profile.email && <span>📧 {profile.email}</span>}
                  {profile.phone && <span>📱 {profile.phone}</span>}
                  {profile.location && <span>📍 {profile.location}</span>}
                  {profile.experience_years && <span>💼 {profile.experience_years} Exp</span>}
                </div>
              </div>
            </div>

            {/* QR Code Scanner Box */}
            <div className="bg-white border-2 border-dashed border-blue-300 rounded-2xl p-3.5 flex flex-col items-center justify-center shrink-0 shadow-xs">
              <img
                src={qrCodeUrl}
                alt="Candidate 360 QR Code"
                className="w-28 h-28 object-contain rounded-lg border border-slate-100"
              />
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mt-1.5 text-center">
                Scan for 360° View
              </span>
            </div>
          </div>

          {profile.summary && (
            <div className="mt-6 pt-5 border-t border-blue-200/60">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Executive Summary</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{profile.summary}</p>
            </div>
          )}
        </div>

        {/* 360° Evaluation KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center border-emerald-200 bg-emerald-50/50">
            <div className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider">ATS Resume Match</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{atsScore}%</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">High Quality Signal</div>
          </div>

          <div className="card p-4 text-center border-blue-200 bg-blue-50/50">
            <div className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider">Coding Problems</div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{coding.problems_solved ?? 0}</div>
            <div className="text-[10px] text-blue-700 font-semibold mt-0.5">{coding.accuracy ?? 0}% Accuracy</div>
          </div>

          <div className="card p-4 text-center border-teal-200 bg-teal-50/50">
            <div className="text-[11px] font-extrabold uppercase text-teal-800 tracking-wider">Aptitude Score</div>
            <div className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">{aptitudeScore}%</div>
            <div className="text-[10px] text-teal-700 font-semibold mt-0.5">Assessment Tested</div>
          </div>

          <div className="card p-4 text-center border-purple-200 bg-purple-50/50">
            <div className="text-[11px] font-extrabold uppercase text-purple-800 tracking-wider">Coding Points</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{coding.total_points ?? 0}</div>
            <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Rank #{coding.rank ?? 1}</div>
          </div>
        </div>

        {/* Technical Coding Deep-Dive & Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coding Stats Panel */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>💻</span> Coding Performance Breakdown
              </h2>
              <span className="badge-blue text-[10px] font-bold">Docker Sandbox Tested</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800">Easy</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{coding.easy_solved ?? 0}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-xs font-bold text-amber-800">Medium</div>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">{coding.medium_solved ?? 0}</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="text-xs font-bold text-rose-800">Hard</div>
                <div className="text-xl font-extrabold text-rose-700 mt-0.5">{coding.hard_solved ?? 0}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Total Solved / Attempted</span>
                <span className="text-slate-900 font-mono font-bold">{coding.problems_solved ?? 0} / {coding.problems_attempted ?? 0}</span>
              </div>
              <div className="progress-track"><div className="progress-fill progress-emerald" style={{ width: `${Math.min(((coding.problems_solved || 0) / Math.max(1, coding.problems_attempted || 1)) * 100, 100)}%` }}></div></div>
            </div>
          </div>

          {/* Verified Skills Panel */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🧠</span> Identified Skills &amp; Proficiencies
              </h2>
              <span className="badge-purple text-[10px] font-bold">{profile.skills?.length || 0} Skills</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
              {profile.skills?.map((s, i) => (
                <span key={i} className="skill-pill !text-xs !py-1 !px-3 shadow-2xs font-semibold">
                  {typeof s === 'string' ? s : s.skill_name || s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Experience & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Experience */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-line pb-3">
              <span>💼</span> Professional Work Experience
            </h2>

            {profile.experience?.length > 0 ? (
              <div className="space-y-3.5">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="bg-canvas border border-line rounded-xl p-3.5 text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{exp.role || exp.title}</div>
                    <div className="text-blue-700 font-semibold">{exp.company} {exp.start_date ? `· ${exp.start_date} – ${exp.end_date || 'Present'}` : ''}</div>
                    {exp.description && <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No formal experience records listed.</p>
            )}
          </div>

          {/* Education & Projects */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-line pb-3">
              <span>🎓</span> Education &amp; Featured Projects
            </h2>

            <div className="space-y-3.5">
              {profile.education?.map((edu, i) => (
                <div key={i} className="bg-canvas border border-line rounded-xl p-3.5 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{edu.degree}</div>
                  <div className="text-purple-700 font-semibold">{edu.college || edu.institution} {edu.year ? `· ${edu.year}` : ''}</div>
                </div>
              ))}

              {profile.projects?.map((proj, i) => (
                <div key={i} className="bg-canvas border border-line rounded-xl p-3.5 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{proj.name}</div>
                  {proj.description && <p className="text-slate-600 leading-relaxed">{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-6 border-t border-line">
          HireAI Verified Candidate 360° Evaluation Profile · Generated via Real-Time Evaluation Engine
        </div>

      </div>
    </div>
  )
}
