import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const PostJob = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [postedJobSuccess, setPostedJobSuccess] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    company: 'HireAI Innovations',
    description: '',
    required_skills: '',
    preferred_skills: '',
    min_experience_years: 0,
    max_experience_years: 3,
    required_education: "Bachelor's Degree",
    location: '',
    job_type: 'Full-time',
    is_remote: false,
    salary_min: 600000,
    salary_max: 1200000,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Field Validations
    if (!formData.title.trim()) return toast.error('Job Title cannot be empty')
    if (!formData.description.trim()) return toast.error('Job Description cannot be empty')
    if (!formData.required_skills.trim()) return toast.error('Required Skills must contain at least one skill')
    if (!formData.location.trim()) return toast.error('Location cannot be empty')

    setLoading(true)

    const payload = {
      ...formData,
      required_skills: formData.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
      preferred_skills: formData.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean),
      min_experience_years: Number(formData.min_experience_years),
      max_experience_years: Number(formData.max_experience_years),
      salary_min: Number(formData.salary_min),
      salary_max: Number(formData.salary_max),
    }

    try {
      const { data } = await api.post('/recruiter/jobs', payload)
      toast.success('Job posted successfully!')
      setPostedJobSuccess({
        title: formData.title,
        company: formData.company,
        jobId: data.job_id
      })
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to post job. Please check all fields.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto text-white">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
          ➕ Post a New Job Opportunity
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Define job requirements, required technical skills, and candidate expectations.
        </p>
      </div>

      <div className="glass-card p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Job Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Senior Machine Learning Engineer"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Company Name *</label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Required Skills (Comma-separated) *</label>
              <input
                type="text"
                name="required_skills"
                required
                placeholder="Python, SQL, Machine Learning, Docker"
                value={formData.required_skills}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Preferred Skills</label>
              <input
                type="text"
                name="preferred_skills"
                placeholder="AWS, PyTorch, Kubernetes"
                value={formData.preferred_skills}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Min Experience (Years)</label>
              <input
                type="number"
                name="min_experience_years"
                min="0"
                value={formData.min_experience_years}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Max Experience (Years)</label>
              <input
                type="number"
                name="max_experience_years"
                min="0"
                value={formData.max_experience_years}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Location *</label>
              <input
                type="text"
                name="location"
                required
                placeholder="Bengaluru, India"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Employment Type</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
              >
                <option value="Full-time">Full Time</option>
                <option value="Part-time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Min Salary (INR / Yr)</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Max Salary (INR / Yr)</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_remote"
              name="is_remote"
              checked={formData.is_remote}
              onChange={handleChange}
              className="w-4 h-4 rounded text-indigo-500 bg-[#0a0b14] border-white/20"
            />
            <label htmlFor="is_remote" className="text-slate-300">Allow Remote Work</label>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Full Job Description *</label>
            <textarea
              name="description"
              rows={5}
              required
              placeholder="Describe the job duties, role requirements, team structure, and expectations..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-[#0a0b14] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/recruiter/jobs')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2.5 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Posting Job...' : 'POST JOB NOW 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* Pop-Up Modal when Job is Posted Successfully */}
      {postedJobSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-8 rounded-2xl max-w-lg w-full bg-[#0d0e19] border border-emerald-500/40 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl text-emerald-400 mx-auto">
              🎉
            </div>

            <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Your Job Has Been Posted!
            </h2>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10 text-xs text-slate-300 space-y-2 text-left font-mono">
              <div><strong className="text-white">Job Title:</strong> {postedJobSuccess.title}</div>
              <div><strong className="text-white">Company:</strong> {postedJobSuccess.company}</div>
              <div className="text-emerald-400 font-bold pt-1 border-t border-white/5">
                ✓ Status: Active & Published to Candidate Portal
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This job position is now live in the system and will immediately be reflected in the candidate job search portal for job seekers to view, match ATS scores, and apply!
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => {
                  setPostedJobSuccess(null)
                  setFormData({
                    title: '',
                    company: 'HireAI Innovations',
                    description: '',
                    required_skills: '',
                    preferred_skills: '',
                    min_experience_years: 0,
                    max_experience_years: 3,
                    required_education: "Bachelor's Degree",
                    location: '',
                    job_type: 'Full-time',
                    is_remote: false,
                    salary_min: 600000,
                    salary_max: 1200000,
                  })
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl"
              >
                + Post Another Job
              </button>
              <button
                onClick={() => navigate('/recruiter/jobs')}
                className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl"
              >
                View in Manage Jobs 💼
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
