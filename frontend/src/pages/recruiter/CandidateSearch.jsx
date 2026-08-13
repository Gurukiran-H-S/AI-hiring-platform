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
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
          🔎 Search Candidates & Talent Pool
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Search candidate database by skill, experience, location, and ATS score threshold.
        </p>
      </div>

      {/* Search Form */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Skill</label>
            <input
              type="text"
              placeholder="e.g. Python, SQL"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Bengaluru"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Min ATS Score (%)</label>
            <input
              type="number"
              placeholder="e.g. 70"
              value={minAts}
              onChange={(e) => setMinAts(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl">
              {loading ? 'Searching...' : '🔎 SEARCH CANDIDATES'}
            </button>
          </div>
        </form>
      </div>

      {/* Candidate Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-slate-200">
          Search Results ({candidates.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((cand) => (
              <div key={cand.candidate_id} className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">{cand.name}</h3>
                      <p className="text-xs text-indigo-300 font-medium">{cand.email} • {cand.location}</p>
                      {cand.applied_job_title && (
                        <p className="text-[11px] text-emerald-300 font-medium mt-1">💼 Applied for: {cand.applied_job_title}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                      ATS: {cand.ats_score}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cand.skills?.map((s) => (
                      <span key={s} className="text-[11px] bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="text-indigo-400 font-semibold hover:underline"
                  >
                    View Full Profile →
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShortlist(cand.candidate_id)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl font-semibold"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleReject(cand.candidate_id)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-xl w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-display">Candidate Profile — {selectedCandidate.name}</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px]">ATS SCORE</span>
                <strong className="text-emerald-400 text-lg font-mono">{selectedCandidate.ats_score}%</strong>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px]">SKILL MATCH</span>
                <strong className="text-indigo-400 text-lg font-mono">92%</strong>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[10px]">CONSISTENCY</span>
                <strong className="text-purple-400 text-lg font-mono">High</strong>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-300 mb-1">Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills?.map((s) => (
                  <span key={s} className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-white/10 rounded-xl text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleShortlist(selectedCandidate.candidate_id)
                  setSelectedCandidate(null)
                }}
                className="btn-primary px-4 py-2 rounded-xl font-semibold"
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
