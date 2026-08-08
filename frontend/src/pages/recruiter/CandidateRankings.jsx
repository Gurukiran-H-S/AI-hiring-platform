import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const CandidateRankings = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [rankingData, setRankingData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Evaluation Weights state
  const [weights, setWeights] = useState({
    ats_weight: 0.30,
    coding_weight: 0.40,
    skill_weight: 0.20,
    interview_weight: 0.10,
  })
  const [showWeightsDrawer, setShowWeightsDrawer] = useState(false)

  // Compare & Profile Modals
  const [selectedForCompare, setSelectedForCompare] = useState([])
  const [compareResult, setCompareResult] = useState(null)
  const [profileModal, setProfileModal] = useState(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/recruiter/jobs')
        setJobs(data || [])
        if (data.length > 0) {
          setSelectedJobId(data[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchJobs()
  }, [])

  useEffect(() => {
    if (!selectedJobId) return
    fetchRankingsAndWeights()
  }, [selectedJobId])

  const fetchRankingsAndWeights = async () => {
    setLoading(true)
    try {
      const [rankRes, weightRes, analRes] = await Promise.all([
        api.get(`/recruiter/jobs/${selectedJobId}/rankings`),
        api.get(`/recruiter/jobs/${selectedJobId}/weights`),
        api.get(`/recruiter/jobs/${selectedJobId}/analytics`),
      ])
      setRankingData(rankRes.data)
      setWeights(weightRes.data)
      setAnalyticsData(analRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load candidate rankings and weights.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWeights = async () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    if (Math.abs(total - 1.0) > 0.01) {
      toast.error(`Weights must sum to 100%. Current sum: ${Math.round(total * 100)}%`)
      return
    }
    try {
      await api.put(`/recruiter/jobs/${selectedJobId}/weights`, weights)
      toast.success('Job evaluation weights updated! Recalculating candidate scores...')
      setShowWeightsDrawer(false)
      fetchRankingsAndWeights()
    } catch (err) {
      toast.error('Failed to update weights.')
    }
  }

  const handleShortlist = async (candidateId) => {
    try {
      await api.post('/recruiter/shortlist', { candidate_id: candidateId, job_id: selectedJobId })
      toast.success('Candidate shortlisted successfully!')
      fetchRankingsAndWeights()
    } catch (err) {
      toast.error('Failed to shortlist candidate.')
    }
  }

  const handleReject = async (candidateId) => {
    try {
      await api.post('/recruiter/reject', { candidate_id: candidateId, job_id: selectedJobId, reason: 'Skills mismatch' })
      toast.success('Candidate rejected.')
      fetchRankingsAndWeights()
    } catch (err) {
      toast.error('Failed to reject candidate.')
    }
  }

  const toggleCompareSelection = (candidateId) => {
    if (selectedForCompare.includes(candidateId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== candidateId))
    } else {
      if (selectedForCompare.length >= 4) {
        toast.error('You can compare a maximum of 4 candidates side-by-side.')
        return
      }
      setSelectedForCompare([...selectedForCompare, candidateId])
    }
  }

  const handleRunCompare = async () => {
    if (selectedForCompare.length < 2) {
      toast.error('Please select at least 2 candidates to compare.')
      return
    }
    try {
      const { data } = await api.post(`/recruiter/jobs/${selectedJobId}/compare`, {
        candidate_ids: selectedForCompare
      })
      setCompareResult(data.comparison)
    } catch (err) {
      toast.error('Comparison failed.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white pt-2 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            🏆 Multi-Dimensional Candidate Evaluation & AI Ranking
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Weighted Score = {Math.round(weights.ats_weight * 100)}% ATS + {Math.round(weights.coding_weight * 100)}% Coding + {Math.round(weights.skill_weight * 100)}% Skill Match + {Math.round(weights.interview_weight * 100)}% Interview.
          </p>
        </div>

        {/* Job Selector & Weight Action */}
        <div className="flex items-center gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-[#0d0e19] border border-white/15 text-xs text-white rounded-xl p-2.5 font-semibold focus:outline-none focus:border-indigo-500"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.company})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowWeightsDrawer(!showWeightsDrawer)}
            className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <span>⚙️</span> Edit Scoring Weights
          </button>
        </div>
      </div>

      {/* Configurable Job Weights Adjuster Drawer */}
      {showWeightsDrawer && (
        <div className="glass-card p-6 border border-indigo-500/40 rounded-2xl bg-indigo-500/10 space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
            <h2 className="text-sm font-bold font-display text-indigo-300">⚙️ Job Evaluation Weight Configuration</h2>
            <span className="text-xs text-slate-300 font-mono">
              Total Weight: {Math.round((weights.ats_weight + weights.coding_weight + weights.skill_weight + weights.interview_weight) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">ATS Resume Weight: {Math.round(weights.ats_weight * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.ats_weight}
                onChange={(e) => setWeights({ ...weights, ats_weight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Coding Judge Weight: {Math.round(weights.coding_weight * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.coding_weight}
                onChange={(e) => setWeights({ ...weights, coding_weight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Skill Match Weight: {Math.round(weights.skill_weight * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.skill_weight}
                onChange={(e) => setWeights({ ...weights, skill_weight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">AI Interview Weight: {Math.round(weights.interview_weight * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.interview_weight}
                onChange={(e) => setWeights({ ...weights, interview_weight: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleUpdateWeights}
              className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl"
            >
              Save & Recalculate Scores
            </button>
          </div>
        </div>
      )}

      {/* Recruiter Analytics Overview & Scatter Plot */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5 space-y-2">
            <div className="text-slate-400 text-xs font-semibold uppercase">Total Applicants</div>
            <div className="text-3xl font-extrabold font-display text-white">{analyticsData.total_applicants}</div>
            <div className="text-[11px] text-slate-400">Shortlisted: {analyticsData.shortlisted}</div>
          </div>

          <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5 space-y-2">
            <div className="text-slate-400 text-xs font-semibold uppercase">Average ATS / Coding</div>
            <div className="text-2xl font-extrabold font-display text-indigo-400">
              ATS: {analyticsData.avg_ats}% | Coding: {analyticsData.avg_coding}%
            </div>
            <div className="text-[11px] text-slate-400">Overall Average: {analyticsData.avg_overall}%</div>
          </div>

          <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5 flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Side-by-Side Comparison</div>
            <button
              onClick={handleRunCompare}
              disabled={selectedForCompare.length < 2}
              className="w-full btn-primary py-2 text-xs font-semibold rounded-xl"
            >
              Compare Selected ({selectedForCompare.length}) →
            </button>
          </div>
        </div>
      )}

      {/* Main Candidate Rankings Table */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold font-display text-white">
            Ranked Candidate Pool ({rankingData?.total_candidates || 0})
          </h2>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-mono">
            4-Signal Explainable AI Ranking Model
          </span>
        </div>

        {loading ? (
          <div className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : !rankingData || rankingData.rankings?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No applicant rankings generated for this job yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="p-3">Compare</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Overall Score</th>
                  <th className="p-3">ATS Score</th>
                  <th className="p-3">Coding</th>
                  <th className="p-3">Skill Match</th>
                  <th className="p-3">Interview</th>
                  <th className="p-3">Match Level</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {rankingData.rankings.map((r) => {
                  const isChecked = selectedForCompare.includes(r.candidate_id)
                  return (
                    <tr key={r.candidate_id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompareSelection(r.candidate_id)}
                          className="rounded bg-black border-white/20"
                        />
                      </td>
                      <td className="p-3 font-bold font-mono text-amber-400">#{r.rank}</td>
                      <td className="p-3 font-semibold text-white">
                        <div>{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="p-3 font-bold font-mono text-emerald-400 text-sm">{r.overall_score}%</td>
                      <td className="p-3 font-mono text-indigo-300">{r.ats_score}%</td>
                      <td className="p-3 font-mono text-emerald-300">{r.coding_score}%</td>
                      <td className="p-3 font-mono text-amber-300">{r.skill_match_score}%</td>
                      <td className="p-3 font-mono text-purple-300">{r.interview_score}%</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.match_level === 'Strong Match'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {r.match_level}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">{r.status}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleShortlist(r.candidate_id)}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleReject(r.candidate_id)}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {compareResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0d0e19] border border-white/20 rounded-2xl p-6 w-full max-w-5xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white font-display">⚔️ Candidate Side-by-Side Comparison</h2>
              <button onClick={() => setCompareResult(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {compareResult.map((c) => (
                <div key={c.candidate_id} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                  <div className="font-bold text-sm text-indigo-300">{c.name}</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{c.overall_score}%</div>
                  <div className="space-y-1 text-[11px] text-slate-300 pt-2 border-t border-white/10">
                    <div>ATS Score: <strong className="text-indigo-300">{c.ats_score}%</strong></div>
                    <div>Coding Judge: <strong className="text-emerald-300">{c.coding_score}%</strong></div>
                    <div>Skill Match: <strong className="text-amber-300">{c.skill_match_score}%</strong></div>
                    <div>Interview: <strong className="text-purple-300">{c.interview_score}%</strong></div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-2">
                    Matched: {c.matched_skills?.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
