// frontend/src/pages/AffiliatesPage.jsx - Complete Implementation
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { affiliatesAPI } from '../services/api'
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  BarChart3,
  TrendingUp,
  DollarSign,
  Copy,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Mail,
  Phone,
  Globe,
  Building,
  Calendar,
  Activity,
  Target,
  Award,
  Link as LinkIcon,
  Download
} from 'lucide-react'

// Affiliate Stats Modal
const AffiliateStatsModal = ({ isOpen, onClose, affiliate }) => {
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  React.useEffect(() => {
    if (isOpen && affiliate && !statsData) {
      loadStats()
    }
  }, [isOpen, affiliate])

  const loadStats = async () => {
    if (!affiliate) return
    setLoading(true)
    try {
      const response = await affiliatesAPI.getAffiliateStats(affiliate.id)
      setStatsData(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
      setStatsData({ error: 'Failed to load statistics' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Affiliate Performance</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">{affiliate?.user_name} ({affiliate?.affiliate_code})</p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
          ) : statsData?.error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{statsData.error}</p>
            </div>
          ) : statsData ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{statsData.total_leads || 0}</div>
                  <div className="text-sm text-blue-600">Total Leads</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{statsData.total_conversions || 0}</div>
                  <div className="text-sm text-green-600">Conversions</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">{statsData.conversion_rate || 0}%</div>
                  <div className="text-sm text-purple-600">Conversion Rate</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">${statsData.estimated_revenue || 0}</div>
                  <div className="text-sm text-orange-600">Est. Revenue</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">This Month</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Leads:</span>
                        <span className="font-medium">{statsData.monthly_leads || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversions:</span>
                        <span className="font-medium">{statsData.monthly_conversions || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last 7 Days</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Leads:</span>
                        <span className="font-medium">{statsData.weekly_leads || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversions:</span>
                        <span className="font-medium">{statsData.weekly_conversions || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No analytics data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Affiliate Card Component
const AffiliateCard = ({ affiliate, onEdit, onDelete, onViewStats, onViewLeads }) => {
  const [copying, setCopying] = useState(false)
  
  const trackingLink = `${window.location.origin}/forms?affiliate=${affiliate.affiliate_code}&utm_source=affiliate&utm_medium=referral`
  
  const copyTrackingLink = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(trackingLink)
      setTimeout(() => setCopying(false), 2000)
    } catch (err) {
      setCopying(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{affiliate.user_name}</h3>
            <p className="text-sm text-gray-600">Code: {affiliate.affiliate_code}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
            affiliate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {affiliate.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Company Info */}
      {(affiliate.company_name || affiliate.website) && (
        <div className="mb-4 space-y-2">
          {affiliate.company_name && (
            <div className="flex items-center text-sm text-gray-600">
              <Building className="h-4 w-4 mr-2" />
              <span>{affiliate.company_name}</span>
            </div>
          )}
          {affiliate.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <a 
                href={affiliate.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {affiliate.website}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{affiliate.total_leads || 0}</div>
          <div className="text-xs text-gray-600">Total Leads</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{affiliate.total_conversions || 0}</div>
          <div className="text-xs text-gray-600">Conversions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{affiliate.conversion_rate?.toFixed(1) || 0}%</div>
          <div className="text-xs text-gray-600">Conv. Rate</div>
        </div>
      </div>

      {/* Tracking Link */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Link</label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-50 rounded-lg p-2">
            <code className="text-xs text-gray-700 break-all">{trackingLink}</code>
          </div>
          <button
            onClick={copyTrackingLink}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={copying ? "Copied!" : "Copy Link"}
          >
            {copying ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewStats(affiliate)}
            className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Stats
          </button>
          
          <button
            onClick={() => onViewLeads(affiliate)}
            className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-1" />
            Leads
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(affiliate)}
            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit Affiliate"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(affiliate)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Affiliate"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Join Date */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Joined {new Date(affiliate.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}

// Create/Edit Affiliate Modal
const AffiliateModal = ({ isOpen, onClose, affiliate, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    affiliate_code: '',
    company_name: '',
    website: '',
    email: '',
    phone: '',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    if (isOpen) {
      if (affiliate) {
        // Edit mode
        setFormData({
          user_name: affiliate.user_name || '',
          affiliate_code: affiliate.affiliate_code || '',
          company_name: affiliate.company_name || '',
          website: affiliate.website || '',
          email: affiliate.email || '',
          phone: affiliate.phone || '',
          is_active: affiliate.is_active !== undefined ? affiliate.is_active : true
        })
      } else {
        // Create mode
        setFormData({
          user_name: '',
          affiliate_code: generateAffiliateCode(),
          company_name: '',
          website: '',
          email: '',
          phone: '',
          is_active: true
        })
      }
      setErrors({})
    }
  }, [isOpen, affiliate])

  const generateAffiliateCode = () => {
    return 'AFF' + Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Username is required'
    }
    
    if (!formData.affiliate_code.trim()) {
      newErrors.affiliate_code = 'Affiliate code is required'
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {affiliate ? 'Edit Affiliate' : 'Create New Affiliate'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
            <input
              type="text"
              required
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.user_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter username"
              disabled={loading}
            />
            {errors.user_name && <p className="text-red-500 text-xs mt-1">{errors.user_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate Code *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={formData.affiliate_code}
                onChange={(e) => setFormData({ ...formData, affiliate_code: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.affiliate_code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Affiliate code"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, affiliate_code: generateAffiliateCode() })}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Generate
              </button>
            </div>
            {errors.affiliate_code && <p className="text-red-500 text-xs mt-1">{errors.affiliate_code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="affiliate@example.com"
              disabled={loading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Company name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.website ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
              disabled={loading}
            />
            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Affiliate is active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (affiliate ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
)

// Notification Toast
const NotificationToast = ({ notification, onClose }) => {
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  if (!notification) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
        notification.type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800' 
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        {notification.type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="font-medium">{notification.message}</span>
        <button onClick={onClose} className="ml-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Main AffiliatesPage Component
export default function AffiliatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const queryClient = useQueryClient()

  // Fetch affiliates
  const { data: affiliatesData, isLoading, error } = useQuery(
    'affiliates',
    affiliatesAPI.getAffiliates,
    {
      retry: 2,
      refetchOnWindowFocus: false
    }
  )

  const affiliates = affiliatesData?.data?.results || affiliatesData?.data || []

  // Filter affiliates
  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.affiliate_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && affiliate.is_active) ||
                         (statusFilter === 'inactive' && !affiliate.is_active)
    
    return matchesSearch && matchesStatus
  })

  // Create affiliate mutation
  const createAffiliateMutation = useMutation(
    (affiliateData) => affiliatesAPI.createAffiliate(affiliateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('affiliates')
        setIsModalOpen(false)
        setEditingAffiliate(null)
        setNotification({
          type: 'success',
          message: 'Affiliate created successfully!'
        })
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: 'Failed to create affiliate. Please try again.'
        })
      }
    }
  )

  // Update affiliate mutation
  const updateAffiliateMutation = useMutation(
    ({ affiliateId, affiliateData }) => affiliatesAPI.updateAffiliate(affiliateId, affiliateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('affiliates')
        setIsModalOpen(false)
        setEditingAffiliate(null)
        setNotification({
          type: 'success',
          message: 'Affiliate updated successfully!'
        })
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: 'Failed to update affiliate'
        })
      }
    }
  )

  // Delete affiliate mutation
  const deleteAffiliateMutation = useMutation(
    (affiliateId) => affiliatesAPI.deleteAffiliate(affiliateId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('affiliates')
        setNotification({
          type: 'success',
          message: 'Affiliate deleted successfully!'
        })
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: 'Failed to delete affiliate'
        })
      }
    }
  )

  // Event handlers
  const handleCreateAffiliate = (affiliateData) => {
    if (editingAffiliate) {
      updateAffiliateMutation.mutate({
        affiliateId: editingAffiliate.id,
        affiliateData
      })
    } else {
      createAffiliateMutation.mutate(affiliateData)
    }
  }

  const handleEditAffiliate = (affiliate) => {
    setEditingAffiliate(affiliate)
    setIsModalOpen(true)
  }

  const handleDeleteAffiliate = (affiliate) => {
    if (window.confirm(`Are you sure you want to delete "${affiliate.user_name}"? This action cannot be undone.`)) {
      deleteAffiliateMutation.mutate(affiliate.id)
    }
  }

  const handleViewStats = (affiliate) => {
    setSelectedAffiliate(affiliate)
    setIsStatsModalOpen(true)
  }

  const handleViewLeads = (affiliate) => {
    // Navigate to leads page with affiliate filter
    window.location.href = `/leads?affiliate=${affiliate.affiliate_code}`
  }

  // Calculate stats
  const stats = {
    total: affiliates.length,
    active: affiliates.filter(a => a.is_active).length,
    totalLeads: affiliates.reduce((sum, a) => sum + (a.total_leads || 0), 0),
    totalConversions: affiliates.reduce((sum, a) => sum + (a.total_conversions || 0), 0)
  }

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading affiliates...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Affiliates</h2>
            <p className="text-gray-600 mb-4">Unable to load affiliates. Please try again.</p>
            <button
              onClick={() => queryClient.invalidateQueries('affiliates')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Affiliates Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your affiliate partners and track their performance
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAffiliate(null)
              setIsModalOpen(true)
            }}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Affiliate
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Affiliates"
            value={stats.total}
            subtitle="Registered partners"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Active Affiliates"
            value={stats.active}
            subtitle="Currently active"
            icon={Activity}
            color="green"
            trend="+5% this month"
          />
          <StatsCard
            title="Total Leads"
            value={stats.totalLeads}
            subtitle="All affiliates"
            icon={Target}
            color="purple"
          />
          <StatsCard
            title="Conversions"
            value={stats.totalConversions}
            subtitle="Successful referrals"
            icon={Award}
            color="orange"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search affiliates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {filteredAffiliates.length} affiliates found
            </div>
          </div>
        </div>

        {/* Affiliates Grid */}
        {filteredAffiliates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            {affiliates.length === 0 ? (
              <>
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No affiliates yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Start building your affiliate network by adding your first partner.
                </p>
                <button
                  onClick={() => {
                    setEditingAffiliate(null)
                    setIsModalOpen(true)
                  }}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Affiliate
                </button>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No affiliates found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAffiliates.map((affiliate) => (
              <AffiliateCard
                key={affiliate.id}
                affiliate={affiliate}
                onEdit={handleEditAffiliate}
                onDelete={handleDeleteAffiliate}
                onViewStats={handleViewStats}
                onViewLeads={handleViewLeads}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <AffiliateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingAffiliate(null)
          }}
          affiliate={editingAffiliate}
          onSubmit={handleCreateAffiliate}
          loading={createAffiliateMutation.isLoading || updateAffiliateMutation.isLoading}
        />

        <AffiliateStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false)
            setSelectedAffiliate(null)
          }}
          affiliate={selectedAffiliate}
        />

        {/* Notification Toast */}
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      </div>
    </Layout>
  )
}
