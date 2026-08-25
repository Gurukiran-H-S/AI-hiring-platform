/**
 * AI Hiring Platform - Centralized Frontend API Service Layer
 */
import axios from 'axios'

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocalhost) {
      return (envUrl && envUrl.includes('localhost')) ? `${envUrl.replace(/\/$/, '')}/api` : 'http://localhost:8000/api'
    }
    // Deployed HTTPS domain (e.g. Vercel or Render)
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`
    }
    return 'https://ai-hiring-platform-hwfz.onrender.com/api'
  }
  return envUrl ? (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`) : 'http://localhost:8000/api'
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const { data } = await axios.post(`${getBaseUrl()}/auth/refresh`, null, {
            params: { refresh_token: refresh },
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return apiClient(original)
        }
      } catch (refreshErr) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── AUTH SERVICE ─────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (payload) => apiClient.post('/auth/register', payload),
  sendOtp: (email) => apiClient.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),
  getMe: () => apiClient.get('/auth/me'),
}

// ─── CANDIDATE SERVICE ────────────────────────────────────────────────────────
export const candidateService = {
  getProfile: () => apiClient.get('/candidate/profile'),
  getPublicProfile: (candidateId) => apiClient.get(`/candidate/profile/${candidateId}`),
  getApplications: () => apiClient.get('/applications/'),
  getResumes: () => apiClient.get('/resumes/'),
  uploadResume: (formData) => apiClient.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// ─── RECRUITER SERVICE ────────────────────────────────────────────────────────
export const recruiterService = {
  getJobs: () => apiClient.get('/recruiter/jobs'),
  createJob: (payload) => apiClient.post('/recruiter/jobs', payload),
  updateJob: (jobId, payload) => apiClient.put(`/recruiter/jobs/${jobId}`, payload),
  getJobWeights: (jobId) => apiClient.get(`/recruiter/jobs/${jobId}/weights`),
  updateJobWeights: (jobId, payload) => apiClient.put(`/recruiter/jobs/${jobId}/weights`, payload),
  recalculateRankings: (jobId) => apiClient.post(`/recruiter/jobs/${jobId}/recalculate`),
  getRankings: (jobId) => apiClient.get(`/recruiter/jobs/${jobId}/rankings`),
  getAnalytics: (jobId) => apiClient.get(`/recruiter/jobs/${jobId}/analytics`),
  getScoreBreakdown: (jobId, candidateId) => apiClient.get(`/recruiter/jobs/${jobId}/candidates/${candidateId}/score-breakdown`),
  compareCandidates: (jobId, candidateIds) => apiClient.post(`/recruiter/jobs/${jobId}/compare`, { candidate_ids: candidateIds }),
}

// ─── CODING PLAYGROUND SERVICE ────────────────────────────────────────────────
export const codingService = {
  getProblems: (params) => apiClient.get('/coding/problems', { params }),
  getProblemDetail: (id) => apiClient.get(`/coding/problems/${id}`),
  runCode: (payload) => apiClient.post('/coding/run', payload),
  submitCode: (payload) => apiClient.post('/coding/submit', payload),
  getLeaderboard: () => apiClient.get('/coding/leaderboard'),
  getCodingProfile: () => apiClient.get('/coding/profile'),
  getAssessments: () => apiClient.get('/coding/assessments'),
  getAiHint: (payload) => apiClient.post('/coding/hint', payload),
}

// ─── MARKET INTELLIGENCE SERVICE ──────────────────────────────────────────────
export const marketService = {
  getTrends: () => apiClient.get('/trends'),
  getForecast: () => apiClient.get('/forecast/jobs'),
  getOverview: (days) => apiClient.get('/market/overview', { params: { days } }),
  getSkills: (days) => apiClient.get('/market/skills', { params: { days } }),
}

export default apiClient
