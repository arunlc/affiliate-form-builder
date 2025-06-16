// frontend/src/pages/FormsPage.jsx - Updated with Form Settings
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { formsAPI } from '../services/api'
import { 
  FileText, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Import our components
import { 
  FormModal, 
  FormStatsModal 
} from '../components/forms'
import FormsTable from '../components/forms/FormsTable'
import FormLeadsModal from '../components/forms/FormLeadsModal'

// NEW: Import Form Settings Modal (we'll create this next)
import FormSettingsModal from '../components/forms/FormSettingsModal'

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false) // NEW
  const [editingForm, setEditingForm] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const queryClient = useQueryClient()

  // Fetch forms with pagination and sorting
  const { data: formsData, isLoading, error } = useQuery(
    ['forms', { 
      page: currentPage, 
      pageSize, 
      search: searchTerm, 
      sortBy, 
      sortOrder 
    }], 
    () => formsAPI.getForms({
      page: currentPage,
      page_size: pageSize,
      search: searchTerm,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy
    }),
    {
      retry: 1,
      keepPreviousData: true,
      onError: (error) => {
        console.error('Forms fetch error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to load forms. Please try again.'
        })
      }
    }
  )

  // Extract forms and pagination info
  const forms = formsData?.data?.results || []
  const totalCount = formsData?.data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Create/Update form mutation
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

  // Delete form mutation
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

  // Duplicate form mutation
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

  // Toggle form status mutation
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
    setEditingForm(null)
    setIsModalOpen(true)
  }

  const handleEditForm = (form) => {
    setEditingForm(form)
    setIsModalOpen(true)
  }

  const handleDeleteForm = (form) => {
    if (window.confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(form.id)
    }
  }

  const handleDuplicateForm = (form) => {
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
    toggleStatusMutation.mutate({
      formId: form.id,
      isActive: !form.is_active
    })
  }

  // NEW: Form Settings Handler
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
    leadCapture: forms.filter(f => f.form_type === 'lead_capture').length
  }

  // Auto-hide notifications
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your embeddable lead capture forms
            </p>
          </div>
          <button
            onClick={handleCreateForm}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Form
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Forms</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-600">Active Forms</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFields}</p>
                <p className="text-sm text-gray-600">Total Fields</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.leadCapture}</p>
                <p className="text-sm text-gray-600">Lead Capture</p>
              </div>
            </div>
          </div>
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

        {/* Forms Table */}
        {!error && (
          <FormsTable
            forms={forms}
            loading={isLoading}
            onEdit={handleEditForm}
            onDelete={handleDeleteForm}
            onDuplicate={handleDuplicateForm}
            onViewStats={handleViewStats}
            onViewEntries={handleViewEntries}
            onToggleStatus={handleToggleStatus}
            onFormSettings={handleFormSettings}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
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

        {/* Empty State */}
        {!error && !isLoading && forms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            {totalCount === 0 ? (
              <>
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No forms found</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  You don't have any forms yet. Create your first lead capture form to start collecting leads.
                </p>
                <button
                  onClick={handleCreateForm}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Form
                </button>
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

        {/* Modals */}
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

        {/* NEW: Form Settings Modal */}
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
      </div>
    </Layout>
  )
}
