// frontend/src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
}

export const formsAPI = {
  getForms: () => api.get('/forms/forms/'),
  createForm: (formData) => api.post('/forms/forms/', formData),
  updateForm: (id, formData) => api.put(`/forms/forms/${id}/`, formData),
  deleteForm: (id) => api.delete(`/forms/forms/${id}/`),
  getFormStats: (id) => api.get(`/forms/forms/${id}/stats/`),
}

export const leadsAPI = {
  getLeads: (params) => api.get('/leads/leads/', { params }),
  updateLead: (id, data) => api.put(`/leads/leads/${id}/`, data),
  exportLeads: () => api.get('/leads/export/', { responseType: 'blob' }),
  getLeadStats: () => api.get('/leads/stats/'),
}

export const affiliatesAPI = {
  getAffiliates: () => api.get('/affiliates/affiliates/'),
  createAffiliate: (data) => api.post('/affiliates/affiliates/', data),
  getAffiliateStats: (id) => api.get(`/affiliates/affiliates/${id}/stats/`),
}

export const coreAPI = {
  getDashboard: () => api.get('/core/dashboard/'),
  getAnalytics: () => api.get('/core/analytics/'),
}

export default api

---

// frontend/src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getProfile()
        .then(response => {
          setUser(response.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { user, token } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

---

// frontend/src/components/common/Header.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, User, Settings } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Affiliate Forms
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-900 hover:text-primary-600">
              Dashboard
            </Link>
            {user?.user_type === 'admin' && (
              <>
                <Link to="/forms" className="text-gray-900 hover:text-primary-600">
                  Forms
                </Link>
                <Link to="/affiliates" className="text-gray-900 hover:text-primary-600">
                  Affiliates
                </Link>
              </>
            )}
            <Link to="/leads" className="text-gray-900 hover:text-primary-600">
              Leads
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.username}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {user?.user_type}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

---

// frontend/src/components/common/Loading.jsx
import React from 'react'

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export default Loading

---

// frontend/src/pages/Login.jsx
import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Affiliate Form Builder
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

---

// frontend/src/pages/Dashboard.jsx
import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { coreAPI } from '../services/api'
import Header from '../components/common/Header'
import Loading from '../components/common/Loading'
import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    coreAPI.getDashboard
  )

  if (isLoading) return <Loading />

  const data = dashboardData?.data || {}

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your {user?.user_type} account.
            </p>
          </div>

          {user?.user_type === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Forms"
                value={data.total_forms || 0}
                icon={FileText}
                color="blue"
              />
              <StatCard
                title="Total Leads"
                value={data.total_leads || 0}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Active Affiliates"
                value={data.total_affiliates || 0}
                icon={TrendingUp}
                color="purple"
              />
            </div>
          )}

          {user?.user_type === 'affiliate' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="My Leads"
                value={data.my_leads || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Conversions"
                value={data.conversions || 0}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Conversion Rate"
                value={`${data.conversion_rate?.toFixed(1) || 0}%`}
                icon={TrendingUp}
                color="purple"
              />
            </div>
          )}

          {user?.user_type === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Leads"
                value={data.total_leads || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Pending Leads"
                value={data.pending_leads || 0}
                icon={FileText}
                color="yellow"
              />
              <StatCard
                title="Qualified Leads"
                value={data.qualified_leads || 0}
                icon={TrendingUp}
                color="green"
              />
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
            </div>
            <div className="px-6 py-4">
              {data.recent_leads?.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_leads.map((lead, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium text-gray-900">{lead.email}</p>
                        <p className="text-sm text-gray-500">{lead.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {lead.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent leads</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
