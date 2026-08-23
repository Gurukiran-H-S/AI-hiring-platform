import React, { useState, useEffect } from 'react'
import { api, useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/* Weight presets - every preset totals exactly 100 (spec #44) */
const PRESETS = {
  Balanced: { ats_weight: 25, coding_weight: 25, skill_weight: 25, interview_weight: 25 },
  Technical: { ats_weight: 15, coding_weight: 40, skill_weight: 30, interview_weight: 15 },
  'Software Engineering': { ats_weight: 20, coding_weight: 35, skill_weight: 30, interview_weight: 15 },
  'Interview Heavy': { ats_weight: 15, coding_weight: 20, skill_weight: 25, interview_weight: 40 },
}

const DEFAULT_WEIGHTS = { ats_weight: 20, coding_weight: 25, skill_weight: 30, interview_weight: 25 }
const totalOf = (w) => Math.round((w.ats_weight + w.coding_weight + w.skill_weight + w.interview_weight) * 100) / 100
const pct = (v) => (v == null ? '—' : `${Math.round(v * 10) / 10}%`)

const eligibilityBadge = (e) => {
  const map = {
    READY_FOR_RANKING: 'badge-success',
    PENDING_ASSESSMENT: 'badge-warning',
    INCOMPLETE: 'badge-neutral',
    NOT_ELIGIBLE: 'badge-danger',
  }
  const labels = {
    READY_FOR_RANKING: 'Ranked',
    PENDING_ASSESSMENT: 'Pending',
    INCOMPLETE: 'Incomplete',
    NOT_ELIGIBLE: 'Not Eligible',
  }
  return <span className={`badge ${map[e] || 'badge-neutral'}`}>{labels[e] || e}</span>
}

export const CandidateRankings = () => {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [rankingData, setRankingData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  /* Weights in PERCENT units - must total exactly 100 */
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS })
  const [weightDraft, setWeightDraft] = useState(null)
  const [showWeightsDrawer, setShowWeightsDrawer] = useState(false)
  const [savingWeights, setSavingWeights] = useState(false)

  const [explainModal, setExplainModal] = useState(null)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  const [compareResult, setCompareResult] = useState(null)
  const [profileModal, setProfileModal] = useState(null)

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleTarget, setScheduleTarget] = useState(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewType, setInterviewType] = useState('Technical')
  const [meetingLink, setMeetingLink] = useState('https://meet.jit.si/hireai-interview')
  const [location, setLocation] = useState('Online')
  const [interviewNotes, setInterviewNotes] = useState('Technical Round')

  const draftTotal = weightDraft ? totalOf(weightDraft) : 0
  const draftValid = weightDraft && draftTotal === 100

  const handleAutoBalance = () => {
    if (!weightDraft) return
    const currentTotal = totalOf(weightDraft)
    if (currentTotal === 0) {
      setWeightDraft({ ats_weight: 25, coding_weight: 25, skill_weight: 25, interview_weight: 25 })
      return
    }
    const diff = 100 - currentTotal
    // Distribute diff to the coding weight or balance cleanly
    const adjustedCoding = Math.max(0, Math.min(100, (weightDraft.coding_weight || 0) + diff))
    const testTotal = (weightDraft.ats_weight || 0) + adjustedCoding + (weightDraft.skill_weight || 0) + (weightDraft.interview_weight || 0)
    if (testTotal === 100) {
      setWeightDraft({ ...weightDraft, coding_weight: adjustedCoding })
    } else {
      setWeightDraft({ ats_weight: 25, coding_weight: 25, skill_weight: 25, interview_weight: 25 })
    }
    toast.success('Weights balanced to 100%')
  }

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/recruiter/jobs')
      setJobs(data)
      if (data.length > 0) setSelectedJobId((prev) => prev || data[0].id)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const fetchRankingsAndWeights = async () => {
    if (!selectedJobId) return
    setLoading(true)
    try {
      const [rankRes, weightRes, analRes] = await Promise.all([
        api.get(`/recruiter/jobs/${selectedJobId}/rankings`),
        api.get(`/recruiter/jobs/${selectedJobId}/weights`).catch(() => ({ data: null })),
        api.get(`/recruiter/jobs/${selectedJobId}/analytics`).catch(() => ({ data: null })),
      ])
      if (rankRes?.data) setRankingData(rankRes.data)
      const w = weightRes?.data
      if (w) {
        setWeights({ ats_weight: w.ats_weight, coding_weight: w.coding_weight, skill_weight: w.skill_weight, interview_weight: w.interview_weight })
      }
      if (analRes?.data) setAnalyticsData(analRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load candidate rankings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])
  useEffect(() => { if (selectedJobId) fetchRankingsAndWeights() }, [selectedJobId])

  /* ── Save & Recalculate: PUT weights (must = 100) → POST recalculate ── */
  const handleSaveAndRecalculate = async () => {
    if (!weightDraft || totalOf(weightDraft) !== 100) {
      toast.error('Weights must total exactly 100%')
      return
    }
    setSavingWeights(true)
    try {
      await api.put(`/recruiter/jobs/${selectedJobId}/weights`, weightDraft)
      await api.post(`/recruiter/jobs/${selectedJobId}/recalculate`)
      toast.success('Weights saved & scores recalculated')
      setShowWeightsDrawer(false)
      setWeightDraft(null)
      await fetchRankingsAndWeights()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      if (detail?.error) {
        toast.error(`${detail.error} (current total: ${detail.total_weight}%)`)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setSavingWeights(false)
    }
  }

  const openWeightsDrawer = () => {
    setWeightDraft({ ...weights })
    setShowWeightsDrawer(true)
  }

  const handleExplain = async (candidateId) => {
    try {
      const { data } = await api.get(`/recruiter/jobs/${selectedJobId}/candidates/${candidateId}/score-breakdown`)
      setExplainModal(data)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleStatusChange = async (applicationId, newStatusValue) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatusValue })
      toast.success('Status updated')
      fetchRankingsAndWeights()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const handleOpenScheduleModal = (candidateId, name) => {
    setScheduleTarget({ candidateId, name })
    setShowScheduleModal(true)
  }

  const handleConfirmSchedule = async (e) => {
    e.preventDefault()
    try {
      await api.post('/recruiter/interviews', {
        candidate_id: scheduleTarget.candidateId,
        job_id: selectedJobId,
        interview_type: interviewType,
        scheduled_at: new Date(interviewDate).toISOString(),
        duration_minutes: 45,
        meeting_link: meetingLink,
        location: location,
        notes: interviewNotes,
      })
      toast.success(`Interview scheduled for ${scheduleTarget.name}`)
      setShowScheduleModal(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to schedule interview')
    }
  }

  const handleShortlist = async (candidateId, name) => {
    try {
      await api.post('/recruiter/shortlist', { candidate_id: candidateId, job_id: selectedJobId })
      toast.success(`${name || 'Candidate'} shortlisted`)
      fetchRankingsAndWeights()
    } catch (err) {
      console.error(err)
      toast.error('Failed to shortlist')
    }
  }

  const handleReject = async (candidateId, name) => {
    const reason = window.prompt(`Enter rejection reason for ${name || 'candidate'}:`, 'Skills mismatch')
    if (reason === null) return
    try {
      await api.post('/recruiter/reject', { candidate_id: candidateId, job_id: selectedJobId, reason })
      toast.success('Candidate rejected')
      fetchRankingsAndWeights()
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject')
    }
  }

  const handleViewProfile = async (candidateId) => {
    try {
      const { data } = await api.get(`/recruiter/jobs/${selectedJobId}/candidates/${candidateId}`)
      setProfileModal(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load profile')
    }
  }

  const toggleCompareSelection = (candidateId) => {
    setSelectedForCompare((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    )
  }

  const handleRunCompare = async () => {
    if (selectedForCompare.length < 2) return
    try {
      const { data } = await api.post(`/recruiter/jobs/${selectedJobId}/compare`, {
        candidate_ids: selectedForCompare,
      })
      setCompareResult(data.comparison || [])
    } catch (err) {
      console.error(err)
      toast.error('Comparison failed.')
    }
  }

  const handleSliderChange = (changedKey, rawVal) => {
    const newVal = Math.max(0, Math.min(100, Math.round(Number(rawVal) / 5) * 5))
    if (!weightDraft) return

    const keys = ['ats_weight', 'coding_weight', 'skill_weight', 'interview_weight']
    const otherKeys = keys.filter((k) => k !== changedKey)
    const targetOtherSum = 100 - newVal
    const currentOtherSum = otherKeys.reduce((sum, k) => sum + (weightDraft[k] || 0), 0)

    let newDraft = { ...weightDraft, [changedKey]: newVal }

    if (targetOtherSum <= 0) {
      otherKeys.forEach((k) => { newDraft[k] = 0 })
    } else if (currentOtherSum === 0) {
      const base = Math.floor(targetOtherSum / (otherKeys.length * 5)) * 5
      const rem = targetOtherSum - (base * otherKeys.length)
      otherKeys.forEach((k, idx) => {
        newDraft[k] = base + (idx === 0 ? rem : 0)
      })
    } else {
      let allocated = 0
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          newDraft[k] = Math.max(0, targetOtherSum - allocated)
        } else {
          const ratio = (weightDraft[k] || 0) / currentOtherSum
          const val = Math.max(0, Math.round((ratio * targetOtherSum) / 5) * 5)
          newDraft[k] = val
          allocated += val
        }
      })

      const total = Object.values(newDraft).reduce((a, b) => a + b, 0)
      if (total !== 100) {
        const diff = 100 - total
        const adjustKey = otherKeys.find((k) => (newDraft[k] + diff) >= 0) || otherKeys[0]
        newDraft[adjustKey] = Math.max(0, newDraft[adjustKey] + diff)
      }
    }

    setWeightDraft(newDraft)
  }

  const sliderRow = (label, key) => (
    <div className="p-3 rounded-xl bg-white border border-line shadow-xs">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-ink">{label}</label>
        <span className="text-sm font-extrabold font-mono text-brand bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
          {weightDraft[key]}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={weightDraft[key]}
        onChange={(e) => handleSliderChange(key, e.target.value)}
        className="w-full accent-[#0A66C2] cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-ink-muted mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-page-title text-ink">Candidate Evaluation & Ranking</h1>
          <p className="text-sm text-ink-soft mt-1">
            Overall = {weights.ats_weight}% ATS + {weights.coding_weight}% Coding + {weights.skill_weight}% Skill Match + {weights.interview_weight}% Interview
            <span className="badge badge-success ml-2">= 100%</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="input !w-auto !py-2 text-xs font-semibold"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title} ({j.company})</option>
            ))}
          </select>
          <button onClick={openWeightsDrawer} className="btn-secondary btn-sm">⚙️ Scoring Weights</button>
        </div>
      </div>

      {/* Invalid weights warning (spec: never compute against != 100 silently) */}
      {rankingData && rankingData.weights_valid === false && (
        <div className="rounded-[10px] bg-warn-soft border border-warn/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <h3 className="font-semibold text-warn text-sm">Invalid Weight Configuration ({rankingData.total_weight}%)</h3>
              <p className="text-xs text-warn/90 mt-0.5">
                The saved weights for this job total {rankingData.total_weight}% (must be exactly 100%).
                Displayed scores were computed with the invalid configuration — fix the weights and recalculate.
              </p>
            </div>
          </div>
          <button onClick={openWeightsDrawer} className="btn-primary btn-sm shrink-0">Fix Weights</button>
        </div>
      )}

      {/* Weight Configuration Drawer */}
      {showWeightsDrawer && weightDraft && (
        <div className="card space-y-4 page-slide-up border-2 border-brand/20 bg-gradient-to-b from-white to-[#F7F9FC]">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="section-title !text-[16px]">Job Evaluation Weight Configuration</h2>
              <span className="text-xs text-ink-muted">Set custom evaluation weights for this job (must total exactly 100%)</span>
            </div>
            <button
              onClick={() => { setShowWeightsDrawer(false); setWeightDraft(null); }}
              className="btn-ghost btn-sm text-ink-muted hover:text-ink"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted mr-1">Presets:</span>
            {Object.entries(PRESETS).map(([name, p]) => (
              <button
                key={name}
                type="button"
                onClick={() => setWeightDraft({ ...p })}
                className="badge badge-blue hover:bg-brand hover:text-white cursor-pointer transition-colors"
              >
                {name} ({p.ats_weight}/{p.coding_weight}/{p.skill_weight}/{p.interview_weight})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {sliderRow('ATS Resume', 'ats_weight')}
            {sliderRow('Coding Assessment', 'coding_weight')}
            {sliderRow('Skill Match', 'skill_weight')}
            {sliderRow('AI Interview', 'interview_weight')}
          </div>

          {/* Total validation & Actions */}
          <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${
            draftValid ? 'bg-ok-soft border border-ok/25' : 'bg-warn-soft border border-warn/25'
          }`}>
            <div>
              <div className="text-sm font-bold text-ink flex items-center gap-2">
                <span>Total Weight:</span>
                <span className={`font-mono text-base font-extrabold ${draftValid ? 'text-ok' : 'text-warn'}`}>
                  {draftTotal}%
                </span>
                {!draftValid && (
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="btn-secondary btn-sm !py-0.5 !px-2 !text-xs text-brand font-semibold shadow-xs"
                    title="Automatically adjust remaining sliders to reach 100%"
                  >
                    ⚡ Auto-Balance to 100%
                  </button>
                )}
              </div>
              <div className={`text-xs mt-0.5 ${draftValid ? 'text-ok font-semibold' : 'text-warn'}`}>
                {draftValid
                  ? '✓ Valid 100% Configuration — Ready to Save & Recalculate'
                  : draftTotal < 100
                    ? `⚠ Remaining: ${100 - draftTotal}% needed to reach 100%. Click Auto-Balance or adjust sliders.`
                    : `⚠ Exceeded by ${draftTotal - 100}%. Must total exactly 100%.`}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => { setShowWeightsDrawer(false); setWeightDraft(null); }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAndRecalculate}
                disabled={!draftValid || savingWeights}
                className={`btn-primary btn-sm ${!draftValid || savingWeights ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingWeights ? 'Recalculating...' : 'Save & Recalculate Scores'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats: Total Applicants / Ranked / Pending / Averages */}
      {rankingData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="card space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Total Applicants</div>
            <div className="text-3xl font-bold text-ink">{rankingData.total_applicants ?? 0}</div>
            <div className="text-[11px] text-ink-muted">All applications for this job</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Ranked Candidates</div>
            <div className="text-3xl font-bold text-ok">
              {rankingData.ranked_candidates ?? rankingData.rankings?.length ?? 0}
              <span className="text-base text-ink-muted font-semibold"> of {rankingData.total_applicants ?? 0}</span>
            </div>
            <div className="text-[11px] text-ink-muted">Fully evaluated & ready for ranking</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Pending Evaluation</div>
            <div className="text-3xl font-bold text-warn">{rankingData.pending_candidates ?? 0}</div>
            <div className="text-[11px] text-ink-muted">Missing ATS / coding / interview data</div>
          </div>
          <div className="card space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Average Evaluation Scores</div>
            <div className="text-sm font-bold font-mono text-brand space-x-2">
              <span>ATS: {pct(rankingData.average_ats)}</span>
              <span>·</span>
              <span>Coding: {pct(rankingData.average_coding)}</span>
            </div>
            <div className="text-[11px] text-ink-muted">Average Final Score: <strong className="text-ink">{pct(rankingData.average_overall)}</strong></div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-wrap gap-2">
          <h2 className="section-title">
            Ranked Candidates ({rankingData?.ranked_candidates ?? rankingData?.rankings?.length ?? 0} of {rankingData?.total_applicants ?? 0})
          </h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-blue">Deterministic Weighted Ranking</span>
            <button
              onClick={handleRunCompare}
              disabled={selectedForCompare.length < 2}
              className={`btn-secondary btn-sm ${selectedForCompare.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Compare Selected ({selectedForCompare.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12" />)}
          </div>
        ) : !rankingData || rankingData.rankings?.length === 0 ? (
          <div className="empty-state">
            <h3>No Applicants Yet</h3>
            <p>Candidates who apply to this job will appear here.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Solved</th>
                  <th>Points</th>
                  <th>Accuracy</th>
                  <th>Overall</th>
                  <th>ATS</th>
                  <th>Skill Match</th>
                  <th>Coding</th>
                  <th>Interview</th>
                  <th>Match Level</th>
                  <th>Eligibility</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.rankings.map((r) => {
                  const cd = r.coding_display || {}
                  const comp = (key) => r.contributions?.[key]
                  return (
                    <tr key={r.candidate_id} className={r.rank <= 3 ? 'row-highlight' : ''}>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold ${
                          r.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          r.rank === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                          r.rank === 3 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                          'font-semibold text-slate-700'
                        }`}>
                          #{r.rank}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewProfile(r.candidate_id)}
                          className="text-left font-semibold text-ink hover:text-brand hover:underline cursor-pointer"
                        >
                          {r.name}
                        </button>
                        <div className="text-[11px] text-ink-faint">{r.email}</div>
                      </td>
                      <td><span className="font-mono text-xs font-semibold">{cd.problems_solved ?? 0}</span></td>
                      <td><span className="font-mono text-xs font-semibold">{cd.points ?? cd.total_points ?? 0}</span></td>
                      <td><span className="font-mono text-xs font-semibold">{cd.accuracy != null ? `${cd.accuracy}%` : '0%'}</span></td>
                      <td>
                        <strong className={`font-mono text-sm ${
                          (r.overall_score || 0) >= 80 ? 'text-ok' :
                          (r.overall_score || 0) >= 60 ? 'text-brand' :
                          (r.overall_score || 0) >= 40 ? 'text-warn' : 'text-bad'
                        }`}>
                          {pct(r.overall_score)}
                        </strong>
                        {r.is_partial && (
                          <div className="text-[9px] text-warn font-semibold" title={`Only ${r.used_weight}% of weights had data`}>PARTIAL</div>
                        )}
                      </td>
                      <td>
                        {r.ats?.score != null
                          ? <span className="font-mono text-xs" title={r.ats.label}>{r.ats.score}%</span>
                          : <span className="badge badge-warning !text-[9px] !px-1.5">Pending</span>}
                      </td>
                      <td><span className="font-mono text-xs">{r.skill?.score != null ? `${r.skill.score}%` : '—'}</span></td>
                      <td><span className="font-mono text-xs">{r.coding?.score != null ? `${r.coding.score}%` : '—'}</span></td>
                      <td>
                        {r.interview?.score != null
                          ? <span className="font-mono text-xs">{r.interview.score}%</span>
                          : <span className="badge badge-neutral !text-[9px] !px-1.5">Not attempted</span>}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.match_level === 'Excellent Match' || r.match_level === 'Strong Match' ? 'badge-success' :
                          r.match_level === 'Potential Match' ? 'badge-primary' :
                          r.match_level === 'Moderate Match' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {r.match_level || '—'}
                        </span>
                      </td>
                      <td>{eligibilityBadge(r.eligibility)}</td>
                      <td>
                        <select
                          value={r.status?.toLowerCase() || 'applied'}
                          onChange={(e) => handleStatusChange(r.application_id, e.target.value)}
                          className="input !py-1 !px-2 !text-[11px] !w-auto cursor-pointer"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="application_viewed">Viewed</option>
                          <option value="screening">Screening</option>
                          <option value="assessment">Assessment</option>
                          <option value="interview">Interview</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={selectedForCompare.includes(r.candidate_id)}
                            onChange={() => toggleCompareSelection(r.candidate_id)}
                            title="Select for comparison"
                            className="accent-[#0A66C2] cursor-pointer"
                          />
                          <button
                            onClick={() => handleExplain(r.candidate_id)}
                            className="btn-secondary btn-sm !py-1 !px-2 !text-[11px]"
                            title="Explain Score"
                          >
                            Explain
                          </button>
                          <button
                            onClick={() => handleViewProfile(r.candidate_id)}
                            className="btn-secondary btn-sm !py-1 !px-2 !text-[11px]"
                            title="View 360° Candidate Profile"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleOpenScheduleModal(r.candidate_id, r.name)}
                            className="btn-secondary btn-sm !py-1 !px-2 !text-[11px]"
                            title="Schedule Interview"
                          >
                            📅
                          </button>
                          <button onClick={() => handleShortlist(r.candidate_id, r.name)} className="btn-success btn-sm !py-1 !px-2 !text-[11px]">
                            Shortlist
                          </button>
                          <button onClick={() => handleReject(r.candidate_id, r.name)} className="btn-danger btn-sm !py-1 !px-2 !text-[11px]">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explain Score Modal */}
      {explainModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={() => setExplainModal(null)}>
          <div className="card !p-6 w-full max-w-lg space-y-4 page-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="section-title !text-[16px]">Why ranked #{explainModal.rank || '—'}?</h2>
                <p className="text-xs text-ink-muted">{explainModal.candidate_name}</p>
              </div>
              <button onClick={() => setExplainModal(null)} className="btn-ghost btn-sm">✕</button>
            </div>

            {(['ats', 'coding', 'skill', 'interview']).map((key) => {
              const c = explainModal.contributions?.[key]
              if (!c) return null
              const labels = { ats: 'ATS Resume', coding: 'Coding', skill: 'Skill Match', interview: 'AI Interview' }
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink-soft">{labels[key]}</span>
                    <span className="font-mono text-xs text-ink">
                      {c.score != null ? `${c.score}% × ${c.weight}% = ` : 'no data × '}
                      <strong>{c.contribution ?? 0}</strong>
                    </span>
                  </div>
                  <div className="progress-bar !h-1.5">
                    <div className="progress-fill" style={{ width: `${c.score || 0}%` }} />
                  </div>
                </div>
              )
            })}

            <div className="border-t border-line pt-3 flex items-center justify-between">
              <span className="font-semibold text-ink">Final Score</span>
              <span className="text-2xl font-bold text-brand font-mono">{pct(explainModal.overall_score)}</span>
            </div>
            {explainModal.is_partial && (
              <div className="bg-warn-soft border border-warn/25 rounded-lg p-2.5 text-xs text-warn">
                Partial score: only {explainModal.used_weight}% of weights had data. Missing components are pending, not zero.
              </div>
            )}
            {explainModal.explanation?.length > 0 && (
              <div className="bg-canvas border border-line rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold text-ink mb-1">This candidate ranks #{explainModal.rank} because:</div>
                {explainModal.explanation.map((r, i) => <div key={i} className="text-ink-soft">✓ {r}</div>)}
              </div>
            )}
            <div className="text-[11px] text-ink-faint">
              Note: ATS measures resume quality/keyword fit; Skill Match separately measures overlap with this job's required skills. Calculated {explainModal.calculated_at ? new Date(explainModal.calculated_at).toLocaleString() : ''}.
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={() => setCompareResult(null)}>
          <div className="card !p-6 w-full max-w-5xl space-y-4 page-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="section-title">Candidate Side-by-Side Comparison</h2>
              <button onClick={() => setCompareResult(null)} className="btn-ghost btn-sm">✕</button>
            </div>
            <div className={`grid gap-4 text-xs ${compareResult.length === 2 ? 'grid-cols-2' : compareResult.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {compareResult.map((c) => (
                <div key={c.candidate_id} className="bg-canvas border border-line p-4 rounded-[10px] space-y-2">
                  <div className="font-semibold text-sm text-brand truncate">{c.name}</div>
                  <div className="text-xl font-bold font-mono text-ok">{pct(c.overall_score)}</div>
                  {c.is_partial && <span className="badge badge-warning !text-[9px]">Partial data</span>}
                  <div className="space-y-1 text-[11px] text-ink-soft pt-2 border-t border-line">
                    <div className="flex justify-between"><span>ATS</span><strong className="text-ink font-mono">{pct(c.ats_score)}</strong></div>
                    <div className="flex justify-between"><span>Skill Match</span><strong className="text-ink font-mono">{pct(c.skill_match_score)}</strong></div>
                    <div className="flex justify-between"><span>Coding</span><strong className="text-ink font-mono">{pct(c.coding_score)}</strong></div>
                    <div className="flex justify-between"><span>Interview</span><strong className="text-ink font-mono">{pct(c.interview_score)}</strong></div>
                  </div>
                  <div className="text-[10px] text-ink-muted pt-2 border-t border-line">
                    Matched: {c.matched_skills?.join(', ') || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && scheduleTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="card !p-6 w-full max-w-lg space-y-4 page-slide-up">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="section-title !text-[16px]">Schedule Interview — {scheduleTarget.name}</h2>
              <button onClick={() => setShowScheduleModal(false)} className="btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={handleConfirmSchedule} className="space-y-4 text-xs">
              <div>
                <label className="field-label">Interview Date & Time *</label>
                <input type="datetime-local" required value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Interview Round Type</label>
                <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="input">
                  <option value="Technical">Technical Round</option>
                  <option value="HR">HR Round</option>
                  <option value="Coding">AI Coding Assessment</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>
              <div>
                <label className="field-label">Meeting Link</label>
                <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Notes</label>
                <textarea rows={2} value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} className="input resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn-primary btn-sm">Schedule Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360° Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={() => setProfileModal(null)}>
          <div className="card !p-6 w-full max-w-2xl space-y-4 page-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <div className="avatar w-12 h-12 !rounded-lg">{profileModal.full_name?.charAt(0)?.toUpperCase() || 'C'}</div>
                <div>
                  <h2 className="section-title !text-[16px]">{profileModal.full_name}</h2>
                  <p className="text-xs text-ink-muted">{profileModal.email} · {profileModal.location || '—'}</p>
                </div>
              </div>
              <button onClick={() => setProfileModal(null)} className="btn-ghost btn-sm">✕</button>
            </div>

            {profileModal.evaluation && (
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  ['Overall', profileModal.evaluation.overall_score],
                  ['ATS', profileModal.evaluation.ats_score],
                  ['Skill', profileModal.evaluation.skill_match_score],
                  ['Coding', profileModal.evaluation.coding_score],
                  ['Interview', profileModal.evaluation.interview_score],
                ].map(([label, val]) => (
                  <div key={label} className="bg-canvas border border-line rounded-lg p-2.5">
                    <div className="text-[10px] uppercase font-semibold text-ink-muted">{label}</div>
                    <div className="text-base font-bold font-mono text-ink">{val != null ? `${val}%` : '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {profileModal.skills?.length > 0 && (
              <div>
                <h3 className="field-label">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profileModal.skills.map((s) => <span key={s} className="skill-tag">{typeof s === 'string' ? s : s.skill_name}</span>)}
                </div>
              </div>
            )}

            {profileModal.experience?.length > 0 && (
              <div>
                <h3 className="field-label">Experience</h3>
                <div className="space-y-2">
                  {profileModal.experience.map((exp, i) => (
                    <div key={i} className="bg-canvas border border-line rounded-lg p-3 text-xs">
                      <div className="font-semibold text-ink">{exp.role || exp.title}</div>
                      <div className="text-ink-soft">{exp.company} {exp.start_date ? `· ${exp.start_date} – ${exp.end_date || 'Present'}` : ''}</div>
                      {exp.description && <div className="text-ink-muted mt-1">{exp.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileModal.education?.length > 0 && (
              <div>
                <h3 className="field-label">Education</h3>
                <div className="space-y-2">
                  {profileModal.education.map((edu, i) => (
                    <div key={i} className="bg-canvas border border-line rounded-lg p-3 text-xs">
                      <div className="font-semibold text-ink">{edu.degree}</div>
                      <div className="text-ink-soft">{edu.college || edu.institution} {edu.year ? `· ${edu.year}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileModal.projects?.length > 0 && (
              <div>
                <h3 className="field-label">Projects</h3>
                <div className="space-y-2">
                  {profileModal.projects.map((p, i) => (
                    <div key={i} className="bg-canvas border border-line rounded-lg p-3 text-xs">
                      <div className="font-semibold text-ink">{p.name}</div>
                      {p.description && <div className="text-ink-soft mt-0.5">{p.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}