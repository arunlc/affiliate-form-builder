// frontend/src/components/forms/FormsTable.jsx
import React, { useState } from 'react'
import { 
  Edit, 
  MoreVertical, 
  Eye, 
  Copy, 
  Trash2, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react'

const FormsTable = ({ 
  forms, 
  loading = false,
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewStats,
  onViewEntries,
  onToggleStatus,
  onFormSettings,
  sortBy,
  sortOrder,
  onSort
}) => {
  const [openDropdown, setOpenDropdown] = useState(null)

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const handleSort = (column) => {
    if (onSort) {
      const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
      onSort(column, newOrder)
    }
  }

  const SortableHeader = ({ column, children, className = "" }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
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

  const ActionDropdown = ({ form, isOpen, onToggle }) => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setOpenDropdown(null)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onViewStats(form)
                setOpenDropdown(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              View Stats
            </button>
            <button
              onClick={() => {
                onViewEntries(form)
                setOpenDropdown(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-3" />
              All Entries
            </button>
            
            {/* NEW: Form Settings Option */}
            <button
              onClick={() => {
                onFormSettings(form)
                setOpenDropdown(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4 mr-3" />
              Form Settings
            </button>
            
            <button
              onClick={() => {
                onDuplicate(form)
                setOpenDropdown(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy className="h-4 w-4 mr-3" />
              Duplicate
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => {
                onDelete(form)
                setOpenDropdown(null)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-50 px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader column="name">Form Name</SortableHeader>
              <SortableHeader column="created_at">Created</SortableHeader>
              <SortableHeader column="total_submissions">Submissions</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New
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
            {forms.map((form) => (
              <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                {/* Form Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {form.name}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFormTypeColor(form.form_type)}`}>
                        {getFormTypeLabel(form.form_type)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Created Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(form.created_at)}
                </td>

                {/* Total Submissions */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {form.total_submissions || 0}
                </td>

                {/* New Leads */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {form.new_leads_count > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {form.new_leads_count}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* Status Toggle */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={() => onToggleStatus && onToggleStatus(form)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.is_active ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(form)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <ActionDropdown
                      form={form}
                      isOpen={openDropdown === form.id}
                      onToggle={() => setOpenDropdown(openDropdown === form.id ? null : form.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FormsTable
