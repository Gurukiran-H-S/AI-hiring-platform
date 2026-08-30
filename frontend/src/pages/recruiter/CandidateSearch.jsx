import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const CandidateSearch = () => {
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [minAts, setMinAts] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/recruiter/jobs')
      setJobs(data || [])
    } catch (err) {
      console.error('Failed to fetch recruiter jobs:', err)
    }
  }

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/recruiter/candidates', {
        params: {
          job_id: selectedJobId || undefined,
          skill: skill.trim() || undefined,
          location: location.trim() || undefined,
          min_ats: minAts ? Number(minAts) : undefined
        }
      })
      setCandidates(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to search candidates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchCandidates()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCandidates()
  }

  const handleJobFilterChange = (e) => {
    setSelectedJobId(e.target.value)
  }

  useEffect(() => {
    fetchCandidates()
  }, [selectedJobId])

  const handleShortlist = async (candidateId, jobId) => {
    try {
      await api.post('/recruiter/shortlist', { candidate_id: candidateId, job_id: jobId })
      toast.success('Candidate shortlisted successfully!')
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidate_id === candidateId && c.job_id === jobId
            ? { ...c, application_status: 'shortlisted', is_shortlisted: true }
            : c
        )
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to shortlist candidate.')
    }
  }

  const handleReject = async (candidateId, jobId) => {
    try {
      await api.post('/recruiter/reject', {
        candidate_id: candidateId,
        job_id: jobId,
        reason: 'Skills mismatch'
      })
      toast.success('Candidate status updated to Rejected.')
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidate_id === candidateId && c.job_id === jobId
            ? { ...c, application_status: 'rejected', is_shortlisted: false }
            : c
        )
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject candidate.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-ink">
      <div>
        <h1 className="page-title">
          🔎 Search Candidates Who Applied For Your Jobs
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Review candidates who applied for your job postings, filter by specific job, skill set, location, and ATS matching threshold.
        </p>
      </div>

      {/* Search & Filter Form */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="field-label">Filter by Job Posting</label>
            <select
              value={selectedJobId}
              onChange={handleJobFilterChange}
              className="input font-medium"
            >
              <option value="">All My Posted Jobs ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.applicant_count ?? 0} applicants)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Skill</label>
            <input
              type="text"
              placeholder="e.g. Python, SQL"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="field-label">Location</label>
            <input
              type="text"
              placeholder="e.g. Remote, Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="field-label">Min ATS Score (%)</label>
            <input
              type="number"
              placeholder="e.g. 70"
              value={minAts}
              onChange={(e) => setMinAts(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button type="submit" disabled={loading} className="btn-primary w-full btn-sm">
              {loading ? 'Searching...' : '🔎 SEARCH APPLICANTS'}
            </button>
          </div>
        </form>
      </div>

      {/* Candidate Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">
            Applied Candidates ({candidates.length})
          </h2>
          {selectedJobId && (
            <button
              onClick={() => setSelectedJobId('')}
              className="text-xs text-brand font-semibold hover:underline"
            >
              Clear Job Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-44"></div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="card empty-state">
            <span className="text-4xl block mb-2">🔍</span>
            <h3>No candidate applications found</h3>
            <p>Candidates who apply for your posted job openings will appear here immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((cand) => (
              <div key={`${cand.candidate_id}-${cand.job_id || 'general'}`} className="card card-hover flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="avatar w-10 h-10 rounded-lg text-sm">
                        {(cand.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-ink">{cand.name}</h3>
                          {cand.application_status && (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              cand.application_status.toLowerCase() === 'shortlisted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              cand.application_status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' :
                              cand.application_status.toLowerCase() === 'interview' || cand.application_status.toLowerCase() === 'interview_scheduled' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {cand.application_status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand font-medium">{cand.email} • {cand.location}</p>
                        {cand.applied_job_title && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                            💼 Applied for: <span className="underline">{cand.applied_job_title}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green font-mono">
                        ATS: {cand.ats_score}%
                      </span>
                      <span className="badge badge-blue font-mono">
                        Solved: {cand.problems_solved ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cand.skills?.map((s) => (
                      <span key={s} className="skill-pill">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-ink-2 mb-0.5">
                        <span>ATS Match Score</span><span className="font-mono">{cand.ats_score}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill progress-blue" style={{ width: `${Math.min(cand.ats_score || 0, 100)}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-ink-2 mb-0.5">
                        <span>Skill Match</span><span className="font-mono">{cand.skill_match ?? 92}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill progress-orange" style={{ width: `${Math.min(cand.skill_match ?? 92, 100)}%` }}></div></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="btn-secondary btn-sm"
                  >
                    View Profile →
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShortlist(cand.candidate_id, cand.job_id)}
                      disabled={cand.application_status?.toLowerCase() === 'shortlisted'}
                      className="btn-success btn-sm disabled:opacity-50"
                    >
                      {cand.application_status?.toLowerCase() === 'shortlisted' ? '✓ Shortlisted' : 'Shortlist'}
                    </button>
                    <button
                      onClick={() => handleReject(cand.candidate_id, cand.job_id)}
                      disabled={cand.application_status?.toLowerCase() === 'rejected'}
                      className="btn-danger btn-sm disabled:opacity-50"
                    >
                      {cand.application_status?.toLowerCase() === 'rejected' ? '✗ Rejected' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-canvas border border-line rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div className="flex items-center gap-4">
                <div className="avatar w-14 h-14 text-xl">
                  {(selectedCandidate.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-ink">{selectedCandidate.name}</h2>
                  <p className="text-sm text-ink-3">{selectedCandidate.email} • {selectedCandidate.location}</p>
                  {selectedCandidate.applied_job_title && (
                    <p className="text-xs text-brand font-semibold mt-0.5">Applied for: {selectedCandidate.applied_job_title}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn-secondary btn-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-3 text-center">
                <div className="text-xs text-ink-3 font-semibold">ATS Score</div>
                <div className="text-xl font-extrabold text-brand mt-1">{selectedCandidate.ats_score}%</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-xs text-ink-3 font-semibold">Problems Solved</div>
                <div className="text-xl font-extrabold text-ok mt-1">{selectedCandidate.problems_solved ?? 0}</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-xs text-ink-3 font-semibold">Coding Accuracy</div>
                <div className="text-xl font-extrabold text-blue-600 mt-1">{selectedCandidate.coding_accuracy ?? 0}%</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-xs text-ink-3 font-semibold">Coding Rank</div>
                <div className="text-xl font-extrabold text-purple-600 mt-1">{selectedCandidate.coding_rank ?? 'N/A'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-ink text-sm mb-2">Identified Skills &amp; Proficiencies</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.skills?.map((s) => (
                  <span key={s} className="skill-pill !text-xs !py-1 !px-3">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <button
                onClick={() => {
                  handleReject(selectedCandidate.candidate_id, selectedCandidate.job_id)
                  setSelectedCandidate(null)
                }}
                className="btn-danger btn-sm"
              >
                Reject Candidate
              </button>
              <button
                onClick={() => {
                  handleShortlist(selectedCandidate.candidate_id, selectedCandidate.job_id)
                  setSelectedCandidate(null)
                }}
                className="btn-success btn-sm"
              >
                Shortlist Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
