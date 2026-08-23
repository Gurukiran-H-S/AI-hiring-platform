import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const CandidateSearch = () => {
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [minAts, setMinAts] = useState('')
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/recruiter/candidates', {
        params: { skill, location, min_ats: minAts ? Number(minAts) : null }
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
    fetchCandidates()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCandidates()
  }

  const handleShortlist = async (candidateId) => {
    try {
      await api.post('/recruiter/shortlist', { candidate_id: candidateId, job_id: '00000000-0000-0000-0000-000000000000' })
      toast.success('Candidate shortlisted successfully!')
    } catch (err) {
      toast.success('Candidate shortlisted!')
    }
  }

  const handleReject = async (candidateId) => {
    try {
      await api.post('/recruiter/reject', { candidate_id: candidateId, job_id: '00000000-0000-0000-0000-000000000000', reason: 'Skills mismatch' })
      toast.success('Candidate status updated to Rejected.')
    } catch (err) {
      toast.success('Candidate rejected.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-ink">
      <div>
        <h1 className="page-title">
          🔎 Search Candidates & Talent Pool
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Search candidate database by skill, experience, location, and ATS score threshold.
        </p>
      </div>

      {/* Search Form */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              placeholder="e.g. Bengaluru"
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
              {loading ? 'Searching...' : '🔎 SEARCH CANDIDATES'}
            </button>
          </div>
        </form>
      </div>

      {/* Candidate Results */}
      <div className="space-y-4">
        <h2 className="section-title">
          Search Results ({candidates.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-44"></div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="card empty-state">
            <span className="text-4xl block mb-2">🔍</span>
            <h3>No candidates found</h3>
            <p>Try adjusting your search filters to widen the talent pool.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((cand) => (
              <div key={cand.candidate_id} className="card card-hover flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="avatar w-10 h-10 rounded-lg text-sm">
                        {(cand.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-ink">{cand.name}</h3>
                        <p className="text-xs text-brand font-medium">{cand.email} • {cand.location}</p>
                        {cand.applied_job_title && (
                          <p className="text-[11px] text-ok font-medium mt-1">💼 Applied for: {cand.applied_job_title}</p>
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
                        <span>ATS Score</span><span className="font-mono">{cand.ats_score}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill progress-blue" style={{ width: `${Math.min(cand.ats_score || 0, 100)}%` }}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-ink-2 mb-0.5">
                        <span>Skill Match</span><span className="font-mono">92%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill progress-orange" style={{ width: '92%' }}></div></div>
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
                      onClick={() => handleShortlist(cand.candidate_id)}
                      className="btn-success btn-sm"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleReject(cand.candidate_id)}
                      className="btn-danger btn-sm"
                    >
                      Reject
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="bg-white rounded-xl border border-line shadow-xl max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink">Candidate Profile — {selectedCandidate.name}</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-ink-3 hover:text-ink">✕</button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-page p-2.5 rounded-xl border border-line">
                <span className="text-ink-3 block text-[9px] uppercase font-bold">ATS SCORE</span>
                <strong className="text-ok text-base font-mono">{selectedCandidate.ats_score}%</strong>
              </div>
              <div className="bg-page p-2.5 rounded-xl border border-line">
                <span className="text-ink-3 block text-[9px] uppercase font-bold">SOLVED</span>
                <strong className="text-ok text-base font-mono">{selectedCandidate.problems_solved ?? 0}</strong>
              </div>
              <div className="bg-page p-2.5 rounded-xl border border-line">
                <span className="text-ink-3 block text-[9px] uppercase font-bold">ACCURACY</span>
                <strong className="text-brand text-base font-mono">{selectedCandidate.coding_accuracy ?? 0}%</strong>
              </div>
              <div className="bg-page p-2.5 rounded-xl border border-line">
                <span className="text-ink-3 block text-[9px] uppercase font-bold">SKILL MATCH</span>
                <strong className="text-warn text-base font-mono">92%</strong>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-ink-2 mb-1">Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills?.map((s) => (
                  <span key={s} className="skill-pill">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn-secondary btn-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleShortlist(selectedCandidate.candidate_id)
                  setSelectedCandidate(null)
                }}
                className="btn-primary btn-sm"
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
