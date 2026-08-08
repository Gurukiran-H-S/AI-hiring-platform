import React, { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export const SystemAnalytics = () => {
  const [rangeFilter, setRangeFilter] = useState('30days')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/analytics/overview', {
        params: { range_filter: rangeFilter }
      })
      setAnalytics(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load system analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [rangeFilter])

  const exportCSV = () => {
    if (!analytics) return
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Users', analytics.kpis.total_users],
      ['Candidates', analytics.kpis.total_candidates],
      ['Recruiters', analytics.kpis.total_recruiters],
      ['Active Jobs', analytics.kpis.active_jobs],
      ['Total Applications', analytics.kpis.total_applications],
      ['Shortlisted', analytics.kpis.shortlisted],
      ['Interviews', analytics.kpis.total_interviews],
      ['Hired', analytics.kpis.hired],
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `system_analytics_${rangeFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Analytics report exported as CSV!')
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto text-white">
      {/* Header & Date Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent font-display">
            📈 System Analytics & AI Platform Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real database analytics across candidates, recruiters, ATS score distributions, skill gaps & conversion funnels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="bg-[#0d0e19] border border-white/15 text-xs text-white rounded-xl p-2.5 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last 1 Year</option>
          </select>

          <button
            onClick={fetchAnalytics}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            🔄 Refresh Data
          </button>

          <button
            onClick={exportCSV}
            className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {loading || !analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. TOP KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">TOTAL USERS</div>
              <div className="text-3xl font-display font-extrabold text-white">{analytics.kpis.total_users}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">CANDIDATES</div>
              <div className="text-3xl font-display font-extrabold text-indigo-400">{analytics.kpis.total_candidates}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">RECRUITERS</div>
              <div className="text-3xl font-display font-extrabold text-emerald-400">{analytics.kpis.total_recruiters}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">ACTIVE JOBS</div>
              <div className="text-3xl font-display font-extrabold text-amber-400">{analytics.kpis.active_jobs}</div>
            </div>

            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">APPLICATIONS</div>
              <div className="text-3xl font-display font-extrabold text-purple-400">{analytics.kpis.total_applications}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">SHORTLISTED</div>
              <div className="text-3xl font-display font-extrabold text-emerald-300">{analytics.kpis.shortlisted}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">INTERVIEWS</div>
              <div className="text-3xl font-display font-extrabold text-indigo-300">{analytics.kpis.total_interviews}</div>
            </div>
            <div className="glass-card p-5 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold mb-1">HIRED</div>
              <div className="text-3xl font-display font-extrabold text-emerald-400">{analytics.kpis.hired}</div>
            </div>
          </div>

          {/* 2. GRAPH 1 & GRAPH 2: USER GROWTH & JOB TREND */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">📈 User Registration Trend</h3>
              <Line
                data={{
                  labels: analytics.user_growth.labels,
                  datasets: [
                    {
                      label: 'Candidates',
                      data: analytics.user_growth.candidates,
                      borderColor: '#818cf8',
                      backgroundColor: 'rgba(129, 140, 248, 0.2)',
                    },
                    {
                      label: 'Recruiters',
                      data: analytics.user_growth.recruiters,
                      borderColor: '#34d399',
                      backgroundColor: 'rgba(52, 211, 153, 0.2)',
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } } }}
              />
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">📊 Job Posting Trend</h3>
              <Bar
                data={{
                  labels: ['Active Jobs', 'Closed Jobs', 'Paused Jobs'],
                  datasets: [
                    {
                      label: 'Job Count',
                      data: [
                        analytics.job_posting_trend.active,
                        analytics.job_posting_trend.closed,
                        analytics.job_posting_trend.paused,
                      ],
                      backgroundColor: ['#10b981', '#f43f5e', '#f59e0b'],
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>

          {/* 3. GRAPH 3 & GRAPH 4: RECRUITMENT FUNNEL & APPLICATION STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">🔻 Recruitment Funnel Conversion</h3>
              <Bar
                data={{
                  labels: ['Job Views', 'Applications', 'Shortlisted', 'Assessments', 'Interviews', 'Offers', 'Hired'],
                  datasets: [
                    {
                      label: 'Candidates',
                      data: [
                        analytics.recruitment_funnel.job_views,
                        analytics.recruitment_funnel.applications,
                        analytics.recruitment_funnel.shortlisted,
                        analytics.recruitment_funnel.assessments,
                        analytics.recruitment_funnel.interviews,
                        analytics.recruitment_funnel.offers,
                        analytics.recruitment_funnel.hired,
                      ],
                      backgroundColor: '#6366f1',
                    },
                  ],
                }}
                options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">🍩 Application Status Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: Object.keys(analytics.application_status),
                    datasets: [
                      {
                        data: Object.values(analytics.application_status),
                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#64748b'],
                      },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>

          {/* 4. GRAPH 5 & GRAPH 6: ATS SCORE DISTRIBUTION & TOP SKILLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">🎯 Candidate ATS Score Distribution</h3>
              <Bar
                data={{
                  labels: Object.keys(analytics.ats_distribution),
                  datasets: [
                    {
                      label: 'Candidate Resumes',
                      data: Object.values(analytics.ats_distribution),
                      backgroundColor: '#10b981',
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">💻 Top In-Demand Technical Skills</h3>
              <Bar
                data={{
                  labels: Object.keys(analytics.top_skills),
                  datasets: [
                    {
                      label: 'Jobs Requesting Skill',
                      data: Object.values(analytics.top_skills),
                      backgroundColor: '#a855f7',
                    },
                  ],
                }}
                options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>

          {/* 5. GRAPH 7 & GRAPH 9: SKILL GAPS & INTERVIEW ACTIVITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">⚠️ Most Common Candidate Skill Gaps</h3>
              <Bar
                data={{
                  labels: Object.keys(analytics.skill_gaps),
                  datasets: [
                    {
                      label: 'Skill Gap Severity Score',
                      data: Object.values(analytics.skill_gaps),
                      backgroundColor: '#ef4444',
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">📅 Interview Activity Breakdown</h3>
              <Bar
                data={{
                  labels: Object.keys(analytics.interview_activity),
                  datasets: [
                    {
                      label: 'Interviews',
                      data: Object.values(analytics.interview_activity),
                      backgroundColor: ['#10b981', '#6366f1', '#f43f5e', '#f59e0b'],
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </div>

          {/* 6. AI SYSTEM PERFORMANCE & TIMELINE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">🧠 AI System Performance & Accuracy</h3>
              <div className="space-y-3 text-xs">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span>spaCy Skill Extraction F1 Score</span>
                  <strong className="text-emerald-400 font-mono text-sm">{analytics.ai_metrics.skill_extraction.f1_score}</strong>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span>Semantic Sentence Transformer Accuracy</span>
                  <strong className="text-indigo-400 font-mono text-sm">{analytics.ai_metrics.semantic_matching.cosine_sim_accuracy}</strong>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span>Explainable ATS Model R² Score</span>
                  <strong className="text-purple-400 font-mono text-sm">{analytics.ai_metrics.ats_scoring.r2_score}</strong>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <h3 className="text-sm font-bold font-display text-white">📋 Recent System Activity Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {analytics.timeline.map((act, idx) => (
                  <div key={idx} className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-[11px] flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{act.event}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{act.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
