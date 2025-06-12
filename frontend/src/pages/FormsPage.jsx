// frontend/src/pages/FormsPage.jsx - Enhanced with Edit & Real Stats
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
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from 'lucide-react'

const FormCard = ({ form, onEdit, onDuplicate, onDelete, onViewStats }) => {
  const [showStats, setShowStats] = useState(false)
  const [copying, setCopying] = useState(false)
  const [statsData, setStatsData] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  const baseUrl = window.location.origin
  const embedUrl = `${baseUrl}/embed/${form.id}/`
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0"></iframe>`
  
  const copyEmbedCode = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(embedCode)
      setTimeout(() => setCopying(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = embedCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopying(false)
    }
  }

  const openPreview = () => {
    const previewUrl = `${embedUrl}?preview=true&utm_source=preview&affiliate=demo`
    window.open(previewUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes')
  }

  const loadStats = async () => {
    if (showStats && !statsData && !loadingStats) {
      setLoadingStats(true)
      try {
        const response = await formsAPI.getFormStats(form.id)
        setStatsData(response.data)
      } catch (error) {
        console.error('Failed to load stats:', error)
        setStatsData({ error: 'Failed to load stats' })
      } finally {
        setLoadingStats(false)
      }
    }
  }

  const toggleStats = () => {
    setShowStats(!showStats)
    if (!showStats) {
      loadStats()
    }
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
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleStats}
              className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </button>
            
            <button
              onClick={openPreview}
              className="flex items-center px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
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
        
        {/* Embed URL Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Embed URL:</p>
          <code className="text-xs text-gray-700 break-all">{embedUrl}</code>
        </div>
        
        {/* Stats Display */}
        {showStats && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Form Statistics</h4>
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-700">Loading stats...</span>
              </div>
            ) : statsData?.error ? (
              <div className="text-center py-4 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{statsData.error}</p>
              </div>
            ) : statsData ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-700">{statsData.total_submissions || 0}</div>
                  <div className="text-xs text-blue-600">Submissions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-700">{statsData.total_conversions || 0}</div>
                  <div className="text-xs text-green-600">Conversions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-700">{statsData.conversion_rate || 0}%</div>
                  <div className="text-xs text-purple-600">Rate</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-700">0</div>
                  <div className="text-xs text-blue-600">Submissions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-700">0</div>
                  <div className="text-xs text-green-600">Conversions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-700">0%</div>
                  <div className="text-xs text-purple-600">Rate</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Simple Edit Modal
const EditFormModal = ({ isOpen, onClose, form, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    form_type: 'lead_capture',
    is_active: true
  })

  React.useEffect(() => {
    if (form && isOpen) {
      setFormData({
        name: form.name || '',
        description: form.description || '',
        form_type: form.form_type || 'lead_capture',
        is_active: form.is_active !== undefined ? form.is_active : true
      })
    }
  }, [form, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Form</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
            <select
              value={formData.form_type}
              onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="lead_capture">Lead Capture</option>
              <option value="contact">Contact Form</option>
              <option value="newsletter">Newsletter Signup</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Form is active</span>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Rest of your existing components (CreateFormModal, NotificationToast, etc.)
// ... [Keep your existing CreateFormModal and NotificationToast components]

export default function FormsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState(null)
  const [notification, setNotification] = useState(null)
  const queryClient = useQueryClient()

  // Fetch forms
  const { data: formsData, isLoading, error } = useQuery('forms', formsAPI.getForms)
  const forms = formsData?.data?.results || []

  // Update form mutation
  const updateFormMutation = useMutation(
    ({ formId, formData }) => formsAPI.updateForm(formId, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms')
        setIsEditModalOpen(false)
        setEditingForm(null)
        setNotification({
          type: 'success',
          message: 'Form updated successfully!'
        })
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: 'Failed to update form'
        })
      }
    }
  )

  // Other mutations (keep your existing ones)
  // ...

  const handleEditForm = (form) => {
    setEditingForm(form)
    setIsEditModalOpen(true)
  }

  const handleUpdateForm = (formData) => {
    if (editingForm) {
      updateFormMutation.mutate({
        formId: editingForm.id,
        formData
      })
    }
  }

  // Rest of your component logic...
  // Keep your existing handlers and JSX, just add the EditFormModal

  return (
    <Layout>
      {/* Your existing JSX */}
      
      {/* Add the Edit Modal */}
      <EditFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingForm(null)
        }}
        form={editingForm}
        onSubmit={handleUpdateForm}
        loading={updateFormMutation.isLoading}
      />
      
      {/* Keep your existing modals and notifications */}
    </Layout>
  )
}
