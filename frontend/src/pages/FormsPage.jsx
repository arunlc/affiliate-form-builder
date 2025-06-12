// frontend/src/pages/FormsPage.jsx - Updated with new components
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
  Users
} from 'lucide-react'

// Import our new form components
import { 
  FormModal, 
  FormCard, 
  FormStatsModal, 
  FormFieldsPreview 
} from '../components/forms'

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState(null)
  const [notification, setNotification] = useState(null)

  const queryClient = useQueryClient()

  // Fetch forms
  const { data: formsData, isLoading, error } = useQuery(
    'forms', 
    formsAPI.getForms,
    {
      retry: 1,
      onError: (error) => {
        console.error('Forms fetch error:', error)
        setNotification({
          type: 'error',
          message: 'Failed to load forms. Please try again.'
        })
      }
    }
  )

  // Extract forms from response
  const forms = formsData?.data?.results || []

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

  const handleSaveForm = (formData) => {
    saveFormMutation.mutate(formData)
  }

  // Filter forms
  const filteredForms = forms.filter(form => 
    form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.is_active).length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {forms.reduce((sum, form) => sum + (form.fields?.length || 0), 0)}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {forms.filter(f => f.form_type === 'lead_capture').length}
                </p>
                <p className="text-sm text-gray-600">Lead Capture</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredForms.length} forms found
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading forms...</p>
            </div>
          </div>
        )}

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

        {/* Empty State */}
        {!isLoading && !error && filteredForms.length === 0 && forms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
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
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredForms.length === 0 && forms.length > 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms match your search</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or clear the search to see all forms.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Forms Grid */}
        {!isLoading && !error && filteredForms.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onEdit={handleEditForm}
                onDuplicate={handleDuplicateForm}
                onDelete={handleDeleteForm}
                onViewStats={handleViewStats}
              />
            ))}
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
