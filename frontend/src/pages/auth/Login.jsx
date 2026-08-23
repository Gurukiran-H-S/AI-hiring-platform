import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/common/Navbar'
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
            background: '#FEF0F0',
            color: '#D92D20',
            border: '1px solid #FECDCA',
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
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-line rounded-[10px] shadow-card overflow-hidden">

          {/* LEFT PANEL: Brand Messaging */}
          <div className="hidden lg:flex flex-col justify-between bg-brand-subtle border-r border-line p-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-brand text-white flex items-center justify-center font-bold text-lg">
                Hi
              </div>
              <div>
                <p className="font-bold text-lg text-ink leading-tight">HireAI</p>
                <p className="text-xs text-ink-2">AI-Powered Hiring &amp; Candidate Evaluation Platform</p>
              </div>
            </div>

            <div>
              <span className="badge badge-blue mb-4 inline-flex">Secure &amp; Intelligent</span>
              <h3 className="font-bold text-2xl text-ink leading-snug">Find Your Perfect Career</h3>
              <p className="text-sm text-ink-2 mt-3 leading-relaxed">
                Connect your skills with top job opportunities powered by AI-driven resume
                parsing and semantic job matching.
              </p>
            </div>

            <p className="text-xs text-ink-3">Trusted by recruiters and candidates worldwide.</p>
          </div>

          {/* RIGHT PANEL: Login Form */}
          <div className="p-8 md:p-10 space-y-6">
            <div>
              <h2 className="page-title">Welcome Back</h2>
              <p className="text-sm text-ink-2 mt-1">
                Access candidate analytics, recruiter job management, or system governance.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-[10px] bg-err-bg border border-err/30 text-err text-xs font-semibold p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-err hover:text-ink font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="field-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="input w-full"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center text-sm text-ink-2 border-t border-line pt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand font-semibold hover:underline">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Wrong Password Modal */}
      {showWrongPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="bg-white border border-line rounded-[10px] shadow-card max-w-md w-full p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-err-bg border border-err/30 text-err flex items-center justify-center text-2xl mx-auto">
              🔒
            </div>
            <h3 className="text-lg font-bold text-ink">Wrong Password</h3>
            <p className="text-sm text-ink-2 leading-relaxed">
              The password you entered for <strong className="text-ink">{email}</strong> is incorrect.
              Please check your password and try again.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowWrongPasswordModal(false)}
                className="btn-danger px-6 py-2.5 rounded-[10px] text-sm font-semibold"
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
