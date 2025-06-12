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
  ExternalLink,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react'

const FormCard = ({ form, onEdit, onDuplicate, onDelete, onViewStats }) => {
  const embedUrl = `https://affiliate-form-builder.onrender.com/embed/${form.id}/`
  
  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0"></iframe>`
    navigator.clipboard.writeText(embedCode)
    // Could add toast notification here
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.name}</h3>
          <p className="text-gray-600 text-sm mb-3">{form.description || 'No description provided'}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(form.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {form.fields?.length || 0} fields
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.is_active)}`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {form.form_type?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewStats(form)}
              className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
              title="View Statistics"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </button>
            
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
              title="Preview Form"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </a>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={copyEmbedCode}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy Embed Code"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDuplicate(form)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Duplicate Form"
            >
              <FileText className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onEdit(form)}
              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Edit Form"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(form)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Form"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateFormModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    form_type: 'lead_capture'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: '', description: '', form_type: 'lead_capture' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Form</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Contact Form, Newsletter Signup"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe the purpose of this form"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
            <select
              value={formData.form_type}
              onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lead_capture">Lead Capture</option>
              <option value="contact">Contact Form</option>
              <option value="newsletter">Newsletter Signup</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FormsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch forms
  const { data: formsData, isLoading, error } = useQuery('forms', formsAPI.getForms)
  const forms = formsData?.data?.results || []

  // Create form mutation
  const createFormMutation = useMutation(formsAPI.createForm, {
    onSuccess: () => {
      queryClient.invalidateQueries('forms')
      setIsCreateModalOpen(false)
    },
    onError: (error) => {
      console.error('Error creating form:', error)
    }
  })

  // Delete form mutation
  const deleteFormMutation = useMutation(formsAPI.deleteForm, {
    onSuccess: () => {
      queryClient.invalidateQueries('forms')
    }
  })

  const handleCreateForm = (formData) => {
    createFormMutation.mutate(formData)
  }

  const handleDeleteForm = (form) => {
    if (window.confirm(`Are you sure you want to delete "${form.name}"?`)) {
      deleteFormMutation.mutate(form.id)
    }
  }

  const handleDuplicateForm = (form) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate form:', form.id)
  }

  const handleEditForm = (form) => {
    // TODO: Implement edit functionality
    console.log('Edit form:', form.id)
  }

  const handleViewStats = (form) => {
    // TODO: Implement stats view
    console.log('View stats for form:', form.id)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading forms...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading forms</div>
          <button 
            onClick={() => queryClient.invalidateQueries('forms')}
            className="text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms Management</h1>
            <p className="text-gray-600 mt-1">Create and manage your lead capture forms</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Form
          </button>
        </div>

        {/* Forms Grid */}
        {forms.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {forms.map((form) => (
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
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-6">Create your first form to start capturing leads</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Form
            </button>
          </div>
        )}

        {/* Create Form Modal */}
        <CreateFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateForm}
        />
      </div>
    </Layout>
  )
}
