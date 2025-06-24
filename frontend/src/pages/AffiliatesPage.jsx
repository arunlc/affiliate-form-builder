// AffiliatesPage.jsx - Part 1: Imports and AffiliateModal Component
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { affiliatesAPI, formsAPI } from '../services/api'
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Settings,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Building,
  Globe,
  Mail,
  Phone
} from 'lucide-react'

// Affiliate Modal Component - FIXED VERSION
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
    
    if (formData.website && formData.website.trim() && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('📝 Form validation started with data:', formData)
    
    if (validateForm()) {
      console.log('✅ Form validation passed, submitting...')
      onSubmit(formData)
    } else {
      console.log('❌ Form validation failed:', errors)
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
// AffiliatesPage.jsx - Part 2: FormAssignmentModal and Main Component Start

// Form Assignment Modal Component  
const FormAssignmentModal = ({ isOpen, onClose, affiliate, assignedForms, onSaveAssignments }) => {
  const [selectedForms, setSelectedForms] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch all forms
  const { data: formsData } = useQuery('forms', () => formsAPI.getForms())
  const forms = formsData?.data?.results || formsData?.data || []

  React.useEffect(() => {
    if (isOpen && assignedForms) {
      setSelectedForms(assignedForms.map(f => f.id))
    }
  }, [isOpen, assignedForms])

  const handleFormToggle = (formId) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSaveAssignments(affiliate.id, selectedForms)
      onClose()
    } catch (error) {
      console.error('Failed to save assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !affiliate) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Assign Forms</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">{affiliate.user_name} ({affiliate.affiliate_code})</p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          {forms.length > 0 ? (
            <div className="space-y-3">
              {forms.map(form => (
                <div key={form.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form.id)}
                      onChange={() => handleFormToggle(form.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{form.name}</h4>
                      <p className="text-sm text-gray-500">{form.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No forms available. Create some forms first.
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main AffiliatesPage Component - START
export default function AffiliatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [assignedForms, setAssignedForms] = useState([])
  const [notification, setNotification] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

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

  // Create affiliate mutation - FIXED
  const createAffiliateMutation = useMutation(
    (affiliateData) => {
      console.log('🚀 Sending affiliate data to API:', affiliateData)
      return affiliatesAPI.createAffiliate(affiliateData)
    },
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
        console.error('❌ Create affiliate error:', error)
        
        // Extract detailed error message
        let errorMessage = 'Failed to create affiliate'
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data) {
          // Handle field-specific errors
          const data = error.response.data
          if (typeof data === 'object') {
            const fieldErrors = Object.entries(data).map(([field, errors]) => {
              const errorList = Array.isArray(errors) ? errors : [errors]
              return `${field}: ${errorList.join(', ')}`
            }).join('; ')
            if (fieldErrors) errorMessage = fieldErrors
          }
        }
        
        setNotification({
          type: 'error',
          message: errorMessage
        })
      }
    }
  )

  // Update affiliate mutation - FIXED
  const updateAffiliateMutation = useMutation(
    ({ affiliateId, affiliateData }) => {
      console.log('🔄 Updating affiliate:', affiliateId, affiliateData)
      return affiliatesAPI.updateAffiliate(affiliateId, affiliateData)
    },
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
        console.error('❌ Update affiliate error:', error)
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

  // Event handlers - FIXED
  const handleCreateAffiliate = async (affiliateData) => {
    console.log('📝 handleCreateAffiliate called with:', affiliateData)
    
    try {
      if (editingAffiliate) {
        // Update existing affiliate
        await updateAffiliateMutation.mutateAsync({
          affiliateId: editingAffiliate.id,
          affiliateData: {
            affiliate_code: affiliateData.affiliate_code,
            company_name: affiliateData.company_name,
            website: affiliateData.website,
            is_active: affiliateData.is_active,
            // Include user fields for update
            user_name: affiliateData.user_name,
            email: affiliateData.email
          }
        })
      } else {
        // Create new affiliate
        await createAffiliateMutation.mutateAsync({
          user_name: affiliateData.user_name,
          affiliate_code: affiliateData.affiliate_code,
          company_name: affiliateData.company_name,
          website: affiliateData.website,
          email: affiliateData.email,
          phone: affiliateData.phone,
          is_active: affiliateData.is_active
        })
      }
    } catch (error) {
      console.error('❌ Affiliate operation failed:', error)
      // Error handling is done in the mutation onError callbacks
    }
  }
  // AffiliatesPage.jsx - Part 3: Rest of Main Component and JSX

  const handleEditAffiliate = (affiliate) => {
    setEditingAffiliate(affiliate)
    setIsModalOpen(true)
  }

  const handleDeleteAffiliate = (affiliate) => {
    if (window.confirm(`Are you sure you want to delete "${affiliate.user_name}"? This action cannot be undone.`)) {
      deleteAffiliateMutation.mutate(affiliate.id)
    }
  }

  const handleAssignForms = (affiliate) => {
    setSelectedAffiliate(affiliate)
    // TODO: Fetch assigned forms for this affiliate
    setAssignedForms([]) // Placeholder
    setIsAssignmentModalOpen(true)
  }

  const handleSaveAssignments = async (affiliateId, formIds) => {
    // TODO: Implement form assignment API call
    console.log('Assign forms', formIds, 'to affiliate', affiliateId)
    setNotification({
      type: 'success',
      message: 'Form assignments updated successfully!'
    })
  }

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(column)
    setSortOrder(newOrder)
  }

  // Calculate stats
  const stats = {
    total: affiliates.length,
    active: affiliates.filter(a => a.is_active).length,
    totalLeads: affiliates.reduce((sum, a) => sum + (a.total_leads || 0), 0),
    totalConversions: affiliates.reduce((sum, a) => sum + (a.total_conversions || 0), 0)
  }

  // Auto-hide notifications
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const SortableHeader = ({ column, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === column && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  )

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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Affiliates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-2">Registered partners</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Affiliates</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600 mt-2">Currently active</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                <p className="text-sm text-gray-600 mt-2">All affiliates</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Conversions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
                <p className="text-sm text-gray-600 mt-2">Successful referrals</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
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

            <div className="text-sm text-gray-600">
              {filteredAffiliates.length} affiliates found
            </div>
          </div>
        </div>

        {/* Affiliates Table */}
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader column="user_name">Affiliate</SortableHeader>
                    <SortableHeader column="affiliate_code">Code</SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <SortableHeader column="total_leads">Leads</SortableHeader>
                    <SortableHeader column="total_conversions">Conversions</SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conv. Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                      {/* Affiliate Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{affiliate.user_name}</div>
                            {affiliate.company_name && (
                              <div className="text-sm text-gray-500">{affiliate.company_name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Affiliate Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded">
                          {affiliate.affiliate_code}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {affiliate.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-32">{affiliate.email}</span>
                            </div>
                          )}
                          {affiliate.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{affiliate.phone}</span>
                            </div>
                          )}
                          {affiliate.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="h-3 w-3 mr-1" />
                              <a 
                                href={affiliate.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 truncate max-w-32"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Leads */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {affiliate.total_leads || 0}
                      </td>

                      {/* Conversions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {affiliate.total_conversions || 0}
                      </td>

                      {/* Conversion Rate */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {affiliate.conversion_rate?.toFixed(1) || 0}%
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={affiliate.is_active}
                            onChange={() => {
                              // TODO: Add toggle status functionality
                              console.log('Toggle status for', affiliate.id)
                            }}
                            className="sr-only"
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            affiliate.is_active ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              affiliate.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                        </label>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAssignForms(affiliate)}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Assign Forms
                          </button>
                          
                          <button
                            onClick={() => handleEditAffiliate(affiliate)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDeleteAffiliate(affiliate)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        <FormAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false)
            setSelectedAffiliate(null)
            setAssignedForms([])
          }}
          affiliate={selectedAffiliate}
          assignedForms={assignedForms}
          onSaveAssignments={handleSaveAssignments}
        />

        {/* Notification Toast */}
        {notification && (
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
              <button 
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
