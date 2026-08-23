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
    <div className="space-y-8 w-full max-w-5xl mx-auto text-ink">
      <div>
        <h1 className="page-title">
          ➕ Post a New Job Opportunity
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Define job requirements, required technical skills, and candidate expectations.
        </p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Job Title *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Senior Machine Learning Engineer"
                value={formData.title}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Company Name *</label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Required Skills (Comma-separated) *</label>
              <input
                type="text"
                name="required_skills"
                required
                placeholder="Python, SQL, Machine Learning, Docker"
                value={formData.required_skills}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Preferred Skills</label>
              <input
                type="text"
                name="preferred_skills"
                placeholder="AWS, PyTorch, Kubernetes"
                value={formData.preferred_skills}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Min Experience (Years)</label>
              <input
                type="number"
                name="min_experience_years"
                min="0"
                value={formData.min_experience_years}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Max Experience (Years)</label>
              <input
                type="number"
                name="max_experience_years"
                min="0"
                value={formData.max_experience_years}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Location *</label>
              <input
                type="text"
                name="location"
                required
                placeholder="Bengaluru, India"
                value={formData.location}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Employment Type</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="input"
              >
                <option value="Full-time">Full Time</option>
                <option value="Part-time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="field-label">Min Salary (INR / Yr)</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Max Salary (INR / Yr)</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className="input"
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
              className="w-4 h-4 rounded accent-[#0A66C2] border-line"
            />
            <label htmlFor="is_remote" className="text-ink-2">Allow Remote Work</label>
          </div>

          <div>
            <label className="field-label">Full Job Description *</label>
            <textarea
              name="description"
              rows={5}
              required
              placeholder="Describe the job duties, role requirements, team structure, and expectations..."
              value={formData.description}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => navigate('/recruiter/jobs')}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-sm flex items-center gap-2"
            >
              {loading ? 'Posting Job...' : 'POST JOB NOW 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* Pop-Up Modal when Job is Posted Successfully */}
      {postedJobSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
          <div className="bg-white rounded-xl border border-line shadow-xl max-w-lg w-full p-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-ok-bg border border-green-200 flex items-center justify-center text-3xl mx-auto">
              🎉
            </div>

            <h2 className="page-title">
              Your Job Has Been Posted!
            </h2>

            <div className="bg-page p-4 rounded-xl border border-line text-xs text-ink-2 space-y-2 text-left font-mono">
              <div><strong className="text-ink">Job Title:</strong> {postedJobSuccess.title}</div>
              <div><strong className="text-ink">Company:</strong> {postedJobSuccess.company}</div>
              <div className="text-ok font-bold pt-1 border-t border-line">
                ✓ Status: Active & Published to Candidate Portal
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
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
                className="btn-secondary btn-sm"
              >
                + Post Another Job
              </button>
              <button
                onClick={() => navigate('/recruiter/jobs')}
                className="btn-primary btn-sm"
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
