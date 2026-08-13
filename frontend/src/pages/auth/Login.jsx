import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/common/Navbar'
import { AuthIllustration } from '../../components/auth/AuthIllustration'
import { PasswordField } from '../../components/auth/PasswordField'
import toast from 'react-hot-toast'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [showWrongPasswordModal, setShowWrongPasswordModal] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setShowWrongPasswordModal(false)

    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.full_name || 'User'}! Redirecting to Dashboard...`)

      setTimeout(() => {
        if (user.role === 'candidate') navigate('/candidate')
        else if (user.role === 'recruiter') navigate('/recruiter')
        else if (user.role === 'admin') navigate('/admin')
      }, 500)
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 'Unable to sign in. Please check your credentials.'
      setErrorMessage(errorDetail)

      if (errorDetail.toLowerCase().includes('wrong password')) {
        setShowWrongPasswordModal(true)
        toast.error('Wrong password! Please check your password and try again.', {
          duration: 5000,
          style: {
            background: '#1f1315',
            color: '#f87171',
            border: '1px solid #ef4444',
          },
        })
      } else {
        toast.error(errorDetail)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white relative flex flex-col justify-between overflow-x-hidden">
      <Navbar />

      {/* Hero Ambient Background Orbs */}
      <div className="orb-primary w-[500px] h-[500px] -top-32 -left-32 opacity-40"></div>
      <div className="orb-accent w-[400px] h-[400px] bottom-0 -right-32 opacity-40"></div>

      <main className="flex-1 flex items-center justify-center px-4 py-24 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#0d0e19]/80 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 transition-all duration-500">
          
          {/* LEFT COLUMN: Animated AI Platform Visual */}
          <AuthIllustration
            title="Find Your Perfect Career"
            subtitle="Connect your skills with top job opportunities powered by spaCy NLP and Sentence Transformers."
          />

          {/* RIGHT COLUMN: Modern Glassmorphic Login Form */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <span>🔐</span> Secure Sign In
              </div>
              <h2 className="font-display font-bold text-3xl text-white">Welcome Back</h2>
              <p className="text-slate-400 text-xs mt-1">
                Access candidate analytics, recruiter job management, or system governance.
              </p>
            </div>

            {/* Error Banner Notification */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between animate-shake">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#0a0b14]/80 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-300 transform hover:scale-[1.01]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Account →'
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Wrong Password Pop-up Modal */}
      {showWrongPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-scale-up">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full bg-[#0d0e19] border border-rose-500/40 text-center space-y-4 text-xs shadow-2xl shadow-rose-500/20">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl mx-auto">
              🔒
            </div>
            <h3 className="text-lg font-bold text-rose-300 font-display">Wrong Password</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              The password you entered for <strong className="text-white">{email}</strong> is incorrect. Please check your password and try again.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowWrongPasswordModal(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
