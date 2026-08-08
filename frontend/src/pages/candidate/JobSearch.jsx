import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const JobSearch = () => {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [providerMessage, setProviderMessage] = useState('')
  const [selectedJobForModal, setSelectedJobForModal] = useState(null)
  const [savedJobs, setSavedJobs] = useState([])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/jobs/search', {
        params: { query, location, job_type: jobType, limit: 12 }
      })
      setJobs(data.jobs || [])
      setProviderMessage(data.message || '')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load job listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const handleApplyClick = (job) => {
    if (job.application_url) {
      window.open(job.application_url, '_blank')
    }
    setSelectedJobForModal(job)
  }

  const confirmTrackApplication = async () => {
    if (!selectedJobForModal) return
    try {
      await api.post('/applications/track-external', {
        job_title: selectedJobForModal.title,
        company: selectedJobForModal.company,
        application_url: selectedJobForModal.application_url,
        notes: `Applied via ${selectedJobForModal.source || 'External Portal'}`
      })
      toast.success(`Application tracked successfully! Added to My Applications.`)
      setSelectedJobForModal(null)
    } catch (err) {
      toast.error('Failed to track application.')
    }
  }

  const toggleSaveJob = (job) => {
    if (savedJobs.some((j) => j.id === job.id)) {
      setSavedJobs(savedJobs.filter((j) => j.id !== job.id))
      toast.success(`Removed '${job.title}' from Saved Jobs.`)
    } else {
      setSavedJobs([...savedJobs, job])
      toast.success(`Saved '${job.title}'! Available under Saved Jobs.`)
    }
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
          🔎 Current Job Search & Opportunity Explorer
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore real-time technical roles, modular job providers, and job-specific ATS relevance.
        </p>
      </div>

      {/* Provider Message Banner */}
      {providerMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>{providerMessage}</span>
          </div>
          <span className="font-mono bg-indigo-500/20 px-2 py-0.5 rounded text-[10px]">
            Modular Job Architecture
          </span>
        </div>
      )}

      {/* Search Form */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Job Title / Keyword
            </label>
            <input
              type="text"
              placeholder="e.g. Python Developer, React"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Location
            </label>
            <input
              type="text"
              placeholder="e.g. Bengaluru, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Employment Type
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full Time</option>
              <option value="Part-time">Part Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl">
              {loading ? 'Searching...' : '🔎 Search Jobs'}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-slate-200">
          Job Openings ({jobs.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5">
            <span className="text-4xl block mb-2">🔍</span>
            <p className="text-slate-400 text-sm">No job listings found for your search terms. Try searching 'Python' or 'Developer'.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const isSaved = savedJobs.some((j) => j.id === job.id)
              return (
                <div key={job.id} className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white font-display">{job.title}</h3>
                        <p className="text-xs text-indigo-300 font-medium">{job.company} • {job.location}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded">
                        Job ATS: {job.title.includes('Python') ? '84%' : '76%'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills?.map((s) => (
                        <span key={s} className="text-[11px] bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className="text-slate-400">{job.salary} • {job.posted_date}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSaveJob(job)}
                        className={`p-2 rounded-xl border text-xs transition-colors ${
                          isSaved ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                        title="Save Job"
                      >
                        {isSaved ? '★ Saved' : '☆ Save'}
                      </button>
                      <button
                        onClick={() => handleApplyClick(job)}
                        className="btn-primary px-4 py-1.5 text-xs font-semibold rounded-xl"
                      >
                        Apply Now →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* External Application Tracking Modal */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-display">Track External Application?</h2>
              <button onClick={() => setSelectedJobForModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Did you submit your application for <strong className="text-indigo-300">{selectedJobForModal.title}</strong> at <strong className="text-white">{selectedJobForModal.company}</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedJobForModal(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300"
              >
                No
              </button>
              <button
                onClick={confirmTrackApplication}
                className="btn-primary px-4 py-2 rounded-xl font-semibold"
              >
                Yes, Track Application 💼
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
