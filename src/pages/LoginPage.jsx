import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch {
      setError('Could not send reset email. Check the address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Yodep Attendance</h1>
          <p className="text-brand-200 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="font-medium text-slate-800">Reset email sent</p>
              <p className="text-sm text-slate-500 mt-1">Check your inbox for a reset link.</p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }} className="mt-4 text-brand-600 text-sm font-medium hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@yodep.gov.mw"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {!resetMode && (
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Please wait…' : resetMode ? 'Send reset email' : 'Sign in'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setResetMode(!resetMode); setError('') }}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {resetMode ? 'Back to sign in' : 'Forgot password?'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
