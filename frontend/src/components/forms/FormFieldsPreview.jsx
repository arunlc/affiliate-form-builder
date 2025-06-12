// frontend/src/components/forms/FormFieldsPreview.jsx
import React from 'react'
import { 
  Type, 
  Mail, 
  Phone, 
  AlignLeft, 
  List, 
  CheckSquare, 
  Circle,
  ChevronDown,
  ChevronUp,
  Asterisk
} from 'lucide-react'

const FormFieldsPreview = ({ fields, expanded = false, onToggle, maxPreview = 3 }) => {
  if (!fields || fields.length === 0) {
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500 text-center">No fields configured</p>
      </div>
    )
  }

  const getFieldIcon = (fieldType) => {
    const icons = {
      'text': Type,
      'email': Mail,
      'phone': Phone,
      'textarea': AlignLeft,
      'select': List,
      'checkbox': CheckSquare,
      'radio': Circle
    }
    return icons[fieldType] || Type
  }

  const getFieldTypeLabel = (fieldType) => {
    const labels = {
      'text': 'Text',
      'email': 'Email',
      'phone': 'Phone',
      'textarea': 'Textarea',
      'select': 'Select',
      'checkbox': 'Checkbox',
      'radio': 'Radio'
    }
    return labels[fieldType] || fieldType
  }

  const getFieldTypeColor = (fieldType) => {
    const colors = {
      'text': 'text-blue-600 bg-blue-50',
      'email': 'text-green-600 bg-green-50',
      'phone': 'text-purple-600 bg-purple-50',
      'textarea': 'text-orange-600 bg-orange-50',
      'select': 'text-indigo-600 bg-indigo-50',
      'checkbox': 'text-pink-600 bg-pink-50',
      'radio': 'text-yellow-600 bg-yellow-50'
    }
    return colors[fieldType] || 'text-gray-600 bg-gray-50'
  }

  const fieldsToShow = expanded ? fields : fields.slice(0, maxPreview)
  const hasMoreFields = fields.length > maxPreview
  const hiddenCount = fields.length - maxPreview

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">Form Fields:</p>
        {hasMoreFields && (
          <button
            onClick={onToggle}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show All ({hiddenCount} more)
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {fieldsToShow.map((field, index) => {
          const Icon = getFieldIcon(field.field_type)
          const colorClasses = getFieldTypeColor(field.field_type)
          
          return (
            <div key={field.id || index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded ${colorClasses}`}>
                  <Icon className="h-3 w-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {field.label}
                    </span>
                    {field.is_required && (
                      <Asterisk className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  {field.placeholder && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {field.placeholder}
                    </p>
                  )}
                  
                  {/* Show options for select/radio fields */}
                  {(field.field_type === 'select' || field.field_type === 'radio') && 
                   field.options && field.options.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">
                        Options: {field.options.filter(opt => opt.trim()).slice(0, 2).join(', ')}
                        {field.options.filter(opt => opt.trim()).length > 2 && 
                          ` (+${field.options.filter(opt => opt.trim()).length - 2} more)`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
                  {getFieldTypeLabel(field.field_type)}
                </span>
                
                {field.is_required && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Required
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>
          {fields.length} field{fields.length !== 1 ? 's' : ''} total
        </span>
        <span>
          {fields.filter(f => f.is_required).length} required
        </span>
      </div>
    </div>
  )
}

export default FormFieldsPreview
