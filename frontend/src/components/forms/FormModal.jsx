// frontend/src/components/forms/FormModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

const FormModal = ({ isOpen, onClose, form, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    form_type: 'lead_capture',
    is_active: true,
    fields: []
  })

  const [errors, setErrors] = useState({})

  // Field types available
  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Button' }
  ]

  const formTypes = [
    { value: 'lead_capture', label: 'Lead Capture' },
    { value: 'contact', label: 'Contact Form' },
    { value: 'newsletter', label: 'Newsletter Signup' }
  ]

  useEffect(() => {
    if (isOpen) {
      if (form) {
        // Edit mode
        setFormData({
          name: form.name || '',
          description: form.description || '',
          form_type: form.form_type || 'lead_capture',
          is_active: form.is_active !== undefined ? form.is_active : true,
          fields: form.fields || []
        })
      } else {
        // Create mode with default fields
        setFormData({
          name: '',
          description: '',
          form_type: 'lead_capture',
          is_active: true,
          fields: [
            {
              id: Date.now() + 1,
              field_type: 'text',
              label: 'Full Name',
              placeholder: 'Enter your full name',
              is_required: true,
              order: 1,
              options: []
            },
            {
              id: Date.now() + 2,
              field_type: 'email',
              label: 'Email Address',
              placeholder: 'Enter your email address',
              is_required: true,
              order: 2,
              options: []
            }
          ]
        })
      }
      setErrors({})
    }
  }, [isOpen, form])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Form name is required'
    }
    
    if (formData.fields.length === 0) {
      newErrors.fields = 'At least one field is required'
    }

    // Validate each field
    formData.fields.forEach((field, index) => {
      if (!field.label.trim()) {
        newErrors[`field_${index}_label`] = 'Field label is required'
      }
      if (field.field_type === 'select' || field.field_type === 'radio') {
        if (!field.options || field.options.length === 0) {
          newErrors[`field_${index}_options`] = 'Options are required for this field type'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const addField = () => {
    const newField = {
      id: Date.now(),
      field_type: 'text',
      label: '',
      placeholder: '',
      is_required: false,
      order: formData.fields.length + 1,
      options: []
    }
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    })
  }

  const updateField = (index, updates) => {
    const updatedFields = formData.fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    )
    setFormData({ ...formData, fields: updatedFields })
  }

  const removeField = (index) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index)
    setFormData({ ...formData, fields: updatedFields })
  }

  const moveField = (index, direction) => {
    const newFields = [...formData.fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
      // Update order numbers
      newFields.forEach((field, i) => {
        field.order = i + 1
      })
      setFormData({ ...formData, fields: newFields })
    }
  }

  const addOption = (fieldIndex) => {
    const updatedFields = formData.fields.map((field, i) => 
      i === fieldIndex 
        ? { ...field, options: [...(field.options || []), ''] }
        : field
    )
    setFormData({ ...formData, fields: updatedFields })
  }

  const updateOption = (fieldIndex, optionIndex, value) => {
    const updatedFields = formData.fields.map((field, i) => 
      i === fieldIndex 
        ? { 
            ...field, 
            options: field.options.map((opt, oi) => oi === optionIndex ? value : opt)
          }
        : field
    )
    setFormData({ ...formData, fields: updatedFields })
  }

  const removeOption = (fieldIndex, optionIndex) => {
    const updatedFields = formData.fields.map((field, i) => 
      i === fieldIndex 
        ? { ...field, options: field.options.filter((_, oi) => oi !== optionIndex) }
        : field
    )
    setFormData({ ...formData, fields: updatedFields })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {form ? 'Edit Form' : 'Create New Form'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-100px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Form Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter form name"
                  disabled={loading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Type
                </label>
                <select
                  value={formData.form_type}
                  onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  {formTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description of this form"
                disabled={loading}
              />
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
                <span className="text-sm font-medium text-gray-700">Form is active</span>
              </label>
            </div>

            {/* Form Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
                <button
                  type="button"
                  onClick={addField}
                  disabled={loading}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </button>
              </div>

              {errors.fields && <p className="text-red-500 text-sm mb-4">{errors.fields}</p>}

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0 || loading}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === formData.fields.length - 1 || loading}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          disabled={loading}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Field Type
                        </label>
                        <select
                          value={field.field_type}
                          onChange={(e) => updateField(index, { 
                            field_type: e.target.value,
                            options: ['select', 'radio'].includes(e.target.value) ? [''] : []
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Label *
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 ${
                            errors[`field_${index}_label`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Field label"
                          disabled={loading}
                        />
                        {errors[`field_${index}_label`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`field_${index}_label`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Placeholder text"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateField(index, { is_required: e.target.checked })}
                          className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading}
                        />
                        <span className="text-xs text-gray-700">Required field</span>
                      </label>
                    </div>

                    {/* Options for select/radio fields */}
                    {(field.field_type === 'select' || field.field_type === 'radio') && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-700">
                            Options
                          </label>
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            disabled={loading}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </div>
                        {errors[`field_${index}_options`] && (
                          <p className="text-red-500 text-xs mb-2">{errors[`field_${index}_options`]}</p>
                        )}
                        <div className="space-y-1">
                          {(field.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                placeholder={`Option ${optionIndex + 1}`}
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                disabled={loading}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
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
              {loading ? 'Saving...' : (form ? 'Update Form' : 'Create Form')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormModal
