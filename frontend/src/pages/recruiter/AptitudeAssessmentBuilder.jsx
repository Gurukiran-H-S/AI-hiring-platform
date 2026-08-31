import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const AptitudeAssessmentBuilder = () => {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAssessments, setLoadingAssessments] = useState(false)

  // Creation Wizard state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '1. Choose the best answer for each multiple-choice question.\n2. Negative marking applies for incorrect answers.\n3. Complete and submit before the timer expires.',
    duration_minutes: 30,
    total_marks: 30,
    passing_score: 60,
    negative_marking: 0.5,
    max_attempts: 1,
    shuffle_questions: true,
    shuffle_options: true,
    password: '',
    confirm_password: '',
    question_source: 'bank', // 'bank', 'manual', 'import'
    selected_bank_ids: [],
    manual_questions: [],
    import_json: ''
  })

  // Question Bank State
  const [questionBank, setQuestionBank] = useState([])
  const [bankCategoryFilter, setBankCategoryFilter] = useState('All')

  // Manual Question Builder State
  const [manualQ, setManualQ] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '0',
    marks: 2,
    negative_marks: 0.5,
    category: 'General Ability',
    difficulty: 'Medium',
    explanation: ''
  })

  // Password Verification Modal State
  const [passwordModal, setPasswordModal] = useState({
    open: false,
    assessmentId: null,
    action: null, // 'publish', 'regenerate_code', 'delete'
    password: '',
    loading: false
  })

  // Results / Analytics Modal State
  const [resultsModal, setResultsModal] = useState({
    open: false,
    loading: true,
    data: null
  })

  // 1. Fetch Recruiter Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/recruiter/jobs')
        setJobs(data || [])
        if (data && data.length > 0) {
          setSelectedJob(data[0])
        }
      } catch (err) {
        console.error('Error fetching jobs:', err)
        toast.error('Failed to load job listings')
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  // 2. Fetch Question Bank
  useEffect(() => {
    const fetchBank = async () => {
      try {
        const { data } = await api.get('/recruiter/aptitude-assessments/question-bank')
        setQuestionBank(data || [])
        // Pre-select first 15 questions by default
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            selected_bank_ids: data.slice(0, 15).map(q => q.id)
          }))
        }
      } catch (err) {
        console.error('Error fetching question bank:', err)
      }
    }
    fetchBank()
  }, [])

  // 3. Fetch Assessments for Selected Job
  const fetchAssessments = async (jobId) => {
    if (!jobId) return
    setLoadingAssessments(true)
    try {
      const { data } = await api.get(`/recruiter/jobs/${jobId}/aptitude-assessments`)
      setAssessments(data || [])
    } catch (err) {
      console.error('Error loading assessments:', err)
      toast.error('Failed to load assessments for this job')
    } finally {
      setLoadingAssessments(false)
    }
  }

  useEffect(() => {
    if (selectedJob?.id) {
      fetchAssessments(selectedJob.id)
    } else {
      setAssessments([])
    }
  }, [selectedJob])

  // Handle Manual Question Addition
  const handleAddManualQuestion = () => {
    if (!manualQ.question_text.trim()) {
      toast.error('Please enter the question text')
      return
    }
    if (manualQ.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all 4 options')
      return
    }

    setFormData(prev => ({
      ...prev,
      manual_questions: [...prev.manual_questions, { ...manualQ, id: `MANUAL_${Date.now()}` }]
    }))

    setManualQ({
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '0',
      marks: 2,
      negative_marks: 0.5,
      category: 'General Ability',
      difficulty: 'Medium',
      explanation: ''
    })
    toast.success('Question added to assessment set')
  }

  // Handle Create Assessment Submit
  const handleCreateAssessment = async () => {
    if (!selectedJob) {
      toast.error('Please select an active job first')
      return
    }
    if (!formData.title.trim()) {
      toast.error('Please enter an assessment title')
      return
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Security password must be at least 6 characters')
      return
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    let finalQuestions = []
    if (formData.question_source === 'bank') {
      if (formData.selected_bank_ids.length === 0) {
        toast.error('Please select at least 1 question from the bank')
        return
      }
      finalQuestions = questionBank
        .filter(q => formData.selected_bank_ids.includes(q.id))
        .map(q => ({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks,
          negative_marks: formData.negative_marking,
          category: q.category,
          difficulty: q.difficulty,
          explanation: q.explanation
        }))
    } else if (formData.question_source === 'manual') {
      if (formData.manual_questions.length === 0) {
        toast.error('Please add at least 1 manual question')
        return
      }
      finalQuestions = formData.manual_questions
    } else if (formData.question_source === 'import') {
      try {
        const parsed = JSON.parse(formData.import_json)
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Import must be a non-empty JSON array of questions')
        }
        finalQuestions = parsed
      } catch (err) {
        toast.error('Invalid JSON format for question import')
        return
      }
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        password: formData.password,
        duration_minutes: Number(formData.duration_minutes),
        total_marks: Number(formData.total_marks || finalQuestions.length * 2),
        passing_score: Number(formData.passing_score),
        negative_marking: Number(formData.negative_marking),
        max_attempts: Number(formData.max_attempts),
        shuffle_questions: formData.shuffle_questions,
        shuffle_options: formData.shuffle_options,
        questions: finalQuestions
      }

      await api.post(`/recruiter/jobs/${selectedJob.id}/aptitude-assessments`, payload)
      toast.success('Aptitude Assessment created successfully!')
      setShowCreateModal(false)
      setWizardStep(1)
      fetchAssessments(selectedJob.id)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to create assessment')
    }
  }

  // Handle Password Verification Actions (Publish, Regenerate Code, Delete)
  const handleVerifyPasswordAction = async () => {
    if (!passwordModal.password) {
      toast.error('Please enter the assessment security password')
      return
    }

    setPasswordModal(prev => ({ ...prev, loading: true }))
    try {
      if (passwordModal.action === 'publish') {
        const { data } = await api.post(`/recruiter/aptitude-assessments/${passwordModal.assessmentId}/publish`, {
          password: passwordModal.password
        })
        toast.success(`Assessment PUBLISHED! Launch Code: ${data.launch_code}`)
        setPasswordModal({ open: false, assessmentId: null, action: null, password: '', loading: false })
        fetchAssessments(selectedJob.id)
      } else if (passwordModal.action === 'regenerate_code') {
        const { data } = await api.post(`/recruiter/aptitude-assessments/${passwordModal.assessmentId}/launch-code`, {
          password: passwordModal.password
        })
        toast.success(`New Launch Code Generated: ${data.launch_code}`)
        setPasswordModal({ open: false, assessmentId: null, action: null, password: '', loading: false })
        fetchAssessments(selectedJob.id)
      } else if (passwordModal.action === 'delete') {
        await api.delete(`/recruiter/aptitude-assessments/${passwordModal.assessmentId}`, {
          params: { password: passwordModal.password }
        })
        toast.success('Assessment deleted successfully')
        setPasswordModal({ open: false, assessmentId: null, action: null, password: '', loading: false })
        fetchAssessments(selectedJob.id)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Incorrect security password or action failed')
      setPasswordModal(prev => ({ ...prev, loading: false }))
    }
  }

  // Open Results Analytics View
  const handleOpenResults = async (assessmentId) => {
    setResultsModal({ open: true, loading: true, data: null })
    try {
      const { data } = await api.get(`/recruiter/aptitude-assessments/${assessmentId}/results`)
      setResultsModal({ open: true, loading: false, data })
    } catch (err) {
      toast.error('Failed to load candidate assessment results')
      setResultsModal({ open: false, loading: false, data: null })
    }
  }

  const filteredQuestions = bankCategoryFilter === 'All'
    ? questionBank
    : questionBank.filter(q => q.category === bankCategoryFilter)

  return (
    <div className="page-enter pb-16 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="card bg-gradient-to-r from-teal-50/70 via-blue-50/50 to-indigo-50/60 border border-teal-100/90 p-6 sm:p-8 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/90 px-3 py-0.5 rounded-full border border-teal-200">
                Recruiter Portal
              </span>
              <span className="badge badge-emerald font-bold">Secure Job-Specific Builder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              🧠 Aptitude Assessment Builder
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Create, configure, and schedule timed aptitude examinations for your specific job postings. 
              Protected by recruiter security passwords and randomized 6-digit candidate Launch Codes.
            </p>
          </div>

          <button
            onClick={() => {
              if (!selectedJob) {
                toast.error('Please select an active job first')
                return
              }
              setFormData(prev => ({ ...prev, title: `${selectedJob.title} Aptitude Assessment` }))
              setShowCreateModal(true)
            }}
            className="btn-primary flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-5 !bg-teal-600 hover:!bg-teal-700 !border-teal-600 shadow-xs shrink-0"
          >
            <span>+</span> Create Job Assessment
          </button>
        </div>
      </div>

      {/* Job Selector Bar or Zero Jobs Card */}
      {jobs.length === 0 ? (
        <div className="card py-12 text-center space-y-3 bg-white border border-slate-200 rounded-2xl">
          <div className="text-4xl">💼</div>
          <h3 className="text-base font-bold text-slate-800">No Job Postings Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You must post an active job listing before creating and scheduling aptitude assessments for candidates.
          </p>
          <Link to="/recruiter/jobs/create" className="btn-primary btn-sm text-xs font-bold inline-block">
            + Post Your First Job
          </Link>
        </div>
      ) : (
        <>
          <div className="card p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Job Posting:</span>
              <select
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const j = jobs.find(job => job.id === e.target.value)
                  setSelectedJob(j)
                }}
                className="input text-xs font-bold text-slate-900 bg-slate-50 border-slate-300 py-1.5 px-3 rounded-lg"
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.company || 'Active'})
                  </option>
                ))}
              </select>
            </div>

            {selectedJob && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Job ID: <span className="font-mono text-slate-700">{selectedJob.id.slice(0, 8)}...</span></span>
                <span>•</span>
                <span className="badge badge-blue">{selectedJob.job_type || 'Full-time'}</span>
              </div>
            )}
          </div>

          {/* Assessments List for Selected Job */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="section-title !mb-0 text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>📋</span> Configured Assessments for {selectedJob?.title || 'Job'}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} configured
              </span>
            </div>

            {loadingAssessments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="skeleton h-44 rounded-2xl"></div>
                <div className="skeleton h-44 rounded-2xl"></div>
              </div>
            ) : assessments.length === 0 ? (
              <div className="card py-12 text-center space-y-3">
                <div className="text-4xl">📝</div>
                <h3 className="text-base font-bold text-slate-800">No Aptitude Assessments Created Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't built an aptitude test for this job opening. Build your assessment using the curated question bank or manual questions.
                </p>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, title: `${selectedJob?.title || ''} Aptitude Assessment` }))
                    setShowCreateModal(true)
                  }}
                  className="btn-primary btn-sm text-xs font-bold"
                >
                  + Create Assessment for {selectedJob?.title}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((a) => (
                  <div
                    key={a.id}
                    className="card border-2 border-slate-200 hover:border-teal-300 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`badge ${a.status === 'PUBLISHED' ? 'badge-emerald' : 'badge-amber'} font-bold text-[11px]`}>
                          {a.status === 'PUBLISHED' ? '✓ PUBLISHED' : '✏️ DRAFT'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {a.total_questions} Questions
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                          {a.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Duration: <strong>{a.duration_minutes} mins</strong> · Total Marks: <strong>{a.total_marks}</strong>
                        </p>
                      </div>

                      {/* Config details */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Passing Score</span>
                          <span className="font-bold text-slate-800">{a.passing_score}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Negative Marking</span>
                          <span className="font-bold text-rose-600">-{a.negative_marking} mark</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidates</span>
                          <span className="font-bold text-slate-800">{a.completed_attempts} Completed</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Attempts</span>
                          <span className="font-bold text-slate-800">{a.total_attempts}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      {a.status === 'DRAFT' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPasswordModal({ open: true, assessmentId: a.id, action: 'publish', password: '', loading: false })}
                            className="btn-primary flex-1 py-2 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                          >
                            🚀 Publish & Generate Code
                          </button>
                          <button
                            onClick={() => setPasswordModal({ open: true, assessmentId: a.id, action: 'delete', password: '', loading: false })}
                            className="btn-danger py-2 px-3 text-xs font-bold"
                            title="Delete Assessment"
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenResults(a.id)}
                            className="btn-primary flex-1 py-2 text-xs font-bold !bg-blue-600 hover:!bg-blue-700"
                          >
                            📊 Results
                          </button>
                          <button
                            onClick={() => setPasswordModal({ open: true, assessmentId: a.id, action: 'regenerate_code', password: '', loading: false })}
                            className="btn-secondary py-2 px-3 text-xs font-bold"
                            title="Regenerate Launch Code"
                          >
                            🔄 Code
                          </button>
                          <button
                            onClick={() => setPasswordModal({ open: true, assessmentId: a.id, action: 'delete', password: '', loading: false })}
                            className="btn-danger py-2 px-3 text-xs font-bold"
                            title="Delete Assessment"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE ASSESSMENT WIZARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 rounded-2xl shadow-xl bg-white border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Assessment Creation Wizard</span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Step {wizardStep} of 4: {wizardStep === 1 ? 'Assessment Details & Timing' : wizardStep === 2 ? 'Question Source & Selection' : wizardStep === 3 ? 'Security Password & PIN' : 'Review & Save'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Assessment Info & Schedule */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="label font-bold text-slate-700">Assessment Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input text-xs font-semibold"
                    placeholder="e.g. Python Developer Technical Aptitude"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label font-bold text-slate-700">Duration (Minutes) *</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Passing Score (%) *</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                      className="input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Negative Marking Penalty</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={formData.negative_marking}
                      onChange={(e) => setFormData({ ...formData, negative_marking: e.target.value })}
                      className="input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Maximum Allowed Attempts</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                      className="input text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="label font-bold text-slate-700">Instructions for Candidates</label>
                  <textarea
                    rows={3}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="input text-xs font-normal"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_questions}
                      onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                      className="rounded text-teal-600"
                    />
                    <span className="font-semibold text-slate-700">Shuffle Questions for each candidate</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Question Source Selection & Editor */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="label font-bold text-slate-700">Choose Question Source</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, question_source: 'bank' })}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${
                        formData.question_source === 'bank'
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      📚 Curated Question Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, question_source: 'manual' })}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${
                        formData.question_source === 'manual'
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      ✍️ Custom Manual Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, question_source: 'import' })}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${
                        formData.question_source === 'import'
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      📤 External JSON Import
                    </button>
                  </div>
                </div>

                {/* Question Bank Selector */}
                {formData.question_source === 'bank' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {['All', 'Numerical Ability', 'Verbal Ability', 'Reasoning Ability', 'Technical'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setBankCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              bankCategoryFilter === cat ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <span className="font-bold text-slate-700">
                        {formData.selected_bank_ids.length} selected
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 p-2 rounded-xl">
                      {filteredQuestions.map((q) => {
                        const isSelected = formData.selected_bank_ids.includes(q.id)
                        return (
                          <div
                            key={q.id}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                selected_bank_ids: isSelected
                                  ? prev.selected_bank_ids.filter(id => id !== q.id)
                                  : [...prev.selected_bank_ids, q.id]
                              }))
                            }}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected ? 'bg-teal-50/70 border-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 text-teal-600 rounded"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="badge badge-blue text-[10px]">{q.category}</span>
                                <span className="badge badge-gray text-[10px]">{q.difficulty}</span>
                                <span className="text-[11px] text-slate-400 font-mono">+{q.marks} / -{q.negative_marks}</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-800">{q.question_text}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Question Creator */}
                {formData.question_source === 'manual' && (
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900">Add Question to Assessment Set</h4>
                    <div>
                      <input
                        type="text"
                        placeholder="Enter Question Text *"
                        value={manualQ.question_text}
                        onChange={(e) => setManualQ({ ...manualQ, question_text: e.target.value })}
                        className="input text-xs font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {manualQ.options.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + i)} *`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...manualQ.options]
                            newOpts[i] = e.target.value
                            setManualQ({ ...manualQ, options: newOpts })
                          }}
                          className="input text-xs"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="label text-[11px] font-bold">Correct Option</label>
                        <select
                          value={manualQ.correct_answer}
                          onChange={(e) => setManualQ({ ...manualQ, correct_answer: e.target.value })}
                          className="input text-xs font-bold"
                        >
                          <option value="0">Option A</option>
                          <option value="1">Option B</option>
                          <option value="2">Option C</option>
                          <option value="3">Option D</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-[11px] font-bold">Category</label>
                        <select
                          value={manualQ.category}
                          onChange={(e) => setManualQ({ ...manualQ, category: e.target.value })}
                          className="input text-xs font-bold"
                        >
                          <option value="Numerical Ability">Numerical Ability</option>
                          <option value="Verbal Ability">Verbal Ability</option>
                          <option value="Reasoning Ability">Reasoning Ability</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-[11px] font-bold">Marks</label>
                        <input
                          type="number"
                          value={manualQ.marks}
                          onChange={(e) => setManualQ({ ...manualQ, marks: Number(e.target.value) })}
                          className="input text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="btn-primary btn-sm text-xs font-bold w-full"
                    >
                      + Add Question ({formData.manual_questions.length} Added So Far)
                    </button>
                  </div>
                )}

                {/* Import JSON */}
                {formData.question_source === 'import' && (
                  <div>
                    <label className="label font-bold text-slate-700">Paste JSON Question Array</label>
                    <textarea
                      rows={5}
                      placeholder='[{"question_text": "...", "options": ["A", "B", "C", "D"], "correct_answer": "0", "marks": 2, "category": "Technical"}]'
                      value={formData.import_json}
                      onChange={(e) => setFormData({ ...formData, import_json: e.target.value })}
                      className="input text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Security Password & PIN */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <span className="text-base shrink-0">🔒</span>
                  <p className="leading-relaxed">
                    <strong>Recruiter Security Password:</strong> Set a private assessment password or 6-digit PIN. 
                    You will be required to enter this password whenever you edit questions, modify timing, or generate candidate Launch Codes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label font-bold text-slate-700">Assessment Security Password / PIN *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters or PIN"
                      className="input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="label font-bold text-slate-700">Confirm Password / PIN *</label>
                    <input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Re-enter security password"
                      className="input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Publish */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{formData.title}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Job Posting</span>
                      <span className="font-semibold text-slate-800">{selectedJob?.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Duration</span>
                      <span className="font-semibold text-slate-800">{formData.duration_minutes} Minutes</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Passing Score</span>
                      <span className="font-semibold text-slate-800">{formData.passing_score}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Negative Mark</span>
                      <span className="font-semibold text-rose-600">-{formData.negative_marking}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Question Count</span>
                      <span className="font-semibold text-slate-800">
                        {formData.question_source === 'bank'
                          ? formData.selected_bank_ids.length
                          : formData.manual_questions.length} Questions
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold block">Security Password</span>
                      <span className="font-semibold text-emerald-600">✓ Configured</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="btn-secondary text-xs font-bold"
                >
                  ← Back
                </button>
              ) : (
                <div></div>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="btn-primary text-xs font-bold"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateAssessment}
                  className="btn-primary text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
                >
                  ✓ Save & Create Assessment
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* PASSWORD VERIFICATION MODAL */}
      {passwordModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-4 rounded-2xl shadow-xl bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>🔒</span> Security Authorization Required
              </h3>
              <button
                onClick={() => setPasswordModal({ open: false, assessmentId: null, action: null, password: '', loading: false })}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the security password configured for this assessment to {
                passwordModal.action === 'publish'
                  ? 'publish and generate candidate Launch Codes'
                  : passwordModal.action === 'delete'
                  ? 'permanently delete this assessment'
                  : 'regenerate a new Launch Code'
              }.
            </p>

            <div>
              <label className="label text-xs font-bold text-slate-700">Assessment Password / PIN</label>
              <input
                type="password"
                value={passwordModal.password}
                onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasswordAction()}
                placeholder="Enter security password"
                className="input text-xs font-semibold"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasswordModal({ open: false, assessmentId: null, action: null, password: '', loading: false })}
                className="btn-secondary text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={passwordModal.loading}
                onClick={handleVerifyPasswordAction}
                className={`btn-primary text-xs font-bold ${
                  passwordModal.action === 'delete'
                    ? '!bg-rose-600 hover:!bg-rose-700 !border-rose-600'
                    : '!bg-teal-600 hover:!bg-teal-700'
                }`}
              >
                {passwordModal.loading ? 'Verifying...' : passwordModal.action === 'delete' ? 'Delete Assessment' : 'Verify & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS & CANDIDATE RANKINGS MODAL */}
      {resultsModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 space-y-5 rounded-2xl shadow-xl bg-white border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Assessment Analytics & Leaderboard</span>
                <h3 className="text-xl font-extrabold text-slate-900">{resultsModal.data?.title || 'Assessment Results'}</h3>
              </div>
              <button
                onClick={() => setResultsModal({ open: false, loading: false, data: null })}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {resultsModal.loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading candidate scores...</div>
            ) : (
              <div className="space-y-6">
                
                {/* Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Score</span>
                    <span className="text-lg font-extrabold text-blue-600">{resultsModal.data?.summary?.average_score}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pass Rate</span>
                    <span className="text-lg font-extrabold text-emerald-600">{resultsModal.data?.summary?.pass_rate}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Highest / Lowest</span>
                    <span className="text-lg font-extrabold text-slate-800">{resultsModal.data?.summary?.highest_score}% / {resultsModal.data?.summary?.lowest_score}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Launch Code</span>
                    <span className="text-lg font-extrabold font-mono text-amber-600">{resultsModal.data?.active_launch_code || 'N/A'}</span>
                  </div>
                </div>

                {/* Candidate Ranking Table */}
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Candidate Submission Rankings</h4>
                  {resultsModal.data?.candidate_rankings?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
                      No candidate submissions recorded yet for this assessment.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Candidate</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Accuracy</th>
                            <th className="p-3">Correct / Wrong</th>
                            <th className="p-3">Time</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {resultsModal.data?.candidate_rankings?.map((cand) => (
                            <tr key={cand.candidate_id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-extrabold font-mono text-slate-800">#{cand.rank}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{cand.candidate_name}</div>
                                <div className="text-[10px] text-slate-400">{cand.candidate_email}</div>
                              </td>
                              <td className="p-3 font-extrabold text-blue-600 font-mono">{cand.percentage}%</td>
                              <td className="p-3 font-bold text-slate-700">{cand.accuracy}%</td>
                              <td className="p-3 text-[11px] text-slate-600">
                                <span className="text-emerald-600 font-bold">+{cand.correct_count}</span> / <span className="text-rose-600 font-bold">-{cand.wrong_count}</span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{cand.time_taken_formatted}</td>
                              <td className="p-3">
                                <span className={`badge ${cand.is_passed ? 'badge-emerald' : 'badge-rose'} text-[10px] font-bold`}>
                                  {cand.is_passed ? 'PASSED' : 'FAILED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
