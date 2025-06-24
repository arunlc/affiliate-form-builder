// frontend/src/services/api.js - Enhanced with Password Management
import axios from 'axios'

// Detect environment and set API URL
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '' // Server-side rendering
  
  const { hostname, protocol, port } = window.location
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    return 'http://localhost:8000/api'
  } else {
    // Production environment - use current domain
    return `${protocol}//${hostname}/api`
  }
}

const API_BASE_URL = getApiBaseUrl()

console.log('🔗 API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url)
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.status, response.config.url)
    }
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    })
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - API server might be down')
    }
    
    return Promise.reject(error)
  }
)

// Enhanced Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  
  // Password management
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
  setUserPassword: (passwordData) => api.post('/auth/set-password/', passwordData),
  
  // Password reset
  requestPasswordReset: (data) => api.post('/auth/password-reset/', data),
  confirmPasswordReset: (token, data) => api.post(`/auth/password-reset-confirm/${token}/`, data),
  
  // User management (admin only)
  createUser: (userData) => api.post('/auth/create-user/', userData),
  getUsers: (params = {}) => api.get('/auth/users/', { params }),
  getUser: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.put(`/auth/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
}

export const formsAPI = {
  getForms: (params = {}) => api.get('/forms/forms/', { params }),
  getForm: (id) => api.get(`/forms/forms/${id}/`),
  
  // Enhanced create form with field support
  createForm: (formData) => {
    // Transform the data to match Django API expectations
    const apiData = {
      name: formData.name,
      description: formData.description,
      form_type: formData.form_type,
      is_active: formData.is_active,
      fields_config: formData.styling_config || {},
      // Send fields as a separate parameter for the backend to process
      fields: formData.fields || []
    }
    return api.post('/forms/forms/', apiData)
  },
  
  // Enhanced update form with field support
  updateForm: (id, formData) => {
    const apiData = {
      name: formData.name,
      description: formData.description,
      form_type: formData.form_type,
      is_active: formData.is_active,
      fields_config: formData.styling_config || {},
      fields: formData.fields || []
    }
    return api.put(`/forms/forms/${id}/`, apiData)
  },
  
  deleteForm: (id) => api.delete(`/forms/forms/${id}/`),
  duplicateForm: (id) => api.post(`/forms/forms/${id}/duplicate/`),
  getFormStats: (id, params = {}) => api.get(`/forms/forms/${id}/stats/`, { params }),
  getFormAnalytics: (id, params = {}) => api.get(`/forms/forms/${id}/analytics/`, { params }),
  
  // Form field management
  getFormFields: (formId) => api.get(`/forms/forms/${formId}/fields/`),
  createFormField: (formId, fieldData) => api.post(`/forms/forms/${formId}/fields/`, fieldData),
  updateFormField: (formId, fieldId, fieldData) => api.put(`/forms/forms/${formId}/fields/${fieldId}/`, fieldData),
  deleteFormField: (formId, fieldId) => api.delete(`/forms/forms/${formId}/fields/${fieldId}/`),
  
  // Form submissions and analytics
  getFormSubmissions: (formId, params = {}) => api.get(`/forms/forms/${formId}/submissions/`, { params }),
  exportFormData: (formId, params = {}) => api.get(`/forms/forms/${formId}/export/`, { 
    params,
    responseType: 'blob' 
  }),
}

// Leads API
export const leadsAPI = {
  getLeads: (params = {}) => api.get('/leads/leads/', { params }),
  getLead: (id) => api.get(`/leads/leads/${id}/`),
  updateLead: (id, data) => api.put(`/leads/leads/${id}/`, data),
  deleteLead: (id) => api.delete(`/leads/leads/${id}/`),
  exportLeads: (params = {}) => api.get('/leads/export/', { 
    params,
    responseType: 'blob' 
  }),
  getLeadStats: (params = {}) => api.get('/leads/stats/', { params }),
  
  // Lead notes
  getLeadNotes: (leadId) => api.get(`/leads/leads/${leadId}/notes/`),
  addLeadNote: (leadId, noteData) => api.post(`/leads/leads/${leadId}/notes/`, noteData),
  updateLeadNote: (leadId, noteId, noteData) => api.put(`/leads/leads/${leadId}/notes/${noteId}/`, noteData),
  deleteLeadNote: (leadId, noteId) => api.delete(`/leads/leads/${leadId}/notes/${noteId}/`),
}

// Enhanced Affiliates API with Password Management
export const affiliatesAPI = {
  getAffiliates: (params = {}) => api.get('/affiliates/affiliates/', { params }),
  getAffiliate: (id) => api.get(`/affiliates/affiliates/${id}/`),
  
  // Enhanced create affiliate with password support
  createAffiliate: (data) => api.post('/affiliates/affiliates/', data),
  
  updateAffiliate: (id, data) => api.put(`/affiliates/affiliates/${id}/`, data),
  deleteAffiliate: (id) => api.delete(`/affiliates/affiliates/${id}/`),
  
  // Password management for affiliates
  resetAffiliatePassword: (id, data) => api.post(`/affiliates/affiliates/${id}/reset_password/`, data),
  sendCredentials: (id) => api.post(`/affiliates/affiliates/${id}/send_credentials/`),
  
  // Stats and leads
  getAffiliateStats: (id, params = {}) => api.get(`/affiliates/affiliates/${id}/stats/`, { params }),
  getAffiliateLeads: (id, params = {}) => api.get(`/affiliates/affiliates/${id}/leads/`, { params }),
  
  // Form assignments
  getFormAssignments: (id) => api.get(`/affiliates/affiliates/${id}/form_assignments/`),
  updateFormAssignments: (id, data) => api.post(`/affiliates/affiliates/${id}/form_assignments/`, data),
  
  // Bulk operations
  bulkAssignForms: (data) => api.post('/affiliates/bulk-assign/', data),
}

// Core/Dashboard API
export const coreAPI = {
  getDashboard: () => api.get('/core/dashboard/'),
  getAnalytics: (params = {}) => api.get('/core/analytics/', { params }),
  getSettings: () => api.get('/core/settings/'),
  updateSettings: (data) => api.post('/core/settings/', data),
}

// Utility functions
export const apiUtils = {
  // Check if API is available
  healthCheck: () => api.get('/health/').catch(() => ({ status: 'down' })),
  
  // Handle file uploads
  uploadFile: (file, endpoint = '/upload/') => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // Download file with proper filename
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  },
  
  // Format API errors for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  },
  
  // Validate password strength
  validatePassword: (password) => {
    const minLength = 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    const issues = []
    
    if (password.length < minLength) {
      issues.push(`Password must be at least ${minLength} characters long`)
    }
    if (!hasUpper) {
      issues.push('Password must contain at least one uppercase letter')
    }
    if (!hasLower) {
      issues.push('Password must contain at least one lowercase letter')
    }
    if (!hasNumber) {
      issues.push('Password must contain at least one number')
    }
    if (!hasSpecial) {
      issues.push('Password must contain at least one special character')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      strength: issues.length === 0 ? 'strong' : 
                issues.length <= 2 ? 'medium' : 'weak'
    }
  }
}

// Export default api instance for custom requests
export default api
