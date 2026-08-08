import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const ApplicationTracker = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppForStatus, setSelectedAppForStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('applied')

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

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAppForStatus) return

    try {
      await api.put(`/applications/${selectedAppForStatus.id}/status`, {
        status: newStatus,
        notes: `Updated status manually to ${newStatus}`
      })
      toast.success(`Status updated to ${newStatus.toUpperCase()}!`)
      setSelectedAppForStatus(null)
      fetchApplications()
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'hired':
      case 'offer':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'shortlisted':
      case 'interview':
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
          Track application progress across 11 status stages, view activity timelines, and set updates.
        </p>
      </div>

      {/* Application Reminders Alert Banner */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
        <span className="text-xl">🔔</span>
        <div>
          <strong className="text-indigo-300 block font-display">Application Reminder</strong>
          <span>Applications submitted >7 days ago without update: Follow-up email may be appropriate.</span>
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
                    onClick={() => {
                      setSelectedAppForStatus(app)
                      setNewStatus(app.status)
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>

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

      {/* Update Status Modal */}
      {selectedAppForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-display">Update Application Status</h2>
              <button onClick={() => setSelectedAppForStatus(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Current Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="application_viewed">Application Viewed</option>
                  <option value="screening">Screening</option>
                  <option value="assessment">Assessment</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer Received</option>
                  <option value="hired">Hired</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForStatus(null)}
                  className="px-4 py-2 bg-white/10 rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl font-semibold">
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
