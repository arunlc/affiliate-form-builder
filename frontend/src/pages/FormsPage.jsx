// frontend/src/pages/FormsPage.jsx - COMPLETE FIXED VERSION
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { formsAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { 
  FileText, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  Settings,
  TrendingUp,
  Target,
  Calendar,
  Zap
} from 'lucide-react'

// Import our components
import { 
  FormModal, 
  FormStatsModal,
  FormSettingsModal
} from '../components/forms'
import FormsTable from '../components/forms/FormsTable'
import FormLeadsModal from '../components/forms/FormLeadsModal'

export default function FormsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const queryClient = useQueryClient()

  // Check user role
  const isAdmin = user?.user_type === 'admin'
  const isAffiliate = user?.user_type === 'affiliate'
  const isOperations = user?.user_type === 'operations'

  // Fetch forms with role-based filtering - FIXED
  const { data: formsData, isLoading, error } = useQuery(
    ['forms', currentPage, pageSize, searchTerm, sortBy, sortOrder], 
    () => {
      // Simplified parameters - let backend handle user role filtering
      const params = {
        page: currentPage,
        page_size: pageSize,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
      }
      
      // Only add search if there's a search term
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      console.log('🔍 Fetching forms with params:', params)
      return formsAPI.getForms(params)
    },
    {
      retry: 1,
      keepPreviousData: true,
      onSuccess: (data) => {
        console.log('✅ Forms fetched successfully:', data?.data)
      },
      onError: (error) => {
        console.error('❌ Forms fetch error:', error)
        console.error('Error details:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        })
        setNotification({
          type: 'error',
          message: 'Failed to load forms. Please try again.'
        })
      }
    }
  )

  // FIXED: Extract forms and pagination info - handle both array and paginated responses
  const forms = Array.isArray(formsData?.data) 
    ? formsData.data 
    : formsData?.data?.results || []

  const totalCount = Array.isArray(formsData?.data) 
    ? formsData.data.length 
    : formsData?.data?.count || 0

  const totalPages = Math.ceil(totalCount / pageSize)

  console.log('📊 Forms data extracted:', {
    formsCount: forms.length,
    totalCount,
    totalPages,
    rawDataType: Array.isArray(formsData?.data) ? 'array' : 'paginated object'
  })

  // Create/Update form mutation (Admin only)
  const saveFormMutation = useMutation(
    (formData) => {
      if (editingForm) {
        return formsAPI.updateForm(editingForm.id, formData)
      } else {
        return formsAPI.createForm(formData)
      }
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('forms')
        setIsModalOpen(false)
        setEditingForm(null)
        setNotification({
          type: 'success',
          message: editingForm ? 'Form updated successfully!' : 'Form created successfully!'
        })
      },
      onError: (error) => {
        console.error('Save form error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to save form. Please try again.'
        })
      }
    }
  )

  // Delete form mutation (Admin only)
  const deleteFormMutation = useMutation(
    (formId) => formsAPI.deleteForm(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms')
        setNotification({
          type: 'success',
          message: 'Form deleted successfully!'
        })
      },
      onError: (error) => {
        console.error('Delete form error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to delete form. Please try again.'
        })
      }
    }
  )

  // Duplicate form mutation (Admin only)
  const duplicateFormMutation = useMutation(
    (formId) => formsAPI.duplicateForm(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms')
        setNotification({
          type: 'success',
          message: 'Form duplicated successfully!'
        })
      },
      onError: (error) => {
        console.error('Duplicate form error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to duplicate form. Please try again.'
        })
      }
    }
  )

  // Toggle form status mutation (Admin only)
  const toggleStatusMutation = useMutation(
    ({ formId, isActive }) => formsAPI.updateForm(formId, { is_active: isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms')
      },
      onError: (error) => {
        console.error('Toggle status error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to update form status.'
        })
      }
    }
  )

  // Event handlers
  const handleCreateForm = () => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: 'Only administrators can create forms.'
      })
      return
    }
    setEditingForm(null)
    setIsModalOpen(true)
  }

  const handleEditForm = (form) => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: 'Only administrators can edit forms.'
      })
      return
    }
    setEditingForm(form)
    setIsModalOpen(true)
  }

  const handleDeleteForm = (form) => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: 'Only administrators can delete forms.'
      })
      return
    }
    if (window.confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(form.id)
    }
  }

  const handleDuplicateForm = (form) => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: 'Only administrators can duplicate forms.'
      })
      return
    }
    if (window.confirm(`Create a copy of "${form.name}"?`)) {
      duplicateFormMutation.mutate(form.id)
    }
  }

  const handleViewStats = (form) => {
    setSelectedForm(form)
    setIsStatsModalOpen(true)
  }

  const handleViewEntries = (form) => {
    setSelectedForm(form)
    setIsLeadsModalOpen(true)
  }

  const handleToggleStatus = (form) => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: 'Only administrators can change form status.'
      })
      return
    }
    toggleStatusMutation.mutate({
      formId: form.id,
      isActive: !form.is_active
    })
  }

  const handleFormSettings = (form) => {
    setSelectedForm(form)
    setIsSettingsModalOpen(true)
  }

  const handleSaveForm = (formData) => {
    saveFormMutation.mutate(formData)
  }

  const handleSort = (column, order) => {
    setSortBy(column)
    setSortOrder(order)
    setCurrentPage(1)
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Calculate stats for summary cards
  const stats = {
    total: totalCount,
    active: forms.filter(f => f.is_active).length,
    totalFields: forms.reduce((sum, form) => sum + (form.fields?.length || 0), 0),
    totalSubmissions: forms.reduce((sum, form) => sum + (form.total_submissions || 0), 0)
  }

  // Auto-hide notifications
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Stats Card Component
  const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header - Role-specific */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAffiliate ? 'My Assigned Forms' : 'Forms Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAffiliate 
                ? 'Forms you can promote with your affiliate tracking'
                : 'Create and manage your embeddable lead capture forms'
              }
            </p>
          </div>
          
          {/* Create button only for admins */}
          {isAdmin && (
            <button
              onClick={handleCreateForm}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Form
            </button>
          )}

          {/* Info banner for affiliates */}
          {isAffiliate && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 max-w-md">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Your Affiliate Dashboard</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Code: <span className="font-mono bg-blue-100 px-1 rounded">{user.affiliate_id}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Click "Settings" on any form to get your tracking URLs
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary - Updated labels for affiliates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title={isAffiliate ? 'Assigned Forms' : 'Total Forms'}
            value={stats.total}
            subtitle={isAffiliate ? 'Available to promote' : 'All forms'}
            icon={FileText}
            color="blue"
            trend={isAffiliate ? null : '+2 this week'}
          />
          
          <StatsCard
            title="Active Forms"
            value={stats.active}
            subtitle="Currently live"
            icon={CheckCircle}
            color="green"
          />
          
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            subtitle={isAffiliate ? 'Your referrals' : 'All submissions'}
            icon={Users}
            color="purple"
            trend="+12% this month"
          />
          
          <StatsCard
            title={isAffiliate ? 'Avg. Performance' : 'Total Fields'}
            value={isAffiliate ? '8.5%' : stats.totalFields}
            subtitle={isAffiliate ? 'Conversion rate' : 'Form fields'}
            icon={isAffiliate ? Target : BarChart3}
            color="orange"
          />
        </div>

        {/* Search and Results Count */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} forms
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Forms</h3>
                <p className="text-red-700 mt-1">
                  {error.message || 'Unable to load forms. Please try again.'}
                </p>
                <button
                  onClick={() => queryClient.invalidateQueries('forms')}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forms Table - Role-based props */}
        {!error && (
          <FormsTable
            forms={forms}
            loading={isLoading}
            onEdit={isAdmin ? handleEditForm : null}
            onDelete={isAdmin ? handleDeleteForm : null}
            onDuplicate={isAdmin ? handleDuplicateForm : null}
            onViewStats={handleViewStats}
            onViewEntries={handleViewEntries}
            onToggleStatus={isAdmin ? handleToggleStatus : null}
            onFormSettings={handleFormSettings}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isAffiliate={isAffiliate}
          />
        )}

        {/* Pagination */}
        {!error && !isLoading && totalPages > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + Math.max(1, currentPage - 2)
                    if (page > totalPages) return null
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Role-specific */}
        {!error && !isLoading && forms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            {totalCount === 0 ? (
              <>
                {isAffiliate ? (
                  <>
                    <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No forms assigned</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      You haven't been assigned any forms to promote yet. Contact your administrator to get access to forms.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        💡 Once assigned, you'll see forms here with your tracking URLs and performance metrics.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No forms found</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      You don't have any forms yet. Create your first lead capture form to start collecting leads.
                    </p>
                    {isAdmin && (
                      <button
                        onClick={handleCreateForm}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Form
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms match your search</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or clear the search to see all forms.
                </p>
                <button
                  onClick={() => handleSearch('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        )}

        {/* Modals - Role-based access */}
        {isAdmin && (
          <FormModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingForm(null)
            }}
            form={editingForm}
            onSubmit={handleSaveForm}
            loading={saveFormMutation.isLoading}
          />
        )}

        <FormStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false)
            setSelectedForm(null)
          }}
          form={selectedForm}
        />

        <FormLeadsModal
          isOpen={isLeadsModalOpen}
          onClose={() => {
            setIsLeadsModalOpen(false)
            setSelectedForm(null)
          }}
          form={selectedForm}
        />

        <FormSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false)
            setSelectedForm(null)
          }}
          form={selectedForm}
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
                ×
              </button>
            </div>
          </div>
        )}

        {/* Affiliate Help Section */}
        {isAffiliate && forms.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Start Promoting Your Forms</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Settings className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium">1. Get Your Links</span>
                </div>
                <p className="text-gray-600">Click "Settings" on any form to get your tracking URLs and embed codes.</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Target className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-medium">2. Add UTM Tracking</span>
                </div>
                <p className="text-gray-600">Use campaign tracking to measure performance across different channels.</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="font-medium">3. Track Results</span>
                </div>
                <p className="text-gray-600">Monitor your leads and conversions in the Stats and Leads sections.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
