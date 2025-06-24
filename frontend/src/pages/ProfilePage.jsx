// frontend/src/pages/ProfilePage.jsx - Enhanced with Password Management
import React, { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import { 
  User, 
  Edit, 
  Save, 
  Shield, 
  Mail, 
  Calendar, 
  Tag, 
  Building,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  })
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        setIsEditing(false)
        setNotification({
          type: 'success',
          message: 'Profile updated successfully!'
        })
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update profile'
        })
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  // Auto-hide notifications
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'affiliate':
        return 'bg-blue-100 text-blue-800'
      case 'operations':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'admin':
        return '👑'
      case 'affiliate':
        return '🤝'
      case 'operations':
        return '⚙️'
      default:
        return '👤'
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security settings</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`rounded-lg p-4 flex items-center space-x-3 ${
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
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">{user?.username}</h2>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-xl">{getUserTypeIcon(user?.user_type)}</span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getUserTypeColor(user?.user_type)} capitalize`}>
                  {user?.user_type}
                </span>
              </div>

              {user?.email && (
                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}

              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {new Date(user?.date_joined).toLocaleDateString()}</span>
              </div>

              {/* Affiliate-specific info */}
              {user?.user_type === 'affiliate' && user?.affiliate_id && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center text-blue-700 text-sm">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>Affiliate Code: <strong>{user.affiliate_id}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                </div>
                
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input 
                    type="text" 
                    value={isEditing ? formData.username : user?.username || ''} 
                    onChange={(e) => isEditing && setFormData({...formData, username: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Your unique username for login</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={isEditing ? formData.email : user?.email || ''} 
                    onChange={(e) => isEditing && setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all ${
                      isEditing 
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for notifications and password recovery</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="text" 
                      value={user?.user_type || ''} 
                      disabled
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 capitalize"
                    />
                    <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-lg ${getUserTypeColor(user?.user_type)}`}>
                      {getUserTypeIcon(user?.user_type)} {user?.user_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Account type cannot be changed</p>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              </div>

              <div className="space-y-4">
                {/* Change Password */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Password</h4>
                      <p className="text-sm text-gray-600">Change your account password</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>

                {/* Security Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Recommendations
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Change your password regularly</li>
                    <li>• Use a strong, unique password</li>
                    <li>• Don't share your login credentials</li>
                    <li>• Log out from shared devices</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Account Stats (for affiliates) */}
            {user?.user_type === 'affiliate' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Building className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Affiliate Overview</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-600">Total Leads</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0%</div>
                    <div className="text-sm text-green-600">Conversion Rate</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Want to see detailed analytics? Visit your <strong>Dashboard</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </div>
    </Layout>
  )
}
