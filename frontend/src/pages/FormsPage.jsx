// frontend/src/pages/FormsPage.jsx - Clean version without debug
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { formsAPI } from '../services/api'
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit,
  Copy, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  ExternalLink,
  BarChart3
} from 'lucide-react'

// Form Card Component
const FormCard = ({ form, onEdit, onDuplicate, onDelete, onViewStats }) => {
  const [copying, setCopying] = useState(false)
  
  const baseUrl = window.location.origin
  const embedUrl = `${baseUrl}/embed/${form.id}/`
  const embedCode = form.embed_code?.replace('https://yourapp.com', baseUrl) || 
                   `<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0"></iframe>`
  
  const copyEmbedCode = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(embedCode)
      setTimeout(() => setCopying(false), 2000)
    } catch (err) {
      setCopying(false)
    }
  }

  const openPreview = () => {
    window.open(embedUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.name}</h3>
          <p className="text-gray-600 text-sm mb-3">
            {form.description || 'No description provided'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(form.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {form.fields?.length || 0} fields
            </span>
            <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
              {form.form_type?.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {form.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Form Fields Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-2">Form Fields:</p>
        <div className="space-y-1">
          {form.fields?.slice(0, 3).map((field, index) => (
            <div key={index} className="text-xs text-gray-700 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              {field.label} 
              <span className="text-gray-500 ml-1">({field.field_type})</span>
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </div>
          ))}
          {form.fields?.length > 3 && (
            <div className="text-xs text-gray-500">
              +{form.fields.length - 3} more fields
            </div>
          )}
        </div>
      </div>

      {/* Embed URL */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-600 mb-1">Embed URL:</p>
        <code className="text-xs text-blue-800 break-all">{embedUrl}</code>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <button
            onClick={openPreview}
            className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </button>
          
          <button
            onClick={() => onViewStats && onViewStats(form)}
            className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Stats
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={copyEmbedCode}
            disabled={copying}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={copying ? "Copied!" : "Copy Embed Code"}
          >
            {copying ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => onEdit && onEdit(form)}
            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit Form"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDuplicate && onDuplicate(form)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Duplicate Form"
          >
            <FileText className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete && onDelete(form)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Form"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Forms Page Component
export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Fetch forms
  const { data: formsData, isLoading, error } = useQuery(
    'forms', 
    formsAPI.getForms,
    {
      retry: 1,
      onError: (error) => {
        console.error('Forms fetch error:', error)
      }
    }
  )

  // Extract forms from response
  const forms = formsData?.data?.results || []

  // Delete form mutation
  const deleteFormMutation = useMutation(
    (formId) => formsAPI.deleteForm(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms')
      },
      onError: (error) => {
        console.error('Delete form error:', error)
        alert('Failed to delete form. Please try again.')
      }
    }
  )

  // Event handlers
  const handleEditForm = (form) => {
    alert(`Edit functionality for "${form.name}" will be added soon!`)
  }

  const handleDuplicateForm = (form) => {
    alert(`Duplicate functionality for "${form.name}" will be added soon!`)
  }

  const handleDeleteForm = (form) => {
    if (window.confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(form.id)
    }
  }

  const handleViewStats = (form) => {
    alert(`Statistics for "${form.name}" will be available soon!`)
  }

  // Filter forms
  const filteredForms = forms.filter(form => 
    form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            onClick={() => alert('Create form functionality will be added soon!')}
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
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={() => alert('Create form functionality will be added soon!')}
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
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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
      </div>
    </Layout>
  )
}
