// frontend/src/components/auth/ChangePasswordModal.jsx
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Shield
} from 'lucide-react'
import { apiUtils } from '../../services/api'

const PasswordStrengthIndicator = ({ password }) => {
  const validation = apiUtils.validatePassword(password)
  
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'weak': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }
  
  const getStrengthWidth = (strength) => {
    switch (strength) {
      case 'strong': return 'w-full'
      case 'medium': return 'w-2/3'
      case 'weak': return 'w-1/3'
      default: return 'w-0'
    }
  }
  
  if (!password) return null
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password Strength</span>
        <span className={`text-xs font-medium capitalize ${
          validation.strength === 'strong' ? 'text-green-600' :
          validation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {validation.strength}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)} ${getStrengthWidth(validation.strength)}`}></div>
      </div>
      {validation.issues.length > 0 && (
        <div className="mt-2 space-y-1">
          {validation.issues.map((issue, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

const PasswordField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  showStrength = false,
  required = false 
}) => {
  const [showPassword, setShowPassword] = useState(false)
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      {showStrength && <PasswordStrengthIndicator password={value} />}
    </div>
  )
}

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth()
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Client-side validation
    const newErrors = {}
    
    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required'
    }
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required'
    } else {
      const validation = apiUtils.validatePassword(formData.new_password)
      if (!validation.isValid) {
        newErrors.new_password = validation.issues[0]
      }
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password'
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    
    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const result = await changePassword(formData)
      
      if (result.success) {
        setSuccess(true)
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        
        // Auto close after 2 seconds
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 2000)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setErrors({})
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Changed!</h3>
              <p className="text-gray-600">Your password has been updated successfully.</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.general}
              </div>
            )}

            {/* Current Password */}
            <PasswordField
              label="Current Password"
              value={formData.current_password}
              onChange={(value) => setFormData({ ...formData, current_password: value })}
              placeholder="Enter your current password"
              error={errors.current_password}
              required
            />

            {/* New Password */}
            <PasswordField
              label="New Password"
              value={formData.new_password}
              onChange={(value) => setFormData({ ...formData, new_password: value })}
              placeholder="Enter your new password"
              error={errors.new_password}
              showStrength
              required
            />

            {/* Confirm Password */}
            <PasswordField
              label="Confirm New Password"
              value={formData.confirm_password}
              onChange={(value) => setFormData({ ...formData, confirm_password: value })}
              placeholder="Confirm your new password"
              error={errors.confirm_password}
              required
            />

            {/* Security Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Password Security Tips
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use at least 8 characters</li>
                <li>• Include uppercase and lowercase letters</li>
                <li>• Add numbers and special characters</li>
                <li>• Don't reuse passwords from other accounts</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
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
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ChangePasswordModal
