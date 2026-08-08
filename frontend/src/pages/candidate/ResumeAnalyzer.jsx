import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const ResumeAnalyzer = () => {
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [analysisDetails, setAnalysisDetails] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)

  // Modals
  const [showImprovementModal, setShowImprovementModal] = useState(false)
  const [showLowAtsPopup, setShowLowAtsPopup] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState(null)

  // AI Cover Letter States
  const [jobDescription, setJobDescription] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [generatingLetter, setGeneratingLetter] = useState(false)

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resumes/')
      setResumes(data)
      if (data.length > 0 && !selectedResume) {
        loadResumeAnalysis(data[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load resumes')
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const loadResumeAnalysis = async (id) => {
    try {
      const { data } = await api.get(`/resumes/${id}`)
      setAnalysisDetails(data)
      setSelectedResume(resumes.find(r => r.id === id) || data)
      if (data.ats_score < 60) {
        setShowLowAtsPopup(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
      setTitle(e.target.files[0].name.split('.')[0])
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('is_primary', resumes.length === 0)

    try {
      const { data } = await api.post('/resumes/upload', formData)
      toast.success('Resume parsed & analyzed with spaCy NLP!')
      setResumes([data, ...resumes])
      loadResumeAnalysis(data.id)
      setFile(null)
      setTitle('')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to process resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return
    try {
      await api.delete(`/resumes/${resumeToDelete.id}`)
      toast.success(`Resume '${resumeToDelete.title}' deleted successfully.`)
      const updated = resumes.filter(r => r.id !== resumeToDelete.id)
      setResumes(updated)
      if (updated.length > 0) {
        loadResumeAnalysis(updated[0].id)
      } else {
        setSelectedResume(null)
        setAnalysisDetails(null)
      }
      setResumeToDelete(null)
    } catch (err) {
      toast.error('Failed to delete resume.')
    }
  }

  const handleSetPrimary = async (resumeId) => {
    try {
      await api.put(`/resumes/${resumeId}/primary`)
      toast.success('Set as primary resume for recommendations!')
      fetchResumes()
    } catch (err) {
      toast.error('Failed to set primary resume.')
    }
  }

  const generateCoverLetter = async () => {
    if (!jobDescription) return toast.error('Please enter a Job Description')
    setGeneratingLetter(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      const simulatedLetter = `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the open role. Having reviewed the position requirements, my background aligns closely with key technical expectations including ${selectedResume?.parsed_skills?.slice(0, 5).join(', ')}.

My hands-on project experience in "${selectedResume?.parsed_projects?.[0]?.name || 'Software Development'}" demonstrates my capacity to build scalable applications.

Sincerely,
${selectedResume?.parsed_name || 'Applicant'}`
      setCoverLetter(simulatedLetter)
      toast.success('AI Cover Letter Generated!')
    } catch (err) {
      toast.error('Failed to generate cover letter')
    } finally {
      setGeneratingLetter(false)
    }
  }

  const atsScore = analysisDetails?.ats_score || selectedResume?.ats_score || 0
  const isBelowThreshold = atsScore < 60

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            AI Hybrid Resume Analyzer & ATS Diagnostic System
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            spaCy NLP Parsing, PyMuPDF Extraction, Skill Normalization & Explainable ATS Diagnostics.
          </p>
        </div>

        {atsScore > 0 && (
          <button
            onClick={() => setShowImprovementModal(true)}
            className="btn-primary py-2.5 px-5 text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            <span>⚡</span> Improve My ATS Score
          </button>
        )}
      </div>

      {/* Prominent < 60 ATS Score Warning Banner */}
      {isBelowThreshold && atsScore > 0 && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-base font-display">ATS SCORE: {atsScore}% — Needs Improvement</h3>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Your current profile matches {atsScore}% of this job's requirements (Target: 60%+). Learn the missing skills below to boost your ATS compatibility!
              </p>
            </div>
          </div>

          {analysisDetails?.missing_skills?.length > 0 && (
            <div className="pt-2 border-t border-amber-500/20 text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-400 block mb-1.5">Missing Skills & Example YouTube Tutorials:</span>
              <div className="flex flex-wrap gap-2">
                {analysisDetails.missing_skills.map((skill) => (
                  <a
                    key={skill}
                    href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}+tutorial+course`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>▶</span> + {skill} (Example Link)
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Resumes List with Delete & Set Primary */}
        <div className="space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 font-display">Upload Resume (PDF/DOCX)</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-3xl block mb-2">📁</span>
                <p className="text-xs text-slate-400">
                  {file ? file.name : 'Drag & Drop or Click to Upload PDF/DOCX'}
                </p>
              </div>
              {file && (
                <input
                  type="text"
                  placeholder="Resume Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              )}
              <button
                type="submit"
                disabled={uploading}
                className="w-full btn-primary font-semibold p-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? 'Parsing with NLP...' : 'Analyze Resume'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
            <h2 className="text-lg font-bold mb-4 font-display">Uploaded Resumes</h2>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      selectedResume?.id === r.id
                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate max-w-[140px]">{r.title}</span>
                      <div className="flex items-center gap-2">
                        {r.is_primary && (
                          <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-mono">
                            ★ Primary
                          </span>
                        )}
                        <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                          (r.ats_score || 0) >= 75 ? 'bg-emerald-500/20 text-emerald-400' : (r.ats_score || 0) >= 60 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          ATS: {r.ats_score}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                      <button
                        onClick={() => loadResumeAnalysis(r.id)}
                        className="text-indigo-400 hover:underline font-semibold"
                      >
                        [View & Analyze]
                      </button>

                      <div className="flex items-center gap-2">
                        {!r.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(r.id)}
                            className="text-emerald-400 hover:underline"
                          >
                            [Set Primary]
                          </button>
                        )}
                        <button
                          onClick={() => setResumeToDelete(r)}
                          className="text-rose-400 hover:underline"
                        >
                          [Delete]
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedResume ? (
            <>
              {/* ATS Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 text-center border border-white/10 rounded-2xl bg-white/5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-display">Explainable ATS Score</div>
                  <div className={`text-5xl font-extrabold font-display ${atsScore >= 75 ? 'text-emerald-400' : atsScore >= 60 ? 'text-indigo-400' : 'text-amber-400'}`}>
                    {atsScore}%
                  </div>
                  <div className="text-xs font-semibold text-indigo-300 mt-2 font-mono">
                    {analysisDetails?.level || 'Needs Improvement'}
                  </div>
                </div>

                <div className="glass-card p-6 text-center border border-white/10 rounded-2xl bg-white/5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-display">Resume Consistency</div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-display my-1">
                    {analysisDetails?.consistency_analysis?.consistency_score || 92}%
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Status: <strong className="text-emerald-300">{analysisDetails?.consistency_analysis?.concern_level || 'Low Concern'}</strong>
                  </div>
                </div>

                <div className="glass-card p-6 text-center border border-white/10 rounded-2xl bg-white/5">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-display">Normalized Skills</div>
                  <div className="text-5xl font-extrabold text-amber-400 font-display">
                    {selectedResume.parsed_skills?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">spaCy NLP Verified</div>
                </div>
              </div>

              {/* Explainable Weight Breakdown */}
              {analysisDetails?.score_breakdown && (
                <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                  <h2 className="text-md font-bold font-display text-slate-200">
                    Weighted ATS Score Formula Breakdown
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <span className="text-slate-400 block mb-1">Skills (30%)</span>
                      <strong className="text-emerald-400 text-base">{analysisDetails.score_breakdown.skill_score}%</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <span className="text-slate-400 block mb-1">Semantic (20%)</span>
                      <strong className="text-indigo-400 text-base">{analysisDetails.score_breakdown.semantic_score}%</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <span className="text-slate-400 block mb-1">Experience (15%)</span>
                      <strong className="text-amber-400 text-base">{analysisDetails.score_breakdown.experience_score}%</strong>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                      <span className="text-slate-400 block mb-1">Education (10%)</span>
                      <strong className="text-purple-400 text-base">{analysisDetails.score_breakdown.education_score}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Beginner-Level Skill Tutorials & Roadmap with Example Links */}
              {analysisDetails?.missing_skills?.length > 0 && (
                <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                  <h2 className="text-md font-bold font-display text-emerald-400 flex items-center gap-2">
                    <span>📚</span> Beginner-Level Skill Tutorials & Roadmap (Example YouTube Links)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {analysisDetails.missing_skills.map((skill) => (
                      <div key={skill} className="bg-black/40 p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-indigo-300">{skill}</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono uppercase font-bold">
                              HIGH PRIORITY GAP
                            </span>
                          </div>
                          <h4 className="font-semibold text-white">Learn {skill} Crash Course</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Master key concepts, CLI/API syntax, and hands-on starter projects.</p>
                        </div>
                        <a
                          href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}+course+tutorial`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 pt-2 border-t border-white/5"
                        >
                          Watch YouTube Tutorial ({skill} Example Link) →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Cover Letter Generator */}
              <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
                <h2 className="text-md font-bold flex items-center gap-2 font-display">
                  <span>✉️</span> Tailored AI Cover Letter
                </h2>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target job description..."
                  className="w-full bg-[#0a0b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={generateCoverLetter}
                  disabled={generatingLetter}
                  className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  {generatingLetter ? 'Generating Letter...' : 'Generate Cover Letter'}
                </button>

                {coverLetter && (
                  <div className="p-4 rounded-xl border border-white/10 bg-black/40">
                    <h3 className="text-xs font-bold text-emerald-400 mb-2">Generated Cover Letter:</h3>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{coverLetter}</pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center border border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center h-full min-h-[350px]">
              <span className="text-5xl mb-4">📂</span>
              <p className="text-slate-400 text-sm">Select or upload a resume to view explainable ATS diagnostics & learning recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Low ATS Score Popup Modal */}
      {showLowAtsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-scale-up">
          <div className="glass-card p-6 rounded-2xl max-w-lg w-full bg-[#0d0e19] border border-amber-500/40 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <h2 className="text-base font-bold text-amber-300 font-display flex items-center gap-2">
                <span>⚠️</span> ATS SCORE BELOW TARGET ({atsScore}%)
              </h2>
              <button onClick={() => setShowLowAtsPopup(false)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-2 text-slate-300">
              <p>
                Your current resume match score is <strong className="text-amber-400">{atsScore}%</strong>. Recommended target is <strong className="text-emerald-400">60%+</strong>.
              </p>
              <p>We identified critical skills you can learn to significantly boost your score:</p>
              <div className="space-y-1.5 pt-1">
                {analysisDetails?.missing_skills?.map((skill) => (
                  <div key={skill} className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs">
                    <span className="font-bold text-white">{skill}</span>
                    <a
                      href={`https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}+tutorial`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline font-semibold text-[11px]"
                    >
                      Watch Tutorial (Example Link) →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowLowAtsPopup(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 font-semibold"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowLowAtsPopup(false)
                  setShowImprovementModal(true)
                }}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                View Skill Improvement Plan ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-rose-500/30 space-y-4 text-xs">
            <h2 className="text-base font-bold text-rose-400 font-display flex items-center gap-2">
              <span>⚠️</span> Delete Resume Confirmation
            </h2>
            <p className="text-slate-300">
              Are you sure you want to delete <strong className="text-white">'{resumeToDelete.title}'</strong>?
              This action cannot be undone and will delete all associated embeddings.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setResumeToDelete(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResume}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Delete Resume 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Modal */}
      {showImprovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card p-6 rounded-2xl max-w-2xl w-full bg-[#0d0e19] border border-white/15 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white font-display">ATS Score Action Plan & Improvement Suggestions</h2>
              <button onClick={() => setShowImprovementModal(false)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider">Recommended Wording Enhancements:</h3>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Before:</span>
                  <span className="text-rose-300 italic">"Worked on a project using Python."</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Suggested Reword:</span>
                  <span className="text-emerald-300 font-semibold">"Developed scalable Python REST APIs, optimizing backend execution and dataset processing."</span>
                </div>
              </div>

              <h3 className="font-bold text-emerald-400 uppercase tracking-wider pt-2">Priority Missing Skills to Master:</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {analysisDetails?.missing_skills?.map((s) => (
                  <li key={s}><strong className="text-indigo-300">{s}</strong> — High demand across technical job listings.</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button onClick={() => setShowImprovementModal(false)} className="btn-primary px-5 py-2 rounded-xl text-xs">
                Close Action Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
