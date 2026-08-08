import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

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
      toast.error('Failed to load interviews.')
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
      toast.error(err.response?.data?.detail || 'Failed to schedule interview.')
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
      toast.error('Failed to reschedule interview.')
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
      toast.error('Failed to cancel interview.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            📅 Interview Scheduler & Calendar Operations
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Schedule technical, HR, and managerial interviews with automated slot validation & collision detection.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          <span>➕</span> Schedule Interview
        </button>
      </div>

      {/* Calendar & Upcoming Interviews Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-slate-200">Scheduled Interviews ({interviews.length})</h2>

        {loading ? (
          <div className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
        ) : interviews.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5">
            <span className="text-4xl block mb-2">📅</span>
            <p className="text-slate-400 text-sm">No interviews scheduled yet. Click 'Schedule Interview' to add candidate slots.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviews.map((item) => (
              <div key={item.id} className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-3 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">{item.candidate_name}</h3>
                      <p className="text-xs text-indigo-300 font-medium">{item.job_title}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                      item.status === 'SCHEDULED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      item.status === 'RESCHEDULED' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      ● {item.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5 space-y-1 font-mono">
                    <div className="text-amber-300 font-bold">📅 {item.scheduled_at}</div>
                    <div className="text-slate-400">Type: {item.interview_type}</div>
                    {item.meeting_link && (
                      <a href={item.meeting_link} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline block truncate mt-1">
                        🔗 {item.meeting_link}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 text-xs">
                  <button
                    onClick={() => setInterviewToReschedule(item)}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-semibold"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setInterviewToCancel(item)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-display">Schedule Candidate Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Candidate</label>
                <select
                  value={candId}
                  onChange={(e) => setCandId(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
                >
                  {candidates.map((c) => (
                    <option key={c.candidate_id} value={c.candidate_id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Job Role</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Interview Type</label>
                  <select
                    value={itype}
                    onChange={(e) => setItype(e.target.value)}
                    className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR Round</option>
                    <option value="Managerial">Managerial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Meeting Link</label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-white/10 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl font-semibold">
                  Confirm Schedule 📅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {interviewToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-display">Reschedule Interview — {interviewToReschedule.candidate_name}</h2>
              <button onClick={() => setInterviewToReschedule(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInterviewToReschedule(null)}
                  className="px-4 py-2 bg-white/10 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl font-semibold">
                  Update Schedule 📅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {interviewToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-rose-500/30 space-y-4 text-xs">
            <h2 className="text-base font-bold text-rose-400 font-display">Cancel Interview Confirmation</h2>
            <p className="text-slate-300">
              Are you sure you want to cancel the interview for <strong className="text-white">{interviewToCancel.candidate_name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setInterviewToCancel(null)}
                className="px-4 py-2 bg-white/10 rounded-xl text-slate-300 font-semibold"
              >
                No, Keep
              </button>
              <button
                onClick={handleCancelSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl"
              >
                Yes, Cancel Interview 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
