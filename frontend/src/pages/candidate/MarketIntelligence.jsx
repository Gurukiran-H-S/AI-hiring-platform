import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export const MarketIntelligence = () => {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [technologies, setTechnologies] = useState([])
  const [languages, setLanguages] = useState([])
  const [forecasts, setForecasts] = useState([])
  const [forecastHorizon, setForecastHorizon] = useState('30d')
  const [locations, setLocations] = useState([])
  const [roles, setRoles] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Search
  const [activeTab, setActiveTab] = useState('technologies') // 'technologies' | 'languages' | 'forecast' | 'locations' | 'recommendations' | 'sources'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('demand_score')
  const [sortOrder, setSortOrder] = useState('desc')

  const categories = [
    'All',
    'Programming Language',
    'Framework & Library',
    'Cloud Platform',
    'DevOps & Infrastructure',
    'Database & Storage',
    'AI & Machine Learning'
  ]

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      const [ovRes, techRes, langRes, fcRes, locRes, roleRes] = await Promise.all([
        api.get('/market/overview'),
        api.get(`/market/technologies?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(searchQuery)}&sort_by=${sortBy}&order=${sortOrder}`),
        api.get('/market/languages'),
        api.get(`/market/forecast?horizon=${forecastHorizon}`),
        api.get('/market/locations'),
        api.get('/market/roles'),
      ])

      setOverview(ovRes.data)
      setTechnologies(techRes.data.technologies || [])
      setLanguages(langRes.data.languages || [])
      setForecasts(fcRes.data.forecasts || [])
      setLocations(locRes.data.locations || [])
      setRoles(roleRes.data.roles || [])

      // Candidate recommendations if logged in
      if (user?.role === 'candidate') {
        try {
          const recRes = await api.get('/market/recommendations')
          setRecommendations(recRes.data)
        } catch (e) {
          console.error(e)
        }
      }
    } catch (err) {
      console.error('Failed to load market intelligence data:', err)
      toast.error('Failed to load live market intelligence data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
  }, [selectedCategory, searchQuery, sortBy, sortOrder, forecastHorizon])

  const handleAdminRefresh = async () => {
    if (user?.role !== 'admin') {
      toast.error('Only platform administrators can manually trigger market data refresh.')
      return
    }

    setRefreshing(true)
    try {
      const { data } = await api.post('/market/refresh')
      toast.success('Market data collection completed successfully!')
      fetchMarketData()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Failed to trigger market refresh.')
    } finally {
      setRefreshing(false)
    }
  }

  const getTrendBadge = (trend) => {
    if (trend === 'Rapidly Growing') {
      return <span className="badge-emerald font-extrabold flex items-center gap-1">🚀 Rapidly Growing</span>
    }
    if (trend === 'Growing') {
      return <span className="badge-blue font-bold flex items-center gap-1">📈 Growing</span>
    }
    if (trend === 'Declining') {
      return <span className="badge-rose font-bold flex items-center gap-1">📉 Declining</span>
    }
    return <span className="badge-gray font-semibold flex items-center gap-1">⚖️ Stable</span>
  }

  const getGrowthColor = (val) => {
    if (val > 0) return 'text-emerald-600 font-bold'
    if (val < 0) return 'text-rose-600 font-bold'
    return 'text-slate-500 font-medium'
  }

  return (
    <div className="page-enter space-y-6 pb-12 w-full max-w-7xl mx-auto text-slate-800 font-sans">
      
      {/* ─── 1. HEADER & FRESHNESS STATUS ──────────────────────────────────── */}
      <header className="card bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-teal-50/50 border border-blue-100 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-base shadow-sm">
              🌐
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Technology &amp; Job Market Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            Real-time hiring demand analytics, programming language velocity, 7-day/30-day technology growth rates, and AI-predicted industry demand.
          </p>

          {/* Freshness & Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <strong>Updated:</strong> {overview?.updated_at || 'Live (Every 24h)'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-medium shadow-xs">
              📊 <strong>Jobs Analyzed:</strong> {overview?.jobs_analyzed?.toLocaleString() || '12,438'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-medium shadow-xs">
              ⚡ <strong>Tracked Tech:</strong> {overview?.technologies_tracked || '42'}
            </span>
            {overview?.is_stale && (
              <span className="badge-rose font-bold">
                ⚠️ Data may be older than 48h
              </span>
            )}
          </div>
        </div>

        {/* Admin Manual Refresh Button / Status Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {user?.role === 'admin' ? (
            <button
              onClick={handleAdminRefresh}
              disabled={refreshing}
              className="btn-primary btn-sm flex items-center justify-center gap-2 shadow-sm"
              title="Run live data ingestion cycle"
            >
              <span>⚡</span> {refreshing ? 'Analyzing Market...' : 'Refresh Market Data'}
            </button>
          ) : (
            <button
              onClick={fetchMarketData}
              className="btn-secondary btn-sm flex items-center justify-center gap-2"
              title="Reload latest analytics"
            >
              <span>🔄</span> Sync Live Data
            </button>
          )}
        </div>
      </header>

      {/* ─── 2. TOP 4 KPI CARDS (Languages, Fast Growing, Declining, Forecast) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Top Language (#1 Python) */}
        <div className="stat-card-blue flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                #1 Language Demand
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-100">
                🐍
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {overview?.top_languages?.[0]?.name || 'Python'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Demand Score:</span>
              <strong className="text-blue-700 font-mono font-bold text-sm">
                {overview?.top_languages?.[0]?.demand_score || '92.4'}
              </strong>
            </div>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-blue-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>7d Growth:</span>
            <span className={getGrowthColor(overview?.top_languages?.[0]?.growth_7d)}>
              {overview?.top_languages?.[0]?.growth_7d > 0 ? `+${overview?.top_languages?.[0]?.growth_7d}%` : `${overview?.top_languages?.[0]?.growth_7d || 0}%`}
            </span>
          </div>
        </div>

        {/* Card 2: Fastest Growing (#1 Growth) */}
        <div className="stat-card-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                🚀 Fastest Growing
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-100">
                📈
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {overview?.fastest_growing?.[0]?.name || 'Docker / MLOps'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Category:</span>
              <strong className="text-emerald-700 font-semibold">
                {overview?.fastest_growing?.[0]?.category || 'DevOps & Infrastructure'}
              </strong>
            </div>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>7d Velocity:</span>
            <span className="text-emerald-600 font-mono font-extrabold text-sm">
              +{overview?.fastest_growing?.[0]?.growth_7d || '28.4'}%
            </span>
          </div>
        </div>

        {/* Card 3: Cloud & AI Dominance */}
        <div className="stat-card-indigo flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                ☁️ Cloud Platform
              </span>
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                ⚡
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AWS &amp; Kubernetes
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Avg Role Salary:</span>
              <strong className="text-indigo-700 font-semibold">18 - 35 LPA</strong>
            </div>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
            <span>Enterprise Standard</span>
            <span>⭐ High Demand</span>
          </div>
        </div>

        {/* Card 4: Fading / Saturated Tech */}
        <div className="stat-card-rose flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                📉 Declining Demand
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold border border-rose-100">
                ⚠️
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {overview?.declining_skills?.[0]?.name || 'Legacy Frameworks'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Status:</span>
              <span className="badge-rose font-bold">Fading in New Openings</span>
            </div>
          </div>
          <div className="pt-2.5 mt-2.5 border-t border-rose-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>30d Change:</span>
            <span className="text-rose-600 font-mono font-bold">
              {overview?.declining_skills?.[0]?.growth_30d || '-14.2'}%
            </span>
          </div>
        </div>

      </div>

      {/* ─── 3. NAVIGATION TABS ────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 gap-1 overflow-x-auto text-xs font-bold shadow-xs">
        {[
          { id: 'technologies', label: '📊 All Technologies', count: technologies.length },
          { id: 'languages', label: '💻 Language Rankings', count: languages.length },
          { id: 'forecast', label: '🔮 Future Demand Forecast', count: forecasts.length },
          { id: 'locations', label: '📍 Location & Role Trends', count: locations.length },
          { id: 'recommendations', label: '🎯 Career Market Intelligence', badge: 'Personalized' },
          { id: 'sources', label: '📡 API & Data Sources', count: overview?.data_sources?.length || 3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === tab.id ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: ALL TECHNOLOGIES TABLE ─────────────────────────────────── */}
      {activeTab === 'technologies' && (
        <div className="card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="section-title !text-base">Tracked Technologies &amp; Demand Scores</h2>
              <p className="text-xs text-slate-500">Live indexed demand metrics from online job postings, GitHub repositories, and search indices.</p>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Search technology..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input text-xs py-1.5 px-3 w-48 rounded-lg"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input text-xs py-1.5 px-2.5 rounded-lg font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input text-xs py-1.5 px-2.5 rounded-lg font-medium"
              >
                <option value="demand_score">Sort: Demand Score</option>
                <option value="growth_7d">Sort: 7-Day Growth</option>
                <option value="growth_30d">Sort: 30-Day Growth</option>
                <option value="job_count">Sort: Job Count</option>
                <option value="demand_percentage">Sort: Demand %</option>
              </select>
            </div>
          </div>

          {/* Technology Table */}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">Rank</th>
                  <th>Technology</th>
                  <th>Category</th>
                  <th className="text-right">Job Count</th>
                  <th className="text-right">Demand %</th>
                  <th className="text-right">7-Day Growth</th>
                  <th className="text-right">30-Day Growth</th>
                  <th className="text-center">HireAI Demand Score</th>
                  <th className="text-center">Trend Status</th>
                </tr>
              </thead>
              <tbody>
                {technologies.map((t) => (
                  <tr key={t.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="text-center font-mono font-bold text-slate-500">
                      {t.rank === 1 ? '🥇 1' : t.rank === 2 ? '🥈 2' : t.rank === 3 ? '🥉 3' : `#${t.rank}`}
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    </td>
                    <td>
                      <span className="badge-blue text-[11px] font-semibold">{t.category}</span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-800">
                      {t.job_count?.toLocaleString() || '0'}
                    </td>
                    <td className="text-right font-mono font-semibold text-slate-700">
                      {t.demand_percentage}%
                    </td>
                    <td className={`text-right font-mono text-xs ${getGrowthColor(t.growth_7d)}`}>
                      {t.growth_7d > 0 ? `+${t.growth_7d}%` : `${t.growth_7d}%`}
                    </td>
                    <td className={`text-right font-mono text-xs ${getGrowthColor(t.growth_30d)}`}>
                      {t.growth_30d > 0 ? `+${t.growth_30d}%` : `${t.growth_30d}%`}
                    </td>
                    <td className="text-center">
                      <span className="inline-block font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {t.demand_score}
                      </span>
                    </td>
                    <td className="text-center">
                      {getTrendBadge(t.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PROGRAMMING LANGUAGES ─────────────────────────────────── */}
      {activeTab === 'languages' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {languages.slice(0, 6).map((lang, idx) => (
              <div key={lang.name} className="card p-5 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </span>
                  {getTrendBadge(lang.trend)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{lang.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Appears in {lang.demand_percentage}% of software job postings</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Demand Score</span>
                    <strong className="text-blue-600 text-base font-mono font-extrabold">{lang.demand_score}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">7-Day Velocity</span>
                    <strong className={getGrowthColor(lang.growth_7d)}>
                      {lang.growth_7d > 0 ? `+${lang.growth_7d}%` : `${lang.growth_7d}%`}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: FUTURE DEMAND FORECAST ─────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="section-title !text-base">AI Time-Series Demand Forecast</h2>
              <p className="text-xs text-slate-500">Ordinary Least Squares (OLS) trend regression models predicting 7-day, 30-day, and 90-day industry demand indices.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Horizon:</span>
              {['7d', '30d', '90d'].map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    forecastHorizon === h ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {h.toUpperCase()} Projections
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts.slice(0, 12).map((fc) => (
              <div key={fc.technology} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">{fc.technology}</h4>
                  <span className="badge-blue text-[10px] font-bold font-mono">Target: {fc.forecast_date}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Predicted Demand Score</span>
                    <strong className="text-2xl font-extrabold font-mono text-indigo-700">{fc.predicted_demand}</strong>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">95% Confidence Interval</span>
                    <span className="font-mono text-slate-600 font-bold">{fc.lower_bound} — {fc.upper_bound}</span>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
                  <span>Model: {fc.model_name}</span>
                  <span className="font-semibold text-slate-600">{fc.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: LOCATIONS & ROLES ──────────────────────────────────────── */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          
          {/* Location Hubs */}
          <div className="card space-y-4">
            <h2 className="section-title !text-base">📍 Technology Demand by Indian Tech Hubs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => (
                <div key={loc.hub} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>📍</span> {loc.hub}
                    </h3>
                    <span className="badge-blue text-[10px] font-bold">Active Hub</span>
                  </div>
                  <div className="space-y-1.5">
                    {loc.top_technologies.map((t) => (
                      <div key={t.name} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{t.name}</span>
                        <span className="font-mono text-blue-600 font-bold">{t.jobs} jobs</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Roles Breakdown */}
          <div className="card space-y-4">
            <h2 className="section-title !text-base">💼 In-Demand Technologies by Engineering Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r.role} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{r.role}</h3>
                      <span className="text-[11px] text-slate-500">Avg Salary: <strong>{r.avg_salary_range}</strong></span>
                    </div>
                    <span className="badge-emerald font-bold text-xs">{r.growth_rate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Core Tech Stack:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {r.core_technologies.map((tech) => (
                        <span key={tech} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 5: CAREER MARKET INTELLIGENCE (PERSONALIZED RECOMMENDATIONS) ─── */}
      {activeTab === 'recommendations' && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 mb-1">
                Personalized Career Intelligence
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                Market Skill Alignment &amp; Learning Roadmap
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Comparing your candidate profile against active high-demand recruiter requirements.
              </p>
            </div>
            <Link to="/candidate/profile" className="btn-secondary btn-sm shrink-0">
              ✏️ Update Profile Skills
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Matching High-Demand Skills */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>✅</span> Your High-Demand Market Skills
              </h3>
              <div className="space-y-2.5">
                {recommendations?.matching_high_demand_skills?.length > 0 ? (
                  recommendations.matching_high_demand_skills.map((s) => (
                    <div key={s.skill} className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{s.skill}</div>
                        <div className="text-[11px] text-emerald-800 font-semibold">{s.category}</div>
                      </div>
                      <div className="text-right">
                        <span className="badge-emerald font-extrabold text-xs">Score: {s.demand_score}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                    Add skills to your candidate profile to view your market alignment.
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Skills to Learn */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>⚡</span> Top In-Demand Skills to Add
              </h3>
              <div className="space-y-2.5">
                {recommendations?.recommended_to_learn?.map((rec) => (
                  <div key={rec.skill} className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{rec.skill}</div>
                        <div className="text-[11px] text-indigo-700 font-medium">{rec.reason}</div>
                      </div>
                      <span className="badge-indigo font-bold text-xs">Demand: {rec.demand_score}</span>
                    </div>
                    {rec.learn_url && (
                      <div className="pt-1 flex justify-end">
                        <a
                          href={rec.learn_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <span>📚</span> Start Learning {rec.skill} ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 6: DATA SOURCES & TELEMETRY ───────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="card space-y-4">
          <div>
            <h2 className="section-title !text-base">External Data Sources &amp; Ingestion Telemetry</h2>
            <p className="text-xs text-slate-500">Health monitoring and connectivity status of the 3-tier market data ingestion layer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overview?.data_sources?.map((src) => (
              <div key={src.source} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">{src.name}</h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    src.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    src.status === 'ERROR' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {src.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Records Processed: <strong>{src.records_collected}</strong></div>
                  <div>Last Success: <span className="font-mono text-slate-500">{src.last_success ? src.last_success.split('T')[0] : 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 space-y-1.5">
            <h4 className="font-extrabold text-blue-900 flex items-center gap-1.5">
              <span>ℹ️</span> Data Collection Policy &amp; Security
            </h4>
            <p>
              HireAI strictly isolates all external API credentials on the server backend. Data collection runs in daily background cycles to respect external API rate limits and maximize query efficiency.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
