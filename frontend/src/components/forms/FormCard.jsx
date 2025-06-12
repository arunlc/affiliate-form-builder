// frontend/src/components/forms/FormCard.jsx
import React, { useState } from 'react'
import { 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  ExternalLink, 
  BarChart3, 
  Calendar, 
  Users, 
  CheckCircle,
  FileText
} from 'lucide-react'
import FormFieldsPreview from './FormFieldsPreview'

const FormCard = ({ 
  form, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onViewStats,
  showPreview = true 
}) => {
  const [copying, setCopying] = useState(false)
  const [showFields, setShowFields] = useState(false)
  
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

  const copyEmbedUrl = async () => {
    try {
      await navigator.clipboard.writeText(embedUrl)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const openPreview = () => {
    window.open(embedUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes')
  }

  const getFormTypeColor = (type) => {
    const colors = {
      'lead_capture': 'bg-blue-100 text-blue-800',
      'contact': 'bg-green-100 text-green-800',
      'newsletter': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getFormTypeLabel = (type) => {
    const labels = {
      'lead_capture': 'Lead Capture',
      'contact': 'Contact Form',
      'newsletter': 'Newsletter'
    }
    return labels[type] || type
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {form.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFormTypeColor(form.form_type)}`}>
                  {getFormTypeLabel(form.form_type)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {form.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {form.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(form.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {form.fields?.length || 0} fields
            </span>
            {form.total_submissions && (
              <span className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                {form.total_submissions} submissions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields Preview */}
      {showPreview && form.fields && form.fields.length > 0 && (
        <FormFieldsPreview 
          fields={form.fields}
          expanded={showFields}
          onToggle={() => setShowFields(!showFields)}
        />
      )}

      {/* Embed Code Section */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-blue-700">Embed URL:</p>
          <button
            onClick={copyEmbedUrl}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            title="Copy URL"
          >
            Copy URL
          </button>
        </div>
        <code className="text-xs text-blue-800 break-all block">{embedUrl}</code>
      </div>

      {/* Performance Metrics */}
      {form.stats && (
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {form.stats.total_submissions || 0}
            </div>
            <div className="text-xs text-gray-600">Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {form.stats.conversion_rate || 0}%
            </div>
            <div className="text-xs text-gray-600">Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {form.stats.recent_submissions || 0}
            </div>
            <div className="text-xs text-gray-600">This Month</div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <button
            onClick={openPreview}
            className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
            title="Preview Form"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </button>
          
          <button
            onClick={() => onViewStats && onViewStats(form)}
            className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
            title="View Statistics"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Stats
          </button>

          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
            title="Open in New Tab"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </a>
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

      {/* Tracking Links Section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between">
            <span>Tracking Links</span>
            <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">With Affiliate Tracking:</span>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-gray-800 break-all">
                {embedUrl}?affiliate=AFF001&utm_source=partner&utm_medium=referral
              </code>
            </div>
            <div>
              <span className="font-medium text-gray-600">iframe Embed:</span>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-gray-800 break-all">
                {embedCode}
              </code>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default FormCard
