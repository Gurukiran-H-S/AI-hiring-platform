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
      toast.error('Something went wrong. Please try again.')
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
      toast.error('Something went wrong. Please try again.')
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
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title text-ink">Manage Jobs</h1>
          <p className="text-sm text-ink-soft mt-1">
            View active job listings, track live application statistics, edit status, or remove postings.
          </p>
        </div>

        <Link to="/recruiter/jobs/create" className="btn-primary btn-sm">
          + Post New Job
        </Link>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card py-16 text-center">
          <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-light flex items-center justify-center">
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="font-semibold text-ink mb-1">No Jobs Posted Yet</h3>
          <p className="text-sm text-ink-muted mb-5 max-w-xs mx-auto">
            Create your first job posting to start receiving candidate applications.
          </p>
          <Link to="/recruiter/jobs/create" className="btn-primary">
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card hover-lift flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-ink">{job.title}</h3>
                  <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-ink-muted font-medium">
                  {job.company} • {job.location} • {job.job_type} ({job.is_remote ? 'Remote' : 'On-site'})
                </p>

                {/* Real Database Counts */}
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="bg-canvas border border-line-soft rounded-md px-2.5 py-1 text-ink-soft">
                    Applications: <strong className="text-ink">{job.applications_count}</strong>
                  </span>
                  <span className="bg-canvas border border-line-soft rounded-md px-2.5 py-1 text-ink-soft">
                    Shortlisted: <strong className="text-ok">{job.shortlisted_count}</strong>
                  </span>
                  <span className="bg-canvas border border-line-soft rounded-md px-2.5 py-1 text-ink-soft">
                    Interviews: <strong className="text-brand">{job.interviews_count}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleStatusToggle(job.id, job.status)}
                  className={job.status === 'active' ? 'btn-secondary btn-sm' : 'btn-success btn-sm'}
                >
                  {job.status === 'active' ? 'Close Job' : 'Reopen Job'}
                </button>
                <button
                  onClick={() => setJobToDelete(job)}
                  className="btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="card max-w-md w-full space-y-4">
            <h2 className="section-title text-bad">Delete Job Confirmation</h2>
            <p className="text-sm text-ink-soft">
              Are you sure you want to delete <strong className="text-ink">'{jobToDelete.title}'</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setJobToDelete(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="btn-danger btn-sm"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
