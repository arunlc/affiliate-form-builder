import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(credentials)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    })
  }

  const testAccounts = [
    { username: 'affiliate1', password: 'affiliate123', type: 'Affiliate' },
    { username: 'operations', password: 'ops123', type: 'Operations' }
  ]

  const quickLogin = (username, password) => {
    setCredentials({ username, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Affiliate Forms
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">
            Access your dashboard and manage your affiliate business
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Test Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 text-center">Quick access test accounts:</p>
            <div className="space-y-2">
              {testAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => quickLogin(account.username, account.password)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{account.type} Account</p>
                      <p className="text-xs text-gray-500 font-mono">{account.username} / {account.password}</p>
                    </div>
                    <div className="text-gray-400">
                      <LogIn className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Access */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need admin access?{' '}
            <a 
              href="/admin" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Django Admin Panel
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
