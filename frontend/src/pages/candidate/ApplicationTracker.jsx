import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/* Pipeline stages for the visual tracker */
const STAGES = ['Applied', 'Under Review', 'Shortlisted', 'Assessment', 'Interview', 'Selected']

const stageIndex = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'rejected') return -1
  if (['applied', 'submitted'].includes(s)) return 0
  if (['under_review', 'review', 'screening'].includes(s)) return 1
  if (['shortlisted'].includes(s)) return 2
  if (['assessment', 'test'].includes(s)) return 3
  if (['interview', 'interview_scheduled'].includes(s)) return 4
  if (['selected', 'hired', 'offer'].includes(s)) return 5
  return 0
}

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (['selected', 'hired', 'offer'].includes(s)) return 'badge-emerald font-bold'
  if (['shortlisted'].includes(s)) return 'badge-purple font-bold'
  if (['interview', 'interview_scheduled'].includes(s)) return 'badge-amber font-bold'
  if (['assessment', 'test'].includes(s)) return 'badge-teal font-bold'
  if (['under_review', 'review', 'screening'].includes(s)) return 'badge-indigo font-bold'
  if (s === 'rejected') return 'badge-rose font-bold'
  if (s) return 'badge-blue font-bold'
  return 'badge-gray'
}

export const ApplicationTracker = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications/')
      setApplications(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application record?')) return
    try {
      await api.delete(`/applications/${appId}`)
      toast.success('Application deleted successfully!')
      fetchApplications()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="space-y-6 pb-12">

      <header>
        <h1 className="text-page-title text-ink">Application Tracker</h1>
        <p className="text-sm text-ink-soft mt-1">Track application progress across your active applications.</p>
      </header>

      {/* Stage pipeline legend */}
      <div className="card !p-4">
        <div className="flex items-center flex-wrap gap-y-2">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              <span className={`badge ${i === 0 ? 'badge-primary' : 'badge-neutral'}`}>{stage}</span>
              {i < STAGES.length - 1 && (
                <span className="text-ink-faint mx-1.5 text-xs shrink-0">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-40 rounded-[10px]"></div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card py-16 text-center">
          <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-light flex items-center justify-center">
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <h3 className="font-semibold text-ink mb-1">No Applications Yet</h3>
          <p className="text-sm text-ink-muted mb-5 max-w-xs mx-auto">Start applying for jobs to track your applications.</p>
          <Link to="/candidate/jobs" className="btn-primary">Find Jobs</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {applications.map((app) => {
            const idx = stageIndex(app.status)
            const rejected = idx === -1
            return (
              <div key={app.id} className="card">

                {/* Card header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-line">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] text-ink">{app.job_title}</h3>
                    <p className="text-[13px] text-ink-soft mt-0.5">{app.company}</p>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-2.5 text-xs text-ink-muted">
                      <span>Job: <strong className="text-ink font-medium">{app.job_title}</strong></span>
                      <span>Company: <strong className="text-ink font-medium">{app.company}</strong></span>
                      <span>Applied Date: <strong className="text-ink font-medium">{app.applied_at}</strong></span>
                      <span className="flex items-center gap-1.5">
                        Current Status:
                        <span className={`badge ${rejected ? 'badge-danger' : statusBadgeClass(app.status)} uppercase`}>
                          {rejected ? '✕' : '●'} {app.status?.replace('_', ' ') || 'Applied'}
                        </span>
                      </span>
                    </div>

                    {/* Next step */}
                    {!rejected && idx < STAGES.length - 1 && (
                      <p className="text-xs text-ink-muted mt-2">
                        Next Step: <span className="text-brand font-medium">{STAGES[idx + 1]}</span>
                      </p>
                    )}
                    {rejected && (
                      <p className="text-xs text-bad mt-2">This application was not selected.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      className="btn-danger btn-sm"
                      title="Delete Application"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Status pipeline */}
                {!rejected && (
                  <div className="flex items-center flex-wrap gap-y-2 py-4">
                    {STAGES.map((stage, i) => (
                      <React.Fragment key={stage}>
                        <span
                          className={`badge ${i < idx ? 'badge-success' : i === idx ? 'badge-primary' : 'badge-neutral'}`}
                          title={stage}
                        >
                          {i < idx ? '✓ ' : ''}{stage}
                        </span>
                        {i < STAGES.length - 1 && (
                          <span className="text-ink-faint mx-1.5 text-xs shrink-0">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Recruiter notes */}
                {app.recruiter_notes && (
                  <div className={`rounded-lg px-4 py-3 text-[13px] border ${
                    app.status?.toLowerCase() === 'rejected'
                      ? 'bg-bad-soft border-bad/15 text-ink-soft'
                      : 'bg-brand-subtle border-line text-ink-soft'
                  }`}>
                    <strong className="block font-semibold mb-0.5 text-ink">Recruiter Feedback</strong>
                    {app.recruiter_notes}
                  </div>
                )}

                {/* Active Interview Scheduled banner */}
                {app.meeting_link && app.interview_status?.toLowerCase() !== 'cancelled' && ['shortlisted', 'interview', 'interview_scheduled'].includes(app.status?.toLowerCase()) && (
                  <div className="bg-ok-soft border border-ok/15 p-4 rounded-xl mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="font-bold text-ok text-[13px] flex items-center gap-2">
                        <span>📹</span>
                        <span>{app.interview_status?.toLowerCase() === 'rescheduled' ? 'Interview Rescheduled' : 'Interview Scheduled'}</span>
                        {app.interview_status?.toLowerCase() === 'rescheduled' && (
                          <span className="badge badge-primary text-[10px] uppercase font-bold">Rescheduled</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {app.scheduled_at ? `Scheduled for ${app.scheduled_at}` : 'Your interview is scheduled'}
                        {app.interview_type ? ` · Round: ${app.interview_type.toUpperCase()}` : ''}
                      </p>
                    </div>
                    <a
                      href={app.meeting_link.startsWith('http') ? app.meeting_link : `https://${app.meeting_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-success btn-sm shrink-0 font-bold"
                    >
                      🔗 Join Meeting
                    </a>
                  </div>
                )}

                {/* Cancelled Meeting Notice */}
                {app.interview_status?.toLowerCase() === 'cancelled' && (
                  <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-xl mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                        ✕
                      </span>
                      <div>
                        <div className="font-bold text-rose-800 text-[13px] flex items-center gap-2">
                          <span>Interview Meeting Cancelled</span>
                          <span className="badge badge-rose text-[10px] uppercase font-bold">Cancelled</span>
                        </div>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {app.scheduled_at ? `The interview previously scheduled for ${app.scheduled_at} was cancelled by the recruiter.` : 'The scheduled interview was cancelled by the recruiter.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 italic shrink-0">Status updated in tracker</span>
                  </div>
                )}

                {/* Meeting History & Audit Log (Scheduled / Rescheduled / Cancelled) */}
                {app.meeting_logs && app.meeting_logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>📅 Interview &amp; Meeting History Logs ({app.meeting_logs.length})</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Live synchronized with recruiter</span>
                    </div>

                    <div className="space-y-2">
                      {app.meeting_logs.map((log, lIdx) => {
                        const st = (log.status || '').toLowerCase()
                        const isCancelled = st === 'cancelled'
                        const isRescheduled = st === 'rescheduled'
                        const isScheduled = st === 'scheduled' || st === 'confirmed'
                        const isCompleted = st === 'completed'

                        return (
                          <div
                            key={log.id || lIdx}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                              isCancelled
                                ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                                : isRescheduled
                                ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                                : isCompleted
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                isCancelled
                                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                  : isRescheduled
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : isCompleted
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : 'bg-slate-200 text-slate-700 border border-slate-300'
                              }`}>
                                {isCancelled ? '✕' : isRescheduled ? '🗓️' : isCompleted ? '✓' : '📹'}
                              </span>

                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900">{log.title || 'Interview Session'}</span>
                                  <span className={`badge text-[10px] font-extrabold uppercase py-0.5 px-2 ${
                                    isCancelled
                                      ? 'badge-danger'
                                      : isRescheduled
                                      ? 'badge-primary'
                                      : isCompleted
                                      ? 'badge-success'
                                      : 'badge-amber'
                                  }`}>
                                    {log.status}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600">
                                  <strong className="text-slate-800">Time:</strong> {log.scheduled_at} ({log.duration_minutes} mins) · <span className="capitalize">{log.interview_type}</span> Round
                                </p>

                                {isCancelled && (
                                  <p className="text-[11px] text-rose-700 font-semibold italic">
                                    • This interview meeting was cancelled by the recruiter.
                                  </p>
                                )}
                                {log.notes && !isCancelled && (
                                  <p className="text-[11px] text-slate-500 italic">
                                    Notes: {log.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Join button for active meetings */}
                            {!isCancelled && log.meeting_link && (
                              <a
                                href={log.meeting_link.startsWith('http') ? log.meeting_link : `https://${log.meeting_link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary btn-sm shrink-0 font-bold text-xs"
                              >
                                🔗 Join
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {app.timeline?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-3">Activity Timeline</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {app.timeline.map((item, tidx) => (
                        <div key={tidx} className="flex items-center gap-3 bg-canvas rounded-lg px-3.5 py-2.5">
                          <span className="w-2 h-2 rounded-full bg-ok shrink-0"></span>
                          <div className="min-w-0">
                            <span className="text-[13px] font-medium text-ink block truncate">{item.event}</span>
                            <span className="text-[11px] text-ink-muted">{item.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
