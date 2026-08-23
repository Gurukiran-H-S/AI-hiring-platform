import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const statusBadge = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'scheduled') return 'badge-success font-bold'
  if (s === 'rescheduled') return 'badge-primary font-bold'
  if (s === 'completed') return 'badge-emerald font-bold'
  if (s === 'cancelled') return 'badge-danger font-bold'
  return 'badge-neutral'
}

export const InterviewScheduler = () => {
  const [interviews, setInterviews] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [interviewToReschedule, setInterviewToReschedule] = useState(null)
  const [interviewToCancel, setInterviewToCancel] = useState(null)

  // Schedule Form State
  const [candId, setCandId] = useState('')
  const [jobId, setJobId] = useState('')
  const [itype, setItype] = useState('Technical')
  const [scheduledAt, setScheduledAt] = useState('')
  const [meetingLink, setMeetingLink] = useState('https://meet.jit.si/hireai-interview')

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/recruiter/interviews')
      setInterviews(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterviews()
    // Load candidates & jobs for select dropdowns
    const loadDropdownData = async () => {
      try {
        const [cRes, jRes] = await Promise.all([
          api.get('/recruiter/candidates'),
          api.get('/recruiter/jobs')
        ])
        setCandidates(cRes.data || [])
        setJobs(jRes.data || [])
        if (cRes.data.length > 0) setCandId(cRes.data[0].candidate_id)
        if (jRes.data.length > 0) setJobId(jRes.data[0].id)
      } catch (err) {
        console.error(err)
      }
    }
    loadDropdownData()
  }, [])

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (!scheduledAt) return toast.error('Please select interview date and time.')

    try {
      await api.post('/recruiter/interviews', {
        candidate_id: candId,
        job_id: jobId,
        interview_type: itype,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: 45,
        meeting_link: meetingLink,
      })
      toast.success('Interview scheduled successfully! Email notification dispatched.')
      setShowScheduleModal(false)
      fetchInterviews()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong. Please try again.')
    }
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    if (!interviewToReschedule || !scheduledAt) return

    try {
      await api.put(`/recruiter/interviews/${interviewToReschedule.id}`, {
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: 45,
        meeting_link: meetingLink,
      })
      toast.success('Interview rescheduled successfully!')
      setInterviewToReschedule(null)
      fetchInterviews()
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const handleCancelSubmit = async () => {
    if (!interviewToCancel) return
    try {
      await api.delete(`/recruiter/interviews/${interviewToCancel.id}`)
      toast.success('Interview cancelled successfully.')
      setInterviewToCancel(null)
      fetchInterviews()
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title text-ink">Interview Scheduler</h1>
          <p className="text-sm text-ink-soft mt-1">
            Schedule technical, HR, and managerial interviews with automated slot validation &amp; collision detection.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="btn-primary btn-sm"
        >
          + Schedule Interview
        </button>
      </header>

      {/* Scheduled Interviews */}
      <div className="space-y-4">
        <h2 className="section-title">Scheduled Interviews ({interviews.length})</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-44"></div>
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="card py-16 text-center">
            <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-light flex items-center justify-center">
              <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </span>
            <h3 className="font-semibold text-ink mb-1">No Interviews Scheduled Yet</h3>
            <p className="text-sm text-ink-muted mb-5 max-w-xs mx-auto">
              Click 'Schedule Interview' to add candidate slots to your calendar.
            </p>
            <button onClick={() => setShowScheduleModal(true)} className="btn-primary">
              Schedule Interview
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {interviews.map((item) => (
              <div key={item.id} className="card hover-lift space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="avatar w-10 h-10 text-sm shrink-0">{item.candidate_name?.charAt(0)?.toUpperCase() || 'C'}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink truncate">{item.candidate_name}</h3>
                        <p className="text-xs text-ink-muted truncate">{item.job_title}</p>
                      </div>
                    </div>
                    <span className={`badge ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3 bg-canvas border border-line-soft rounded-lg p-3 space-y-1 text-xs">
                    <div className="text-warn font-semibold">{item.scheduled_at}</div>
                    <div className="text-ink-muted">Type: {item.interview_type}</div>
                    {item.meeting_link && (
                      <a href={item.meeting_link} target="_blank" rel="noreferrer" className="text-brand hover:underline block truncate mt-1">
                        {item.meeting_link}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line-soft">
                  <button
                    onClick={() => setInterviewToReschedule(item)}
                    className="btn-secondary btn-sm"
                  >
                    Reschedule
                  </button>
                  {item.status?.toLowerCase() === 'cancelled' ? (
                    <span className="badge badge-danger text-xs font-bold py-1 px-2.5 uppercase">
                      Cancelled
                    </span>
                  ) : (
                    <button
                      onClick={() => setInterviewToCancel(item)}
                      className="btn-danger btn-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="card !p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="section-title">Schedule Candidate Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Select Candidate</label>
                <select
                  value={candId}
                  onChange={(e) => setCandId(e.target.value)}
                  className="input"
                >
                  {candidates.map((c) => (
                    <option key={c.candidate_id} value={c.candidate_id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Select Job Role</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="input"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Interview Type</label>
                  <select
                    value={itype}
                    onChange={(e) => setItype(e.target.value)}
                    className="input"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR Round</option>
                    <option value="Managerial">Managerial</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Meeting Link</label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {interviewToReschedule && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="card !p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="section-title">Reschedule Interview — {interviewToReschedule.candidate_name}</h2>
              <button onClick={() => setInterviewToReschedule(null)} className="btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="field-label">New Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInterviewToReschedule(null)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {interviewToCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h2 className="section-title text-bad">Cancel Interview Confirmation</h2>
            <p className="text-sm text-ink-soft">
              Are you sure you want to cancel the interview for <strong className="text-ink">{interviewToCancel.candidate_name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setInterviewToCancel(null)}
                className="btn-secondary btn-sm"
              >
                No, Keep
              </button>
              <button
                onClick={handleCancelSubmit}
                className="btn-danger btn-sm"
              >
                Yes, Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
