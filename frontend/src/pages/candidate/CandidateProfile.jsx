import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api, useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const POPULAR_SKILLS = [
  // Programming Languages
  { name: 'Python', category: 'Language' },
  { name: 'JavaScript', category: 'Language' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Java', category: 'Language' },
  { name: 'C++', category: 'Language' },
  { name: 'C#', category: 'Language' },
  { name: 'Go', category: 'Language' },
  { name: 'Rust', category: 'Language' },
  { name: 'SQL', category: 'Language' },
  { name: 'HTML5', category: 'Language' },
  { name: 'CSS3', category: 'Language' },
  { name: 'PHP', category: 'Language' },
  { name: 'Kotlin', category: 'Language' },
  { name: 'Swift', category: 'Language' },
  { name: 'Ruby', category: 'Language' },
  { name: 'R', category: 'Language' },
  { name: 'Scala', category: 'Language' },
  { name: 'Dart', category: 'Language' },

  // Frameworks & Libraries
  { name: 'React', category: 'Framework' },
  { name: 'Next.js', category: 'Framework' },
  { name: 'Node.js', category: 'Framework' },
  { name: 'Express.js', category: 'Framework' },
  { name: 'FastAPI', category: 'Framework' },
  { name: 'Django', category: 'Framework' },
  { name: 'Flask', category: 'Framework' },
  { name: 'Spring Boot', category: 'Framework' },
  { name: 'Angular', category: 'Framework' },
  { name: 'Vue.js', category: 'Framework' },
  { name: '.NET', category: 'Framework' },
  { name: 'Tailwind CSS', category: 'Framework' },
  { name: 'React Native', category: 'Framework' },
  { name: 'Flutter', category: 'Framework' },
  { name: 'Bootstrap', category: 'Framework' },
  { name: 'Redux', category: 'Framework' },
  { name: 'GraphQL', category: 'Framework' },
  { name: 'REST API', category: 'Framework' },

  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud' },
  { name: 'Microsoft Azure', category: 'Cloud' },
  { name: 'Google Cloud', category: 'Cloud' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'Terraform', category: 'DevOps' },
  { name: 'CI/CD', category: 'DevOps' },
  { name: 'Jenkins', category: 'DevOps' },
  { name: 'GitHub Actions', category: 'DevOps' },
  { name: 'Linux', category: 'DevOps' },
  { name: 'Git', category: 'Tools' },
  { name: 'Ansible', category: 'DevOps' },
  { name: 'Prometheus', category: 'DevOps' },
  { name: 'Grafana', category: 'DevOps' },

  // Databases & Storage
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'Elasticsearch', category: 'Database' },
  { name: 'DynamoDB', category: 'Database' },
  { name: 'Apache Kafka', category: 'Database' },
  { name: 'RabbitMQ', category: 'Database' },
  { name: 'Snowflake', category: 'Database' },
  { name: 'SQLite', category: 'Database' },
  { name: 'Oracle Database', category: 'Database' },

  // AI & Machine Learning
  { name: 'PyTorch', category: 'AI/ML' },
  { name: 'TensorFlow', category: 'AI/ML' },
  { name: 'Machine Learning', category: 'AI/ML' },
  { name: 'Deep Learning', category: 'AI/ML' },
  { name: 'Natural Language Processing', category: 'AI/ML' },
  { name: 'Computer Vision', category: 'AI/ML' },
  { name: 'Scikit-Learn', category: 'AI/ML' },
  { name: 'Hugging Face', category: 'AI/ML' },
  { name: 'Transformers', category: 'AI/ML' },
  { name: 'LangChain', category: 'AI/ML' },
  { name: 'Large Language Models (LLM)', category: 'AI/ML' },
  { name: 'Generative AI', category: 'AI/ML' },
  { name: 'Pandas', category: 'AI/ML' },
  { name: 'NumPy', category: 'AI/ML' },
  { name: 'OpenCV', category: 'AI/ML' },
  { name: 'spaCy', category: 'AI/ML' },
  { name: 'NLTK', category: 'AI/ML' },
  { name: 'Apache Spark', category: 'AI/ML' },

  // Testing & Tools
  { name: 'Jest', category: 'Testing' },
  { name: 'Cypress', category: 'Testing' },
  { name: 'Selenium', category: 'Testing' },
  { name: 'Postman', category: 'Tools' },
  { name: 'Figma', category: 'Tools' },
  { name: 'Jira', category: 'Tools' },
]

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Language': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Framework': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Cloud': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'DevOps': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Database': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'AI/ML': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export const CandidateProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTab, setEditTab] = useState('personal') // 'personal' | 'skills' | 'education' | 'experience' | 'projects' | 'certifications' | 'preferences' | 'links'
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const fileInputRef = useRef(null)

  // Skill Input & Dropdown state
  const [newSkill, setNewSkill] = useState('')
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [activeSkillIndex, setActiveSkillIndex] = useState(0)
  const skillContainerRef = useRef(null)

  // Edit Form State
  const [formData, setFormData] = useState({
    full_name: '',
    profile_picture_url: '',
    headline: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    preferred_role: '',
    preferred_location: '',
    work_mode: 'Remote',
    salary_expectation: '',
    preferred_job_type: 'Full-time',
    preferred_industries: [],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    leetcode_url: '',
  })

  // Dynamic Add item temporary forms
  const [newEdu, setNewEdu] = useState({ degree: '', college: '', university: '', year: '', cgpa: '' })
  const [newExp, setNewExp] = useState({ company: '', role: '', start_date: '', end_date: '', description: '' })
  const [newProj, setNewProj] = useState({ name: '', description: '', technologies: '', github_url: '', live_demo_url: '' })
  const [newCert, setNewCert] = useState({ name: '', issuing_organization: '', date: '', credential_url: '' })

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/candidate/profile')
      setProfile(data)
      setFormData({
        full_name: data.name || data.full_name || '',
        profile_picture_url: data.profile_picture_url || '',
        headline: data.headline || '',
        phone: data.phone || '',
        location: data.location || '',
        summary: data.summary || '',
        skills: data.skills || [],
        education: data.education || [],
        experience: data.experience || [],
        projects: data.projects || [],
        certifications: data.certifications || [],
        preferred_role: data.preferred_role || '',
        preferred_location: data.preferred_location || '',
        work_mode: data.work_mode || 'Remote',
        salary_expectation: data.salary_expectation || '',
        preferred_job_type: data.preferred_job_type || 'Full-time',
        preferred_industries: data.preferred_industries || [],
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
        leetcode_url: data.leetcode_url || '',
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load candidate profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Max size is 5MB.')
      return
    }

    const form = new FormData()
    form.append('file', file)

    setUploadingPic(true)
    try {
      const { data } = await api.post('/candidate/profile/picture', form)
      toast.success('Profile picture updated successfully!')
      setProfile(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }))
      setFormData(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }))

      // Update auth context / localStorage user object
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.profile_picture_url = data.profile_picture_url
          localStorage.setItem('user', JSON.stringify(parsed))
          window.dispatchEvent(new Event('storage'))
        }
      } catch (err) {}
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to upload profile picture')
    } finally {
      setUploadingPic(false)
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      await api.delete('/candidate/profile/picture')
      toast.success('Profile picture removed')
      setProfile(prev => ({ ...prev, profile_picture_url: '' }))
      setFormData(prev => ({ ...prev, profile_picture_url: '' }))
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.profile_picture_url = ''
          localStorage.setItem('user', JSON.stringify(parsed))
          window.dispatchEvent(new Event('storage'))
        }
      } catch (err) {}
    } catch (err) {
      toast.error('Failed to remove picture')
    }
  }

  const handleSaveProfile = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/candidate/profile', formData)
      setProfile(data)
      toast.success('Profile updated successfully!')
      setShowEditModal(false)

      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.full_name = formData.full_name
          parsed.profile_picture_url = formData.profile_picture_url
          localStorage.setItem('user', JSON.stringify(parsed))
          window.dispatchEvent(new Event('storage'))
        }
      } catch (err) {}
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Click outside to close skill suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillContainerRef.current && !skillContainerRef.current.contains(event.target)) {
        setShowSkillDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter skills for autocomplete
  const filteredSkills = POPULAR_SKILLS.filter(sk => {
    if (!newSkill.trim()) return true
    return sk.name.toLowerCase().includes(newSkill.trim().toLowerCase())
  }).slice(0, 15)

  const handleAddSkillDirect = async (skillToAdd) => {
    if (!skillToAdd || !skillToAdd.trim()) return
    const skillName = skillToAdd.trim()
    const currentSkills = formData.skills || []
    if (currentSkills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
      toast.error(`"${skillName}" is already added!`)
      return
    }
    const updatedSkills = [...currentSkills, skillName]
    setFormData(prev => ({ ...prev, skills: updatedSkills }))
    setNewSkill('')
    setShowSkillDropdown(false)

    // Save automatically
    try {
      const { data } = await api.put('/candidate/profile', { ...formData, skills: updatedSkills })
      setProfile(data)
      toast.success(`Added ${skillName}!`)
    } catch (err) {
      toast.error('Failed to save skill')
    }
  }

  const handleAddSkillInline = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (filteredSkills.length > 0 && activeSkillIndex >= 0 && activeSkillIndex < filteredSkills.length && showSkillDropdown) {
      const selected = filteredSkills[activeSkillIndex]
      if (selected) {
        handleAddSkillDirect(selected.name)
        return
      }
    }
    if (newSkill.trim()) {
      handleAddSkillDirect(newSkill.trim())
    }
  }

  const handleSkillKeyDown = (e) => {
    if (!showSkillDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowSkillDropdown(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSkillIndex(prev => (prev + 1) % Math.max(1, filteredSkills.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSkillIndex(prev => (prev - 1 + filteredSkills.length) % Math.max(1, filteredSkills.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkillInline(e)
    } else if (e.key === 'Escape') {
      setShowSkillDropdown(false)
    }
  }

  const handleRemoveSkillInline = async (skillToRemove) => {
    const updatedSkills = formData.skills.filter(s => s !== skillToRemove)
    setFormData(prev => ({ ...prev, skills: updatedSkills }))
    try {
      const { data } = await api.put('/candidate/profile', { ...formData, skills: updatedSkills })
      setProfile(data)
      toast.success(`Removed ${skillToRemove}`)
    } catch (err) {
      toast.error('Failed to remove skill')
    }
  }

  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.college) {
      toast.error('Please enter degree and college.')
      return
    }
    const updated = [...formData.education, { ...newEdu }]
    setFormData(prev => ({ ...prev, education: updated }))
    setNewEdu({ degree: '', college: '', university: '', year: '', cgpa: '' })
  }

  const handleRemoveEducation = (idx) => {
    const updated = formData.education.filter((_, i) => i !== idx)
    setFormData(prev => ({ ...prev, education: updated }))
  }

  const handleAddExperience = () => {
    if (!newExp.company || !newExp.role) {
      toast.error('Please enter company and role.')
      return
    }
    const updated = [...formData.experience, { ...newExp }]
    setFormData(prev => ({ ...prev, experience: updated }))
    setNewExp({ company: '', role: '', start_date: '', end_date: '', description: '' })
  }

  const handleRemoveExperience = (idx) => {
    const updated = formData.experience.filter((_, i) => i !== idx)
    setFormData(prev => ({ ...prev, experience: updated }))
  }

  const handleAddProject = () => {
    if (!newProj.name) {
      toast.error('Please enter project name.')
      return
    }
    const techArray = typeof newProj.technologies === 'string'
      ? newProj.technologies.split(',').map(t => t.trim()).filter(Boolean)
      : newProj.technologies

    const updated = [...formData.projects, { ...newProj, technologies: techArray }]
    setFormData(prev => ({ ...prev, projects: updated }))
    setNewProj({ name: '', description: '', technologies: '', github_url: '', live_demo_url: '' })
  }

  const handleRemoveProject = (idx) => {
    const updated = formData.projects.filter((_, i) => i !== idx)
    setFormData(prev => ({ ...prev, projects: updated }))
  }

  const handleAddCertification = () => {
    if (!newCert.name) {
      toast.error('Please enter certification name.')
      return
    }
    const updated = [...formData.certifications, { ...newCert }]
    setFormData(prev => ({ ...prev, certifications: updated }))
    setNewCert({ name: '', issuing_organization: '', date: '', credential_url: '' })
  }

  const handleRemoveCertification = (idx) => {
    const updated = formData.certifications.filter((_, i) => i !== idx)
    setFormData(prev => ({ ...prev, certifications: updated }))
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="bg-white rounded-[10px] h-48 border border-line shadow-card"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[10px] h-64 border border-line shadow-card md:col-span-2"></div>
          <div className="bg-white rounded-[10px] h-64 border border-line shadow-card"></div>
        </div>
      </div>
    )
  }

  const completionPct = profile?.profile_completion || 0
  const coding = profile?.coding || { problems_solved: 0, points: 0, accuracy: 0, rank: '-' }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-4 text-ink font-sans">
      
      {/* ─── 1. PROFILE HEADER CARD (LinkedIn/Naukri Styled) ──────────────────── */}
      <div className="bg-white rounded-[10px] border border-line shadow-card overflow-hidden">
        {/* Cover Banner */}
        <div className="h-32 bg-brand w-full relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white tracking-wide border border-white/30">
            Candidate ID: {profile?.user_id ? String(profile.user_id).slice(0, 8) : 'Verified'}
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 mb-4 gap-4">
            {/* Avatar with Photo Upload Trigger */}
            <div className="flex items-end gap-5">
              <div className="relative group/avatar shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-white p-1 shadow-card border-2 border-slate-200 overflow-hidden relative">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={profile?.name || 'Profile Picture'}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-3xl shadow-inner font-display">
                      {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                    </div>
                  )}

                  {/* Hover Overlay to Change Photo */}
                  <label
                    className="absolute inset-1 rounded-xl bg-slate-900/65 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-xs font-semibold backdrop-blur-[2px]"
                    title="Change Profile Picture"
                  >
                    <span className="text-xl">📷</span>
                    <span className="text-[11px]">{uploadingPic ? 'Uploading...' : 'Change Photo'}</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingPic}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Floating Camera Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white shadow-md flex items-center justify-center text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                  title="Upload / Change Photo"
                >
                  📷
                </button>
              </div>

              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-[22px] font-bold text-ink tracking-tight font-display">
                    {profile?.name || user?.full_name || 'Candidate Name'}
                  </h1>
                  <span className="badge badge-blue">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-sm font-semibold text-brand">
                  {profile?.headline || 'AI/ML & Full Stack Software Engineer'}
                </p>
                <p className="text-xs text-ink-3 flex items-center gap-3">
                  <span>📍 {profile?.location || 'Bengaluru, Karnataka'}</span>
                  <span>✉️ {profile?.email || user?.email}</span>
                  {profile?.phone && <span>📞 {profile.phone}</span>}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-primary btn-sm cursor-pointer"
              >
                <span>✏️</span> Edit Profile
              </button>
              <Link
                to="/candidate/coding"
                className="btn-secondary btn-sm cursor-pointer"
              >
                <span>💻</span> Solve Coding Problems
              </Link>
            </div>
          </div>

          {/* ─── Profile Completion Progress Bar ─── */}
          <div className="bg-page rounded-lg p-4 border border-line space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink">Profile Completion:</span>
                <span className="font-extrabold text-brand text-sm font-mono">{completionPct}%</span>
                {completionPct >= 80 ? (
                  <span className="badge badge-green">
                    🌟 All Star Profile
                  </span>
                ) : (
                  <span className="badge badge-orange">
                    ⚡ Complete sections to increase recruiter visibility
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-brand hover:text-brand-dark text-[11px] font-semibold hover:underline"
              >
                Complete Profile →
              </button>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill progress-blue"
                style={{ width: `${completionPct}%` }}
              ></div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-ink-3">
              <span className={`badge ${profile?.name && profile?.location ? 'badge-green' : 'badge-gray'}`}>
                {profile?.name && profile?.location ? '✓' : '○'} Personal Info (10%)
              </span>
              <span className={`badge ${profile?.summary ? 'badge-green' : 'badge-gray'}`}>
                {profile?.summary ? '✓' : '○'} Summary (10%)
              </span>
              <span className={`badge ${profile?.skills?.length ? 'badge-green' : 'badge-gray'}`}>
                {profile?.skills?.length ? '✓' : '○'} Skills (15%)
              </span>
              <span className={`badge ${profile?.education?.length ? 'badge-green' : 'badge-gray'}`}>
                {profile?.education?.length ? '✓' : '○'} Education (15%)
              </span>
              <span className={`badge ${profile?.experience?.length ? 'badge-green' : 'badge-gray'}`}>
                {profile?.experience?.length ? '✓' : '○'} Experience (15%)
              </span>
              <span className={`badge ${profile?.projects?.length ? 'badge-green' : 'badge-gray'}`}>
                {profile?.projects?.length ? '✓' : '○'} Projects (15%)
              </span>
              <span className={`badge ${profile?.resume ? 'badge-green' : 'badge-gray'}`}>
                {profile?.resume ? '✓' : '○'} Resume (10%)
              </span>
              <span className={`badge ${profile?.github_url || profile?.linkedin_url ? 'badge-green' : 'badge-gray'}`}>
                {profile?.github_url || profile?.linkedin_url ? '✓' : '○'} Links (5%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN 2-COLUMN GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Profile Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── PROFESSIONAL SUMMARY ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>📝</span> About Me & Professional Summary
              </h2>
              <button
                onClick={() => { setEditTab('personal'); setShowEditModal(true); }}
                className="text-brand hover:text-brand-dark text-xs font-semibold hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>
            <p className="text-xs leading-relaxed text-ink-2 whitespace-pre-line">
              {profile?.summary || 'Add a professional summary highlighting your technical strengths, core technologies, and career achievements.'}
            </p>
          </div>

          {/* ─── TECHNICAL SKILLS ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                  <span>⚡</span> Technical Skills & Competencies
                </h2>
                <p className="text-[11px] text-ink-3 mt-0.5">Skills verified across resume analysis, coding assessments & tests</p>
              </div>
              <span className="text-xs font-bold text-ink-2 font-mono">
                {profile?.skills?.length || 0} Skills
              </span>
            </div>

            {/* Inline Add Skill Form with Autocomplete Dropdown */}
            <div ref={skillContainerRef} className="relative space-y-3">
              <form onSubmit={handleAddSkillInline} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search or add a skill (e.g. Python, React, Docker, AWS)..."
                    value={newSkill}
                    onChange={(e) => {
                      setNewSkill(e.target.value)
                      setShowSkillDropdown(true)
                      setActiveSkillIndex(0)
                    }}
                    onFocus={() => setShowSkillDropdown(true)}
                    onKeyDown={handleSkillKeyDown}
                    className="input w-full pr-8"
                    autoComplete="off"
                  />
                  {newSkill && (
                    <button
                      type="button"
                      onClick={() => { setNewSkill(''); setShowSkillDropdown(false); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-primary btn-sm cursor-pointer shrink-0 font-bold px-4"
                >
                  + Add Skill
                </button>
              </form>

              {/* Autocomplete Dropdown List */}
              {showSkillDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{newSkill ? `Matching Skills (${filteredSkills.length})` : 'Popular & Trending Skills'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click or press Enter to add</span>
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map((sk, idx) => {
                        const isAdded = (formData.skills || []).some(s => s.toLowerCase() === sk.name.toLowerCase())
                        const isSelected = idx === activeSkillIndex

                        return (
                          <div
                            key={sk.name}
                            onClick={() => !isAdded && handleAddSkillDirect(sk.name)}
                            className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              isAdded
                                ? 'bg-slate-50/60 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-50 text-blue-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold">{sk.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getCategoryBadgeClass(sk.category)}`}>
                                {sk.category}
                              </span>
                            </div>

                            {isAdded ? (
                              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                ✓ Added
                              </span>
                            ) : (
                              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                                + Add
                              </span>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                        <div>No matching catalog skills found for "<strong>{newSkill}</strong>".</div>
                        <button
                          type="button"
                          onClick={() => handleAddSkillDirect(newSkill)}
                          className="btn-secondary btn-sm text-xs font-bold"
                        >
                          + Add "{newSkill}" as Custom Skill
                        </button>
                      </div>
                    )}

                    {/* Custom skill option if text is entered and doesn't exactly match catalog */}
                    {newSkill.trim() && !filteredSkills.some(s => s.name.toLowerCase() === newSkill.trim().toLowerCase()) && filteredSkills.length > 0 && (
                      <div
                        onClick={() => handleAddSkillDirect(newSkill.trim())}
                        className="px-3.5 py-2.5 bg-blue-50/50 hover:bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs cursor-pointer text-blue-700 font-bold"
                      >
                        <span>+ Add "{newSkill.trim()}" as custom skill</span>
                        <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-800">Custom</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Add Popular Skill Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Add:</span>
                {['Python', 'React', 'Docker', 'AWS', 'FastAPI', 'TypeScript', 'SQL', 'PostgreSQL', 'PyTorch'].map((quickSkill) => {
                  const isAlreadyAdded = (formData.skills || []).some(s => s.toLowerCase() === quickSkill.toLowerCase())
                  if (isAlreadyAdded) return null
                  return (
                    <button
                      key={quickSkill}
                      type="button"
                      onClick={() => handleAddSkillDirect(quickSkill)}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
                    >
                      + {quickSkill}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Skill Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="group inline-flex items-center gap-1.5 skill-pill text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillInline(skill)}
                      title={`Remove ${skill}`}
                      className="text-brand hover:text-brand-dark font-bold ml-1 cursor-pointer transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <div className="text-xs text-ink-3 py-2">No skills added yet. Type a skill above to add.</div>
              )}
            </div>
          </div>

          {/* ─── WORK EXPERIENCE ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>💼</span> Work Experience
              </h2>
              <button
                onClick={() => { setEditTab('experience'); setShowEditModal(true); }}
                className="btn-secondary btn-sm cursor-pointer"
              >
                + Manage Experience
              </button>
            </div>

            <div className="space-y-4">
              {profile?.experience && profile.experience.length > 0 ? (
                profile.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-page border border-line space-y-1 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-xs text-ink">{exp.role || exp.title}</h3>
                        <p className="text-xs text-brand font-semibold">{exp.company}</p>
                      </div>
                      <span className="text-[11px] font-mono text-ink-2 bg-white px-2 py-0.5 rounded border border-line">
                        {exp.start_date || '2024'} – {exp.end_date || 'Present'}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-ink-2 pt-1 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-2 py-3 text-center bg-page rounded-xl border border-dashed border-line">
                  No work experience listed yet. Click "+ Manage Experience" to add internship or full-time roles.
                </div>
              )}
            </div>
          </div>

          {/* ─── EDUCATION ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>🎓</span> Education
              </h2>
              <button
                onClick={() => { setEditTab('education'); setShowEditModal(true); }}
                className="btn-secondary btn-sm cursor-pointer"
              >
                + Manage Education
              </button>
            </div>

            <div className="space-y-4">
              {profile?.education && profile.education.length > 0 ? (
                profile.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-page border border-line space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-xs text-ink">{edu.degree}</h3>
                        <p className="text-xs text-ink-2 font-medium">{edu.college || edu.institution} {edu.university ? `(${edu.university})` : ''}</p>
                      </div>
                      <span className="text-[11px] font-mono text-ink-2 bg-white px-2 py-0.5 rounded border border-line">
                        {edu.year || '2027'}
                      </span>
                    </div>
                    {edu.cgpa && (
                      <p className="text-[11px] text-ok font-bold font-mono">CGPA / Percentage: {edu.cgpa}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-2 py-3 text-center bg-page rounded-xl border border-dashed border-line">
                  No education details added yet.
                </div>
              )}
            </div>
          </div>

          {/* ─── PROJECTS ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>🚀</span> Technical Projects
              </h2>
              <button
                onClick={() => { setEditTab('projects'); setShowEditModal(true); }}
                className="btn-secondary btn-sm cursor-pointer"
              >
                + Manage Projects
              </button>
            </div>

            <div className="space-y-4">
              {profile?.projects && profile.projects.length > 0 ? (
                profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-page border border-line space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-xs text-ink">{proj.name}</h3>
                      <div className="flex items-center gap-2 text-xs">
                        {proj.github_url && (
                          <a href={proj.github_url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-brand font-medium">
                            GitHub ↗
                          </a>
                        )}
                        {proj.live_demo_url && (
                          <a href={proj.live_demo_url} target="_blank" rel="noreferrer" className="text-brand hover:underline font-medium">
                            Live Demo ↗
                          </a>
                        )}
                      </div>
                    </div>
                    {proj.description && (
                      <p className="text-xs text-ink-2 leading-relaxed">{proj.description}</p>
                    )}
                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(Array.isArray(proj.technologies) ? proj.technologies : String(proj.technologies).split(',')).map((t, i) => (
                          <span key={i} className="skill-pill text-[10px] font-semibold">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-2 py-3 text-center bg-page rounded-xl border border-dashed border-line">
                  No projects added yet.
                </div>
              )}
            </div>
          </div>

          {/* ─── CERTIFICATIONS ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>📜</span> Certifications & Credentials
              </h2>
              <button
                onClick={() => { setEditTab('certifications'); setShowEditModal(true); }}
                className="btn-secondary btn-sm cursor-pointer"
              >
                + Manage Certifications
              </button>
            </div>

            <div className="space-y-3">
              {profile?.certifications && profile.certifications.length > 0 ? (
                profile.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-page border border-line flex items-center justify-between text-xs">
                    <div>
                      <h3 className="font-semibold text-ink">{cert.name}</h3>
                      <p className="text-[11px] text-ink-2">{cert.issuing_organization || cert.issuer} {cert.date ? `• ${cert.date}` : ''}</p>
                    </div>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-brand hover:underline font-semibold text-[11px]">
                        Verify Credential ↗
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-2 py-3 text-center bg-page rounded-xl border border-dashed border-line">
                  No certifications listed yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Candidate 360 QR, Coding Stats, Resume, Job Preferences, Social Links */}
        <div className="space-y-6">

          {/* ─── 360° CANDIDATE EVALUATION QR CODE CARD ─── */}
          <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/80 rounded-[10px] border-2 border-blue-300/80 p-5 shadow-card space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h2 className="font-bold text-sm text-slate-900 font-display">Candidate 360° QR Profile</h2>
              </div>
              <span className="badge-emerald text-[10px] font-black uppercase tracking-wider py-0.5 px-2">
                Live QR
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2.5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                  `${window.location.origin}/candidate-360/${user?.id || profile?.user_id || profile?.id || 'verified'}`
                )}`}
                alt="Candidate 360 QR Code"
                className="w-36 h-36 object-contain rounded-lg border border-slate-100 shadow-xs"
              />
              <div className="text-center px-1">
                <p className="text-[11px] font-bold text-slate-900">
                  {profile?.name || user?.full_name || 'Candidate'} · 360° Verified Profile
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-tight">
                  Scan with any camera or scanner to instantly open full ATS, coding &amp; skill scores.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to={`/candidate-360/${user?.id || profile?.user_id || profile?.id || 'verified'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm !text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
              >
                <span>🔍</span> Open 360° View
              </Link>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/candidate-360/${user?.id || profile?.user_id || profile?.id || 'verified'}`
                  navigator.clipboard.writeText(url)
                  toast.success('🔗 360° Profile Link copied!')
                }}
                className="btn-secondary btn-sm !text-xs font-bold flex items-center justify-center gap-1"
              >
                <span>📋</span> Copy Link
              </button>
            </div>
          </div>

          {/* ─── CODING PERFORMANCE STATS CARD ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <h2 className="font-semibold text-[15px] font-display text-ink">Coding Performance</h2>
              </div>
              <span className="badge badge-blue">
                Live PostgreSQL Data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-page border border-line p-3 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-ink-3 block tracking-wider">Problems Solved</span>
                <span className="text-2xl font-extrabold text-ok font-mono">{coding.problems_solved}</span>
                <div className="flex justify-center gap-1.5 text-[9px] text-ink-3 mt-1 font-mono">
                  <span className="text-ok">E:{coding.easy_solved || 0}</span>
                  <span className="text-warn">M:{coding.medium_solved || 0}</span>
                  <span className="text-err">H:{coding.hard_solved || 0}</span>
                </div>
              </div>

              <div className="bg-page border border-line p-3 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-ink-3 block tracking-wider">Coding Points</span>
                <span className="text-2xl font-extrabold text-brand font-mono">{coding.points || coding.total_points || 0}</span>
                <span className="text-[10px] text-ink-3 block mt-1">Earned Score</span>
              </div>

              <div className="bg-page border border-line p-3 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-ink-3 block tracking-wider">Accuracy</span>
                <span className="text-2xl font-extrabold text-brand font-mono">{coding.accuracy}%</span>
                <span className="text-[10px] text-ink-3 block mt-1">Pass Ratio</span>
              </div>

              <div className="bg-page border border-line p-3 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-ink-3 block tracking-wider">Global Rank</span>
                <span className="text-2xl font-extrabold text-warn font-mono">#{coding.rank || '-'}</span>
                <span className="text-[10px] text-ink-3 block mt-1">Leaderboard</span>
              </div>
            </div>

            <Link
              to="/candidate/coding"
              className="btn-primary btn-sm w-full"
            >
              <span>🚀</span> Open Coding Assessment Platform
            </Link>
          </div>

          {/* ─── RESUME SECTION ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>📄</span> Uploaded Resume
              </h2>
              {profile?.resume?.ats_score !== undefined && profile.resume.ats_score !== null && (
                <span className="badge badge-green font-mono">
                  ATS: {profile.resume.ats_score}%
                </span>
              )}
            </div>

            {profile?.resume ? (
              <div className="p-3.5 rounded-xl bg-page border border-line space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 font-bold flex items-center justify-center shrink-0">
                    PDF
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-ink truncate">{profile.resume.file_name}</div>
                    <div className="text-[11px] text-ink-3">
                      Uploaded {profile.resume.uploaded_at ? new Date(profile.resume.uploaded_at).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {profile.resume.file_url && (
                    <a
                      href={profile.resume.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm flex-1 text-center"
                    >
                      View Resume
                    </a>
                  )}
                  <Link
                    to="/candidate/resumes"
                    className="btn-primary btn-sm flex-1 text-center"
                  >
                    Analyze & Upload New
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-3">
                <p className="text-xs text-ink-2">No primary resume uploaded yet.</p>
                <Link
                  to="/candidate/resumes"
                  className="btn-primary btn-sm inline-block"
                >
                  Upload Resume
                </Link>
              </div>
            )}
          </div>

          {/* ─── JOB PREFERENCES ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>🎯</span> Job Preferences
              </h2>
              <button
                onClick={() => { setEditTab('preferences'); setShowEditModal(true); }}
                className="text-brand hover:text-brand-dark text-xs font-semibold hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs text-ink-2">
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-3">Preferred Role:</span>
                <span className="font-semibold text-ink">{profile?.preferred_role || 'AI/ML Engineer'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-3">Preferred Location:</span>
                <span className="font-semibold text-ink">{profile?.preferred_location || 'Bengaluru, Karnataka'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-3">Work Mode:</span>
                <span className="badge badge-blue">{profile?.work_mode || 'Remote'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line">
                <span className="text-ink-3">Job Type:</span>
                <span className="font-semibold text-ink">{profile?.preferred_job_type || 'Full-time'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-3">Expected Salary:</span>
                <span className="font-semibold text-ok font-mono">{profile?.salary_expectation || '12-18 LPA'}</span>
              </div>
            </div>
          </div>

          {/* ─── SOCIAL & PROFESSIONAL LINKS ─── */}
          <div className="bg-white rounded-[10px] border border-line p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 font-display">
                <span>🔗</span> Professional Profiles & Links
              </h2>
              <button
                onClick={() => { setEditTab('links'); setShowEditModal(true); }}
                className="text-brand hover:text-brand-dark text-xs font-semibold hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {profile?.github_url ? (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-[10px] bg-page hover:bg-brand-light border border-line text-ink transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2"><span>🐙</span> GitHub Profile</span>
                  <span className="text-brand text-[11px]">Visit ↗</span>
                </a>
              ) : (
                <div className="text-[11px] text-ink-3 p-2 bg-page rounded-[10px]">No GitHub link added</div>
              )}

              {profile?.linkedin_url ? (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-[10px] bg-brand-light hover:bg-brand-subtle border border-line text-ink transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2"><span>💼</span> LinkedIn Profile</span>
                  <span className="text-brand text-[11px]">Visit ↗</span>
                </a>
              ) : (
                <div className="text-[11px] text-ink-3 p-2 bg-page rounded-[10px]">No LinkedIn link added</div>
              )}

              {profile?.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-[10px] bg-page hover:bg-brand-light border border-line text-ink transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2"><span>🌐</span> Portfolio Website</span>
                  <span className="text-brand text-[11px]">Visit ↗</span>
                </a>
              )}

              {profile?.leetcode_url && (
                <a
                  href={profile.leetcode_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-[10px] bg-page hover:bg-brand-light border border-line text-ink transition-colors"
                >
                  <span className="font-semibold flex items-center gap-2"><span>⚡</span> LeetCode Profile</span>
                  <span className="text-brand text-[11px]">Visit ↗</span>
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── 3. EDIT PROFILE MODAL ────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[10px] border border-line shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-ink">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-page shrink-0">
              <div>
                <h2 className="text-lg font-bold text-ink font-display">Edit Candidate Profile</h2>
                <p className="text-xs text-ink-3">Update your professional details, credentials, and job preferences.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-line hover:bg-brand-light text-ink-2 hover:text-brand flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-line bg-page/70 px-4 gap-1 overflow-x-auto text-xs font-semibold shrink-0">
              {[
                { id: 'personal', label: '👤 Personal & Bio' },
                { id: 'education', label: '🎓 Education' },
                { id: 'experience', label: '💼 Experience' },
                { id: 'projects', label: '🚀 Projects' },
                { id: 'certifications', label: '📜 Certifications' },
                { id: 'preferences', label: '🎯 Preferences' },
                { id: 'links', label: '🔗 Links' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEditTab(tab.id)}
                  className={`px-3.5 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    editTab === tab.id
                      ? 'border-brand text-brand font-semibold bg-white'
                      : 'border-transparent text-ink-2 hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* TAB 1: PERSONAL */}
              {editTab === 'personal' && (
                <div className="space-y-4">
                  {/* Profile Picture Upload & Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-blue-200 shadow-sm shrink-0 flex items-center justify-center">
                      {formData.profile_picture_url ? (
                        <img
                          src={formData.profile_picture_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl font-display">
                          {(formData.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full text-left">
                      <div className="flex items-center justify-between">
                        <label className="field-label block font-bold text-slate-800 text-xs">Profile Picture</label>
                        {formData.profile_picture_url && (
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold hover:underline"
                          >
                            Remove Picture
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="btn-primary btn-sm cursor-pointer inline-flex items-center gap-1.5 text-xs py-1.5 px-3">
                          <span>📷</span> {uploadingPic ? 'Uploading...' : 'Upload Image File'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            disabled={uploadingPic}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-slate-400">or paste image URL:</span>
                      </div>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-... or image URL"
                        value={formData.profile_picture_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, profile_picture_url: e.target.value }))}
                        className="input w-full text-xs py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label block mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="field-label block mb-1">Professional Headline *</label>
                      <input
                        type="text"
                        placeholder="e.g. AI/ML Engineer | Full Stack Specialist"
                        value={formData.headline}
                        onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="field-label block mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="Bengaluru, Karnataka, India"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label block mb-1">About Me / Professional Summary</label>
                    <textarea
                      rows="4"
                      placeholder="Write a compelling summary about your software engineering experience and goals..."
                      value={formData.summary}
                      onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                      className="input w-full leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* TAB 2: EDUCATION */}
              {editTab === 'education' && (
                <div className="space-y-4">
                  <div className="bg-page p-4 rounded-[10px] border border-line space-y-3">
                    <h3 className="font-semibold text-xs text-ink">Add New Education</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Degree (e.g. B.E. Computer Science)"
                        value={newEdu.degree}
                        onChange={(e) => setNewEdu(prev => ({ ...prev, degree: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="College / Institution"
                        value={newEdu.college}
                        onChange={(e) => setNewEdu(prev => ({ ...prev, college: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="University (e.g. VTU)"
                        value={newEdu.university}
                        onChange={(e) => setNewEdu(prev => ({ ...prev, university: e.target.value }))}
                        className="input"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Year (e.g. 2027)"
                          value={newEdu.year}
                          onChange={(e) => setNewEdu(prev => ({ ...prev, year: e.target.value }))}
                          className="input"
                        />
                        <input
                          type="text"
                          placeholder="CGPA (e.g. 9.13)"
                          value={newEdu.cgpa}
                          onChange={(e) => setNewEdu(prev => ({ ...prev, cgpa: e.target.value }))}
                          className="input"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="btn-primary btn-sm"
                    >
                      + Add to Education List
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-ink">Current Education Entries:</h4>
                    {formData.education.map((edu, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-line rounded-[10px]">
                        <div>
                          <div className="font-semibold text-ink">{edu.degree}</div>
                          <div className="text-ink-2 text-[11px]">{edu.college} • {edu.year} • CGPA: {edu.cgpa}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-err font-semibold hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: EXPERIENCE */}
              {editTab === 'experience' && (
                <div className="space-y-4">
                  <div className="bg-page p-4 rounded-[10px] border border-line space-y-3">
                    <h3 className="font-semibold text-xs text-ink">Add Work Experience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={newExp.company}
                        onChange={(e) => setNewExp(prev => ({ ...prev, company: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={newExp.role}
                        onChange={(e) => setNewExp(prev => ({ ...prev, role: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Start Date (e.g. Jun 2024)"
                        value={newExp.start_date}
                        onChange={(e) => setNewExp(prev => ({ ...prev, start_date: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="End Date (e.g. Dec 2024 or Present)"
                        value={newExp.end_date}
                        onChange={(e) => setNewExp(prev => ({ ...prev, end_date: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <textarea
                      placeholder="Role description, responsibilities and key achievements..."
                      rows="2"
                      value={newExp.description}
                      onChange={(e) => setNewExp(prev => ({ ...prev, description: e.target.value }))}
                      className="input w-full"
                    ></textarea>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="btn-primary btn-sm"
                    >
                      + Add to Experience List
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-ink">Current Experience Entries:</h4>
                    {formData.experience.map((exp, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-white border border-line rounded-[10px]">
                        <div>
                          <div className="font-semibold text-ink">{exp.role || exp.title} at {exp.company}</div>
                          <div className="text-ink-3 text-[11px]">{exp.start_date} – {exp.end_date}</div>
                          <div className="text-ink-2 mt-1">{exp.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-err font-semibold hover:underline cursor-pointer shrink-0 ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {editTab === 'projects' && (
                <div className="space-y-4">
                  <div className="bg-page p-4 rounded-[10px] border border-line space-y-3">
                    <h3 className="font-semibold text-xs text-ink">Add Technical Project</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Project Name *"
                        value={newProj.name}
                        onChange={(e) => setNewProj(prev => ({ ...prev, name: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Technologies (comma-separated, e.g. Python, FastAPI, React)"
                        value={newProj.technologies}
                        onChange={(e) => setNewProj(prev => ({ ...prev, technologies: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="GitHub Repository URL"
                        value={newProj.github_url}
                        onChange={(e) => setNewProj(prev => ({ ...prev, github_url: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Live Demo URL"
                        value={newProj.live_demo_url}
                        onChange={(e) => setNewProj(prev => ({ ...prev, live_demo_url: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <textarea
                      placeholder="Project overview and features..."
                      rows="2"
                      value={newProj.description}
                      onChange={(e) => setNewProj(prev => ({ ...prev, description: e.target.value }))}
                      className="input w-full"
                    ></textarea>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="btn-primary btn-sm"
                    >
                      + Add to Projects List
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-ink">Current Projects:</h4>
                    {formData.projects.map((proj, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-white border border-line rounded-[10px]">
                        <div>
                          <div className="font-semibold text-ink">{proj.name}</div>
                          <div className="text-ink-2 text-[11px]">{proj.description}</div>
                          <div className="text-brand text-[10px] font-mono mt-1">{Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="text-err font-semibold hover:underline cursor-pointer shrink-0 ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: CERTIFICATIONS */}
              {editTab === 'certifications' && (
                <div className="space-y-4">
                  <div className="bg-page p-4 rounded-[10px] border border-line space-y-3">
                    <h3 className="font-semibold text-xs text-ink">Add Certification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Certification Title *"
                        value={newCert.name}
                        onChange={(e) => setNewCert(prev => ({ ...prev, name: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Issuing Organization (e.g. AWS, Coursera)"
                        value={newCert.issuing_organization}
                        onChange={(e) => setNewCert(prev => ({ ...prev, issuing_organization: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Date Issued (e.g. Aug 2025)"
                        value={newCert.date}
                        onChange={(e) => setNewCert(prev => ({ ...prev, date: e.target.value }))}
                        className="input"
                      />
                      <input
                        type="text"
                        placeholder="Credential Verification URL"
                        value={newCert.credential_url}
                        onChange={(e) => setNewCert(prev => ({ ...prev, credential_url: e.target.value }))}
                        className="input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="btn-primary btn-sm"
                    >
                      + Add to Certifications
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-ink">Current Certifications:</h4>
                    {formData.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-line rounded-[10px]">
                        <div>
                          <div className="font-semibold text-ink">{cert.name}</div>
                          <div className="text-ink-2 text-[11px]">{cert.issuing_organization || cert.issuer} • {cert.date}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(idx)}
                          className="text-err font-semibold hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: PREFERENCES */}
              {editTab === 'preferences' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label block mb-1">Preferred Job Role</label>
                      <input
                        type="text"
                        placeholder="e.g. AI/ML Engineer, Full Stack Developer"
                        value={formData.preferred_role}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_role: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="field-label block mb-1">Preferred Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, Remote, Mumbai"
                        value={formData.preferred_location}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_location: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="field-label block mb-1">Work Mode</label>
                      <select
                        value={formData.work_mode}
                        onChange={(e) => setFormData(prev => ({ ...prev, work_mode: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label block mb-1">Job Type</label>
                      <select
                        value={formData.preferred_job_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_job_type: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label block mb-1">Salary Expectation</label>
                      <input
                        type="text"
                        placeholder="e.g. 12-18 LPA"
                        value={formData.salary_expectation}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary_expectation: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: LINKS */}
              {editTab === 'links' && (
                <div className="space-y-4">
                  <div>
                    <label className="field-label block mb-1">GitHub Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/yourname"
                      value={formData.github_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="field-label block mb-1">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="field-label block mb-1">Personal Portfolio / Website URL</label>
                    <input
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolio_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="field-label block mb-1">LeetCode / Coding Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://leetcode.com/u/yourname"
                      value={formData.leetcode_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, leetcode_url: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-line flex justify-end gap-3 bg-page shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary btn-sm cursor-pointer flex items-center gap-1.5"
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
