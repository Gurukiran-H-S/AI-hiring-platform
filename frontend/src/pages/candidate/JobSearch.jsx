import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const JobCard = ({ job, onApply, isSaved, onSave, matchInfo, isApplied, onViewApplication }) => {
  const {
    hasCandidateSkills,
    matchedSkills = [],
    missingSkills = [],
    matchedCount = 0,
    totalRequired = (job.skills || []).length,
    matchPercent = 0
  } = matchInfo || {}

  return (
    <div className={`card card-hover flex flex-col justify-between space-y-4 p-5 ${isApplied ? 'ring-1 ring-emerald-300/80 bg-emerald-50/10' : ''}`}>
      <div>
        {/* Header: Avatar, Title, Company, Location & Dynamic Match Badge */}
        <div className="flex gap-4">
          <div className="avatar w-12 h-12 rounded-xl text-sm font-bold shrink-0 bg-blue-600 text-white flex items-center justify-center shadow-xs">
            {job.company?.slice(0, 2).toUpperCase() || 'CO'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 truncate">{job.title}</h3>
                  {isApplied && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                      ✓ Applied
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-600">{job.company}</p>
                <p className="text-[11.5px] text-slate-400 mt-0.5">📍 {job.location}</p>
              </div>

              {/* Match Badge & Count */}
              {hasCandidateSkills ? (
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 border ${
                  matchPercent >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  matchPercent >= 50 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  matchPercent > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {matchedCount}/{totalRequired} Skills Matched ({matchPercent}%)
                </span>
              ) : (
                <span className="badge-blue shrink-0 font-semibold text-xs">
                  {totalRequired} Required Skills
                </span>
              )}
            </div>

            {/* Salary & Posted date */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-2">
              {job.salary && <span className="font-mono text-emerald-700 font-bold">{job.salary}</span>}
              {job.salary && job.posted_date && <span className="text-slate-300">•</span>}
              {job.posted_date && <span>{job.posted_date}</span>}
              {job.employment_type && <span className="text-slate-300">•</span>}
              {job.employment_type && <span className="badge-gray text-[10px]">{job.employment_type}</span>}
            </div>
          </div>
        </div>

        {/* Job Description Preview */}
        {job.description && (
          <p className="text-xs text-slate-600 leading-relaxed mt-3.5 line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Required Skills Chips with Verified Match State */}
        {job.skills?.length > 0 && (
          <div className="mt-3.5 space-y-1.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Required Tech Stack:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => {
                const isMatched = matchedSkills.some(ms => ms.toLowerCase() === s.toLowerCase())
                return (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                      isMatched
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isMatched && <span className="text-emerald-600 font-bold">✓</span>}
                    <span>{s}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── SKILL GAP & LEARNING GUIDANCE (Directly Below JD) ─── */}
        {hasCandidateSkills && missingSkills.length > 0 ? (
          <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span>⚠️</span> Recommended to qualify for this job:
              </span>
              <span className="text-[11px] text-amber-800 font-semibold">{missingSkills.length} skill{missingSkills.length > 1 ? 's' : ''} to learn</span>
            </div>
            <p className="text-[11.5px] text-amber-900/80 leading-relaxed">
              Please go through these skills to get this job:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {missingSkills.map((sk) => (
                <a
                  key={sk}
                  href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(sk)}+tutorial`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs hover:border-amber-400 transition-all cursor-pointer"
                  title={`Click to learn ${sk}`}
                >
                  <span>📚 Learn {sk}</span>
                  <span className="text-[10px] text-amber-700">↗</span>
                </a>
              ))}
            </div>
          </div>
        ) : hasCandidateSkills && matchedCount === totalRequired && totalRequired > 0 ? (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <span>🎉</span> Perfect Skill Alignment! You meet all {totalRequired} required skills for this job.
            </span>
            <span className="badge-emerald font-extrabold text-[10px]">Top Candidate</span>
          </div>
        ) : (
          <div className="mt-3.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-blue-900">
              <span className="flex items-center gap-1.5">
                <span>⚡</span> Required Technical Competencies:
              </span>
            </div>
            <p className="text-[11.5px] text-blue-800 leading-relaxed">
              Please go through these skills to get this job: <strong>{job.skills?.join(', ') || 'Python, SQL'}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(job); }}
          className="btn-ghost btn-sm text-xs font-semibold cursor-pointer"
        >
          {isSaved ? '★ Saved' : '☆ Save Job'}
        </button>
        {isApplied ? (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewApplication(job); }}
            className="btn-secondary btn-sm text-xs font-bold cursor-pointer px-4 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
          >
            ✓ View Application ↗
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply(job); }}
            className="btn-primary btn-sm text-xs font-bold cursor-pointer px-4"
          >
            Apply Now →
          </button>
        )}
      </div>

    </div>
  )
}


export const JobSearch = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [jobs, setJobs] = useState([])
  const [candidateSkills, setCandidateSkills] = useState([])
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [appliedJobTitles, setAppliedJobTitles] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [providerMessage, setProviderMessage] = useState('')
  const [selectedJobForModal, setSelectedJobForModal] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const loadAppliedJobs = async () => {
    try {
      const { data } = await api.get('/applications/')
      if (Array.isArray(data)) {
        const idSet = new Set()
        const titleSet = new Set()
        data.forEach(app => {
          if (app.job_id) idSet.add(String(app.job_id))
          if (app.id) idSet.add(String(app.id))
          if (app.title) titleSet.add(app.title.toLowerCase().trim())
          if (app.job?.title) titleSet.add(app.job.title.toLowerCase().trim())
        })
        setAppliedJobIds(idSet)
        setAppliedJobTitles(titleSet)
      }
    } catch (e) {
      console.warn('Could not load applications:', e)
    }
  }

  const loadCandidateSkills = async () => {
    try {
      const allSkills = new Set()
      try {
        const profRes = await api.get('/candidate/profile')
        if (profRes.data?.skills) {
          profRes.data.skills.forEach(s => {
            if (s && s.trim()) allSkills.add(s.trim())
          })
        }
      } catch (e) {}

      try {
        const resRes = await api.get('/resumes/')
        if (Array.isArray(resRes.data)) {
          resRes.data.forEach(r => {
            if (r.parsed_skills) {
              r.parsed_skills.forEach(s => {
                if (s && s.trim()) allSkills.add(s.trim())
              })
            }
          })
        }
      } catch (e) {}

      setCandidateSkills(Array.from(allSkills))
    } catch (e) {
      console.warn('Could not load candidate skills:', e)
    }
  }

  const fetchJobs = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await api.get('/jobs/search', {
        params: { query, location, job_type: jobType, limit: 12, ...params }
      })
      setJobs(data.jobs || [])
      setProviderMessage(data.message || '')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load job listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidateSkills()
    loadAppliedJobs()
    fetchJobs()
  }, [])

  const calculateMatch = (jobSkills = [], jobTitle = '', jobDescription = '') => {
    const totalRequired = jobSkills.length

    if (!candidateSkills || candidateSkills.length === 0) {
      return {
        hasCandidateSkills: false,
        matchedSkills: [],
        missingSkills: jobSkills,
        matchedCount: 0,
        totalRequired,
        matchPercent: 0,
      }
    }

    const candLower = candidateSkills.map(s => s.toLowerCase().trim())
    const matchedSkills = []
    const missingSkills = []

    jobSkills.forEach(js => {
      const jsLower = js.toLowerCase().trim()
      if (candLower.some(cs => cs === jsLower || jsLower.includes(cs) || cs.includes(jsLower))) {
        matchedSkills.push(js)
      } else {
        missingSkills.push(js)
      }
    })

    const matchedCount = matchedSkills.length
    const matchPercent = totalRequired > 0 ? Math.round((matchedCount / totalRequired) * 100) : 0

    return {
      hasCandidateSkills: true,
      matchedSkills,
      missingSkills,
      matchedCount,
      totalRequired,
      matchPercent,
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const checkIsApplied = (job) => {
    if (!job) return false
    if (job.id && appliedJobIds.has(String(job.id))) return true
    if (job.title && appliedJobTitles.has(job.title.toLowerCase().trim())) return true
    return false
  }

  const [applyCoverLetter, setApplyCoverLetter] = useState('')
  const [submittingApply, setSubmittingApply] = useState(false)

  const handleApplyClick = (job) => {
    if (checkIsApplied(job)) {
      toast('You have already applied for this job!', { icon: 'ℹ️' })
      navigate('/candidate/applications')
      return
    }
    if (job.application_url) {
      window.open(job.application_url, '_blank')
    }
    setApplyCoverLetter(`I am excited to submit my application for the ${job.title} position at ${job.company}. My technical skills and experience align closely with your requirements.`)
    setSelectedJobForModal(job)
  }

  const confirmTrackApplication = async () => {
    if (!selectedJobForModal) return
    const isInternalJob = selectedJobForModal.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedJobForModal.id)
    setSubmittingApply(true)
    try {
      if (isInternalJob && !selectedJobForModal.application_url) {
        await api.post(`/jobs/${selectedJobForModal.id}/apply`, {
          cover_letter: applyCoverLetter || `Applied via Find Jobs portal for ${selectedJobForModal.title}`,
        })
        toast.success(`🎉 Application submitted for ${selectedJobForModal.title}!`)
      } else {
        await api.post('/applications/track-external', {
          job_id: isInternalJob ? selectedJobForModal.id : undefined,
          job_title: selectedJobForModal.title,
          company: selectedJobForModal.company,
          application_url: selectedJobForModal.application_url,
          source_job_id: selectedJobForModal.source_job_id || selectedJobForModal.id,
          notes: applyCoverLetter || `Applied via ${selectedJobForModal.source || 'Portal'}`
        })
        toast.success('Application tracked successfully!')
      }
      setSelectedJobForModal(null)
      await loadAppliedJobs()
      navigate('/candidate/applications')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit application.'
      const isAlready = typeof errorMsg === 'string' && (
        errorMsg.toLowerCase().includes('already applied') ||
        errorMsg.toLowerCase().includes('already') ||
        err.response?.status === 400
      )
      if (isAlready) {
        toast.success('You have already applied to this job!')
        setSelectedJobForModal(null)
        await loadAppliedJobs()
        navigate('/candidate/applications')
      } else {
        console.error(err)
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to submit application.')
      }
    } finally {
      setSubmittingApply(false)
    }
  }



  const toggleSaveJob = (job) => {
    if (savedJobs.some((j) => j.id === job.id)) {
      setSavedJobs(savedJobs.filter((j) => j.id !== job.id))
      toast.success(`Removed '${job.title}' from saved jobs.`)
    } else {
      setSavedJobs([...savedJobs, job])
      toast.success(`Saved '${job.title}'!`)
    }
  }

  const clearFilters = () => {
    setQuery('')
    setLocation('')
    setJobType('')
    fetchJobs({ query: '', location: '', job_type: '' })
  }

  return (
    <div className="page-enter">

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title mb-1">Find Jobs &amp; Opportunities</h1>
          <p className="text-sm text-ink-2">Discover active positions matched directly to your technical skillset.</p>
        </div>

        {candidateSkills.length === 0 && (
          <Link
            to="/candidate/resumes"
            className="btn-secondary btn-sm flex items-center gap-1.5 self-start md:self-auto text-xs"
          >
            <span>📄</span> Upload Resume to Calculate % Match
          </Link>
        )}
      </header>

      {/* Helper Banner if no skills in profile yet */}
      {candidateSkills.length === 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Personalize Match Scores:</strong> Upload your resume in the <strong>Resume Analyzer</strong> or add skills in <strong>My Profile</strong> to view your exact AI skill match counts and learning recommendations for every opening.
            </span>
          </div>
          <Link to="/candidate/profile" className="text-blue-700 underline font-bold whitespace-nowrap">
            Add Skills →
          </Link>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="card mb-6 !p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Job title, skill or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input md:col-span-1"
          />
          <input
            type="text"
            placeholder="Bengaluru / Hyderabad / Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
          />
          <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="input">
            <option value="">All Job Types</option>
            <option value="Full-time">Full Time</option>
            <option value="Part-time">Part Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Searching...' : '🔍 Search Jobs'}
          </button>
        </div>
      </form>

      {providerMessage && (
        <div className="bg-brand-light border border-brand/20 rounded-lg px-4 py-3 text-[13px] text-brand mb-6 flex items-center gap-2">
          <span>ℹ️</span> {providerMessage}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-ink">
          {jobs.length} Jobs Found
        </h2>
        {(query || location || jobType) && (
          <button onClick={clearFilters} className="text-xs text-brand hover:underline">
            Clear all filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-40"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-semibold text-ink mb-1">No jobs match your search criteria</p>
          <p className="text-xs text-ink-3">Try adjusting your keywords or clearing location filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              matchInfo={calculateMatch(job.skills, job.title, job.description)}
              isSaved={savedJobs.some((j) => j.id === job.id)}
              isApplied={checkIsApplied(job)}
              onSave={toggleSaveJob}
              onApply={handleApplyClick}
              onViewApplication={() => navigate('/candidate/applications')}
            />
          ))}
        </div>

      )}

      {/* Application Submission & Tracking Modal */}
      {selectedJobForModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedJobForModal(null); }}
        >
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="avatar w-10 h-10 rounded-xl text-xs font-bold shrink-0 bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  {selectedJobForModal.company?.slice(0, 2).toUpperCase() || 'CO'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedJobForModal.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedJobForModal.company} • 📍 {selectedJobForModal.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>


            {/* Position Summary Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">💼 Employment Type:</span>
                <span className="badge-gray text-[11px] font-bold">{selectedJobForModal.employment_type || 'Full-time'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">💰 Compensation:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedJobForModal.salary || 'Competitive'}</span>
              </div>
              {selectedJobForModal.skills?.length > 0 && (
                <div className="pt-1">
                  <span className="font-semibold text-slate-700 block mb-1">Required Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedJobForModal.skills.map(s => (
                      <span key={s} className="badge-blue text-[10.5px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cover Letter Input */}
            <div className="space-y-1.5">
              <label className="field-label flex items-center justify-between text-xs">
                <span>📝 Cover Letter / Note to Recruiter</span>
                <span className="text-[10.5px] text-slate-400 font-normal">Optional</span>
              </label>
              <textarea
                rows={4}
                value={applyCoverLetter}
                onChange={(e) => setApplyCoverLetter(e.target.value)}
                placeholder="Explain why you're a great fit for this role..."
                className="input text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                ✨ Your latest active resume, ATS score, and verified skillset will automatically be attached.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedJobForModal(null)}
                disabled={submittingApply}
                className="btn-secondary flex-1 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTrackApplication}
                disabled={submittingApply}
                className="btn-primary flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand/20"
              >
                {submittingApply ? (
                  <span>⏳ Submitting...</span>
                ) : (
                  <span>🚀 Submit Application</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
