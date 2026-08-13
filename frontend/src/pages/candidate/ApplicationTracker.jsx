import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const ApplicationTracker = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications/')
      setApplications(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load applications')
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
      const errorMsg = err.response?.data?.detail || 'Failed to delete application'
      toast.error(errorMsg)
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'hired':
      case 'offer':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'shortlisted':
      case 'interview':
      case 'interview_scheduled':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
          💼 Candidate Job Application Tracker & Activity Timeline
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Track application progress across your active job applications.
        </p>
      </div>

      {/* Application Reminders Alert Banner */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div>
          <strong className="text-indigo-300 block font-display">Application Reminder</strong>
          <span>Recruiters will update status stages and schedule interviews as your application advances.</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5">
          <span className="text-4xl block mb-2">💼</span>
          <p className="text-slate-400 text-sm">No tracked job applications found. Search jobs and click 'Apply' to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">{app.job_title}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{app.company} • Applied on {app.applied_at}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getStatusBadge(app.status)}`}>
                    ● {app.status?.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteApplication(app.id)}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Delete Application"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Recruiter Notes / Status Feedback */}
              {app.recruiter_notes && (
                <div className={`p-3 rounded-xl text-xs border ${
                  app.status?.toLowerCase() === 'rejected' 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                }`}>
                  <strong className="block font-semibold mb-0.5">Recruiter Feedback / Note:</strong>
                  <span>{app.recruiter_notes}</span>
                </div>
              )}

              {/* Interview Meeting Link for Shortlisted / Interview Candidates */}
              {app.meeting_link && (app.status?.toLowerCase() === 'shortlisted' || app.status?.toLowerCase() === 'interview' || app.status?.toLowerCase() === 'interview_scheduled') && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm font-display">
                      <span>📹</span> Interview Meeting Link Reflected
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      {app.scheduled_at ? `Scheduled for: ${app.scheduled_at}` : 'Shortlisted for Interview Round'}
                      {app.interview_type ? ` • Round: ${app.interview_type.toUpperCase()}` : ''}
                    </p>
                  </div>
                  <a
                    href={app.meeting_link.startsWith('http') ? app.meeting_link : `https://${app.meeting_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 text-xs transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    <span>🔗</span> Join Interview Meeting →
                  </a>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                  Application Timeline & History
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {app.timeline?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <div>
                        <span className="font-bold text-white block">{item.event}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
