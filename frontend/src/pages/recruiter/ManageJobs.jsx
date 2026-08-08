import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const ManageJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobToDelete, setJobToDelete] = useState(null)

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/recruiter/jobs')
      setJobs(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load recruiter jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleStatusToggle = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active'
    try {
      await api.put(`/recruiter/jobs/${jobId}/status`, { status: newStatus })
      toast.success(`Job status changed to '${newStatus.toUpperCase()}'`)
      fetchJobs()
    } catch (err) {
      toast.error('Failed to update job status')
    }
  }

  const handleDeleteJob = async () => {
    if (!jobToDelete) return
    try {
      await api.delete(`/recruiter/jobs/${jobToDelete.id}`)
      toast.success(`Job '${jobToDelete.title}' deleted successfully!`)
      setJobs(jobs.filter((j) => j.id !== jobToDelete.id))
      setJobToDelete(null)
    } catch (err) {
      toast.error('Failed to delete job.')
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            💼 Manage Recruiter Jobs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            View active job listings, track live application statistics, edit status, or remove postings.
          </p>
        </div>

        <Link to="/recruiter/jobs/create" className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-2">
          <span>➕</span> Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5">
          <span className="text-4xl block mb-2">💼</span>
          <p className="text-slate-400 text-sm mb-4">No job postings created yet.</p>
          <Link to="/recruiter/jobs/create" className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl">
            Post Your First Job →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white font-display">{job.title}</h3>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                    job.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    ● {job.status}
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium">
                  {job.company} • {job.location} • {job.job_type} ({job.is_remote ? 'Remote' : 'On-site'})
                </p>

                {/* Real Database Counts */}
                <div className="flex items-center gap-4 text-xs pt-1 font-mono">
                  <span className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-slate-300">
                    Applications: <strong className="text-white">{job.applications_count}</strong>
                  </span>
                  <span className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-slate-300">
                    Shortlisted: <strong className="text-emerald-400">{job.shortlisted_count}</strong>
                  </span>
                  <span className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 text-slate-300">
                    Interviews: <strong className="text-purple-400">{job.interviews_count}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleStatusToggle(job.id, job.status)}
                  className={`px-3 py-2 rounded-xl font-semibold border transition-all ${
                    job.status === 'active'
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {job.status === 'active' ? 'Close Job' : 'Reopen Job'}
                </button>
                <button
                  onClick={() => setJobToDelete(job)}
                  className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-xl font-semibold transition-all"
                >
                  Delete Job
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-rose-500/30 space-y-4 text-xs">
            <h2 className="text-base font-bold text-rose-400 font-display flex items-center gap-2">
              <span>⚠️</span> Delete Job Confirmation
            </h2>
            <p className="text-slate-300">
              Are you sure you want to delete <strong className="text-white">'{jobToDelete.title}'</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Delete Job 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
