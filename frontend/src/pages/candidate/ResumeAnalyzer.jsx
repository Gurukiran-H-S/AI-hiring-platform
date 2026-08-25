import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const atsColor = (score) => (score >= 80 ? 'progress-green' : score >= 60 ? 'progress-orange' : 'progress-red')
const atsLabel = (score) => (score >= 80 ? 'Good Match' : score >= 60 ? 'Fair Match' : 'Needs Improvement')

export const ResumeAnalyzer = ({ onPrimaryChange }) => {
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [analysisDetails, setAnalysisDetails] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [showImprovementModal, setShowImprovementModal] = useState(false)
  const [showLowAtsPopup, setShowLowAtsPopup] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState(null)

  // AI Cover Letter
  const [jobDescription, setJobDescription] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [generatingLetter, setGeneratingLetter] = useState(false)

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes/')
      const list = Array.isArray(data) ? data : []
      setResumes(list)
      if (list.length > 0) {
        loadResumeAnalysis(list[0].id)
      } else {
        setSelectedResume(null)
        setAnalysisDetails(null)
      }
    } catch (err) {
      console.warn('Could not load resumes:', err)
      if (err.response?.status && err.response.status !== 404 && err.response.status !== 401) {
        toast.error(err.response?.data?.detail || 'Unable to load resumes from server.')
      }
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const loadResumeAnalysis = async (id, autoAlert = true) => {
    try {
      const { data } = await api.get(`/resumes/${id}`)
      setAnalysisDetails(data)
      setSelectedResume(data)
      const score = data.ats_score ?? 0
      if (autoAlert && score > 0 && score < 60) {
        setShowLowAtsPopup(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
      setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''))
    formData.append('is_primary', resumes.length === 0)

    try {
      const { data } = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Resume parsed & analyzed!')
      setFile(null)
      setTitle('')
      setResumes((prev) => [data, ...prev.filter((r) => r.id !== data.id)])
      await loadResumeAnalysis(data.id, true)
      if (onPrimaryChange) onPrimaryChange()
    } catch (err) {
      console.error('Resume upload error:', err)
      let msg = 'Failed to process resume'
      if (typeof err.response?.data?.detail === 'string') {
        msg = err.response.data.detail
      } else if (Array.isArray(err.response?.data?.detail)) {
        msg = err.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
      } else if (err.message) {
        msg = err.message
      }
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return
    try {
      await api.delete(`/resumes/${resumeToDelete.id}`)
      toast.success(`Resume '${resumeToDelete.title}' deleted.`)
      const updated = resumes.filter(r => r.id !== resumeToDelete.id)
      setResumes(updated)
      if (updated.length > 0) loadResumeAnalysis(updated[0].id)
      else { setSelectedResume(null); setAnalysisDetails(null) }
      setResumeToDelete(null)
    } catch (err) {
      toast.error('Failed to delete resume.')
    }
  }

  const handleSetPrimary = async (resumeId) => {
    try {
      await api.put(`/resumes/${resumeId}/primary`)
      toast.success('Set as primary resume!')
      fetchResumes()
      if (onPrimaryChange) onPrimaryChange()
    } catch (err) {
      toast.error('Failed to set primary resume.')
    }
  }

  const generateCoverLetter = async () => {
    if (!jobDescription) return toast.error('Please enter a Job Description')
    setGeneratingLetter(true)
    try {
      await new Promise(r => setTimeout(r, 1200))
      const simulatedLetter = `Dear Hiring Manager,

I am writing to express my interest in this role. My background aligns closely with key technical requirements including ${selectedResume?.parsed_skills?.slice(0, 5).join(', ') || 'software development'}.

My hands-on project experience in "${selectedResume?.parsed_projects?.[0]?.name || 'Software Development'}" demonstrates my capacity to build scalable applications.

Sincerely,
${selectedResume?.parsed_name || 'Applicant'}`
      setCoverLetter(simulatedLetter)
      toast.success('Cover letter generated!')
    } finally {
      setGeneratingLetter(false)
    }
  }

  const atsScore = analysisDetails?.ats_score || selectedResume?.ats_score || 0
  const isBelowThreshold = atsScore > 0 && atsScore < 60
  const breakdown = analysisDetails?.score_breakdown

  return (
    <div className="page-enter">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-1">Resume Analysis</h1>
          <p className="text-sm text-ink-2">Upload your resume for an explainable ATS evaluation.</p>
        </div>
        {atsScore > 0 && (
          <button onClick={() => setShowImprovementModal(true)} className="btn-secondary btn-sm">
            ⚡ Improve My ATS Score
          </button>
        )}
      </header>

      {/* Low ATS inline warning banner */}
      {isBelowThreshold && (
        <div className="bg-warn-bg border border-warn/20 rounded-[10px] p-5 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-warn text-sm">Resume Needs Improvement</h3>
              <p className="text-[13px] text-ink-2 mt-1">
                Your ATS score is <strong>{atsScore}%</strong>. Recommended skills to add:
              </p>
              {analysisDetails?.missing_skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {analysisDetails.missing_skills.map((skill) => (
                    <a
                      key={skill}
                      href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}+tutorial`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge bg-white !text-warn border border-warn/25 hover:border-warn transition-colors"
                    >
                      + {skill}
                    </a>
                  ))}
                </div>
              )}

              {analysisDetails?.recommended_market_skills?.length > 0 && (
                <>
                  <p className="text-[13px] text-ink-2 mt-4">
                    🔥 <strong>{analysisDetails.recommended_market_skills.length} market-trending skills</strong> not on your resume
                    (ranked by real job-market demand) — click any skill to open a free beginner course on YouTube:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {analysisDetails.recommended_market_skills.map((rec) => (
                      <a
                        key={rec.skill}
                        href={rec.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Beginner tutorial for ${rec.skill}${rec.growth ? ` · demand ${rec.growth}` : ''}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-brand border border-brand/30 hover:bg-brand hover:text-white transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12z"/></svg>
                        {rec.skill}
                        {rec.growth && <span className="text-[10px] opacity-75">{rec.growth}</span>}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowImprovementModal(true)} className="btn-primary btn-sm">Improve Skills</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: upload + list */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="section-title !text-[16px] mb-4">Upload Resume</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <label className="block border-2 border-dashed border-line rounded-lg p-8 text-center hover:border-brand hover:bg-brand-subtle transition-all cursor-pointer">
                <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
                <svg className="w-9 h-9 mx-auto mb-2.5 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                <p className="text-[13px] font-medium text-ink">{file ? file.name : 'Click to upload'}</p>
                <p className="text-xs text-ink-3 mt-0.5">PDF or DOCX, max 10MB</p>
              </label>
              {file && (
                <input type="text" placeholder="Resume Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
              )}
              <button type="submit" disabled={uploading || !file} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? 'Analyzing…' : 'Analyze Resume'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="section-title !text-[16px] mb-4">My Resumes</h2>
            {resumes.length === 0 ? (
              <div className="empty-state !py-6">
                <h3>No Resume Uploaded</h3>
                <p className="text-[13px] mb-4">Upload your resume to start AI analysis.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => loadResumeAnalysis(r.id)}
                    className={`rounded-lg border px-3.5 py-3 cursor-pointer transition-all ${
                      selectedResume?.id === r.id
                        ? 'bg-brand-light border-brand/30'
                        : 'bg-white border-line hover:bg-page'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink truncate">{r.title}</span>
                      <span className={`badge ${(r.ats_score || 0) >= 80 ? 'badge-green' : (r.ats_score || 0) >= 60 ? 'badge-orange' : 'badge-red'}`}>
                        {r.ats_score ?? 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      {r.is_primary && <span className="badge badge-blue">★ Primary</span>}
                      {!r.is_primary && (
                        <button onClick={(e) => { e.stopPropagation(); handleSetPrimary(r.id) }} className="text-brand hover:underline font-medium">
                          Set Primary
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setResumeToDelete(r) }} className="text-err hover:underline ml-auto">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: analysis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedResume ? (
            <>
              {/* ATS Score card */}
              <div className="card">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="section-title !text-[16px]">ATS Resume Score</h2>
                  <span className={`badge ${atsScore >= 80 ? 'badge-green' : atsScore >= 60 ? 'badge-orange' : 'badge-red'}`}>
                    {atsLabel(atsScore)}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className={`text-4xl font-bold tracking-tight ${
                    atsScore >= 80 ? 'text-ok' : atsScore >= 60 ? 'text-warn' : 'text-err'
                  }`}>{atsScore}</span>
                  <span className="text-ink-3 text-lg font-medium pb-0.5">/ 100</span>
                </div>
                <div className="progress-track h-2.5">
                  <div className={`progress-fill ${atsColor(atsScore)}`} style={{ width: `${atsScore}%` }}></div>
                </div>

                {breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-line">
                    {[
                      { label: 'Skills', value: breakdown.skill_score },
                      { label: 'Semantic', value: breakdown.semantic_score },
                      { label: 'Experience', value: breakdown.experience_score },
                      { label: 'Education', value: breakdown.education_score },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-ink-2 font-medium">{b.label}</span>
                          <span className="font-semibold text-ink">{b.value}%</span>
                        </div>
                        <div className="progress-track !h-1.5">
                          <div className="progress-fill progress-blue" style={{ width: `${b.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {analysisDetails?.consistency_analysis && (
                  <div className="mt-5 pt-5 border-t border-line flex items-center justify-between text-[13px]">
                    <span className="text-ink-2">Resume Consistency</span>
                    <span className="badge badge-green">
                      {analysisDetails.consistency_analysis.consistency_score || 92}% · {analysisDetails.consistency_analysis.concern_level || 'Low Concern'}
                    </span>
                  </div>
                )}
              </div>

              {/* Extracted Profile & Experience Information */}
              {(selectedResume.parsed_name || selectedResume.parsed_summary || selectedResume.parsed_email || (selectedResume.parsed_experience && selectedResume.parsed_experience.length > 0)) && (
                <div className="card space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <h2 className="section-title !text-[16px] !mb-0">Extracted Candidate Details</h2>
                    <span className="badge badge-blue">NLP Parsed</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedResume.parsed_name && (
                      <div className="bg-page p-3 rounded-lg border border-line">
                        <span className="text-ink-3 block text-[10px] uppercase font-bold tracking-wider">Candidate Name</span>
                        <span className="font-semibold text-ink text-sm">{selectedResume.parsed_name}</span>
                      </div>
                    )}
                    {selectedResume.parsed_email && (
                      <div className="bg-page p-3 rounded-lg border border-line">
                        <span className="text-ink-3 block text-[10px] uppercase font-bold tracking-wider">Email Address</span>
                        <span className="font-semibold text-ink text-sm">{selectedResume.parsed_email}</span>
                      </div>
                    )}
                    {selectedResume.parsed_phone && (
                      <div className="bg-page p-3 rounded-lg border border-line">
                        <span className="text-ink-3 block text-[10px] uppercase font-bold tracking-wider">Phone</span>
                        <span className="font-semibold text-ink text-sm">{selectedResume.parsed_phone}</span>
                      </div>
                    )}
                    {selectedResume.parsed_location && (
                      <div className="bg-page p-3 rounded-lg border border-line">
                        <span className="text-ink-3 block text-[10px] uppercase font-bold tracking-wider">Location</span>
                        <span className="font-semibold text-ink text-sm">{selectedResume.parsed_location}</span>
                      </div>
                    )}
                  </div>

                  {selectedResume.parsed_summary && (
                    <div className="bg-page p-3.5 rounded-lg border border-line text-xs">
                      <span className="text-ink-3 block text-[10px] uppercase font-bold tracking-wider mb-1">Professional Summary</span>
                      <p className="text-ink-2 leading-relaxed">{selectedResume.parsed_summary}</p>
                    </div>
                  )}

                  {selectedResume.parsed_experience && selectedResume.parsed_experience.length > 0 && (
                    <div className="pt-2">
                      <span className="text-ink-3 block text-[11px] uppercase font-bold tracking-wider mb-2">Detected Work Experience</span>
                      <div className="space-y-2">
                        {selectedResume.parsed_experience.map((exp, idx) => (
                          <div key={idx} className="p-3 bg-page rounded-lg border border-line text-xs">
                            <div className="flex justify-between font-semibold text-ink">
                              <span>{typeof exp === 'object' ? (exp.role || exp.title || exp.company || 'Experience') : String(exp)}</span>
                              {exp.company && <span className="text-brand font-normal">{exp.company}</span>}
                            </div>
                            {exp.description && <p className="text-ink-2 text-[11.5px] mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Skills found */}
              <div className="card">
                <h2 className="section-title !text-[16px] mb-4">
                  Skills Found <span className="text-ink-3 font-normal text-sm">({selectedResume.parsed_skills?.length || 0})</span>
                </h2>
                {selectedResume.parsed_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.parsed_skills.map((s) => (
                      <span key={s} className="skill-pill">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-3">No skills extracted yet.</p>
                )}

                {analysisDetails?.missing_skills?.length > 0 && (
                  <>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mt-6 mb-3">Recommended Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisDetails.missing_skills.map((s) => (
                        <a
                          key={s}
                          href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(s)}+tutorial`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="skill-pill skill-pill-missing hover:!border-brand hover:!text-brand transition-colors"
                        >
                          + Learn {s}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Cover Letter */}
              <div className="card">
                <h2 className="section-title !text-[16px] mb-4">✉️ AI Cover Letter</h2>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description..."
                  className="input mb-3"
                />
                <button onClick={generateCoverLetter} disabled={generatingLetter} className="btn-primary btn-sm">
                  {generatingLetter ? 'Generating…' : 'Generate Cover Letter'}
                </button>
                {coverLetter && (
                  <pre className="mt-4 bg-page rounded-lg p-4 text-[12.5px] text-ink-2 whitespace-pre-wrap font-sans leading-relaxed border border-line">
                    {coverLetter}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="card empty-state min-h-[350px] flex flex-col items-center justify-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <h3>No Resume Uploaded</h3>
              <p className="text-sm mb-5">Upload your resume to start AI analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Low ATS Score Alert Popup Modal (When ATS Score < 60%) */}
      {showLowAtsPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowLowAtsPopup(false)}>
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 space-y-5 page-slide-up relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Close Button */}
            <button
              onClick={() => setShowLowAtsPopup(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-lg"
            >
              ✕
            </button>

            {/* Warning Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 mb-1">
                  ATS Score Below 60% Threshold
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                  Resume Needs Optimization ({atsScore}%)
                </h2>
              </div>
            </div>

            {/* Notice Description */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
              <p>
                Your analyzed resume scored <strong className="text-rose-700 font-bold">{atsScore}%</strong>, which is below the recommended <strong>60% recruiter shortlisting benchmark</strong>.
              </p>
              <p className="text-slate-600">
                Resumes below 60% often get automatically filtered out by enterprise ATS algorithms. Adding missing technical skills and quantifiable impact bullets will quickly elevate your score above 80%.
              </p>
            </div>

            {/* Job-specific missing skills (if available) */}
            {analysisDetails?.missing_skills && analysisDetails.missing_skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Missing for This Job:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysisDetails.missing_skills.map((sk) => (
                    <span key={sk} className="badge bg-white !text-warn border border-warn/25 font-bold text-xs">
                      + {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 20 Market-Trending Skills -> clickable YouTube beginner courses */}
            {analysisDetails?.recommended_market_skills?.length > 0 ? (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  🔥 {analysisDetails.recommended_market_skills.length} Trending Skills Not on Your Resume
                </h3>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Ranked by real job-market demand — click any skill to open a free beginner course on YouTube:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysisDetails.recommended_market_skills.map((rec, i) => (
                    <a
                      key={rec.skill}
                      href={rec.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Beginner tutorial for ${rec.skill}${rec.growth ? ` · demand ${rec.growth}` : ''}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        i < 10
                          ? 'bg-brand-light text-brand border border-brand/30 hover:bg-brand hover:text-white'
                          : 'bg-white text-slate-600 border border-slate-300 hover:border-brand hover:text-brand'
                      }`}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12z"/></svg>
                      {rec.skill}
                      {rec.growth && <span className="text-[10px] opacity-70">{rec.growth}</span>}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              analysisDetails?.missing_skills?.length === 0 && (
                <p className="text-xs text-slate-500">Loading skill recommendations...</p>
              )
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowLowAtsPopup(false)
                  setShowImprovementModal(true)
                }}
                className="btn-primary w-full sm:flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
              >
                <span>⚡</span> View Improvement Guide
              </button>
              <button
                onClick={() => setShowLowAtsPopup(false)}
                className="btn-secondary w-full sm:w-auto py-2.5 font-semibold"
              >
                Dismiss &amp; Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Improvement Modal */}
      {showImprovementModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={() => setShowImprovementModal(false)}>
          <div className="bg-white rounded-xl border border-line shadow-xl max-w-xl w-full p-6 page-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title !text-[17px] mb-1">ATS Improvement Plan</h2>
            <p className="text-sm text-ink-3 mb-5">Actionable suggestions to raise your score above 80.</p>

            <div className="bg-page rounded-lg p-4 space-y-3 text-[13px]">
              <div>
                <span className="text-ink-3 block text-xs mb-0.5">Before:</span>
                <span className="text-err italic">"Worked on a project using Python."</span>
              </div>
              <div>
                <span className="text-ink-3 block text-xs mb-0.5">Suggested:</span>
                <span className="text-ok font-medium">"Developed scalable Python REST APIs, optimizing backend execution and dataset processing."</span>
              </div>
            </div>

            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 mt-5 mb-2.5">Priority Skills</h3>
            <ul className="space-y-1.5 text-[13px] text-ink-2">
              {analysisDetails?.missing_skills?.map((s) => (
                <li key={s}>• <strong className="text-ink">{s}</strong> — high demand across technical job listings.</li>
              )) || <li>Add more measurable achievements and relevant keywords.</li>}
            </ul>

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowImprovementModal(false)} className="btn-primary btn-sm px-5">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={() => setResumeToDelete(null)}>
          <div className="bg-white rounded-xl border border-line shadow-xl max-w-md w-full p-6 page-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title !text-[16px] mb-2 text-err">Delete resume?</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-ink">'{resumeToDelete.title}'</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5 mt-6">
              <button onClick={() => setResumeToDelete(null)} className="btn-ghost btn-sm px-4">Cancel</button>
              <button onClick={handleDeleteResume} className="btn-danger btn-sm px-4">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
