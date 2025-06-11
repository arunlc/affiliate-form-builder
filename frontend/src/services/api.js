// frontend/src/services/api.js
import axios from 'axios'

// Simple and direct API URL detection
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api' 
  : `${window.location.protocol}//${window.location.hostname}/api`

console.log('🔗 API Base URL:', API_BASE_URL) // Debug log

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
