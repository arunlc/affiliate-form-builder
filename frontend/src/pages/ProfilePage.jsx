// frontend/src/pages/ProfilePage.jsx
import React from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { User, Edit, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                value={user?.username || ''} 
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <input 
                type="text" 
                value={user?.user_type || ''} 
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
              />
            </div>
            
            {user?.user_type === 'affiliate' && user?.affiliate_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate ID</label>
                <input 
                  type="text" 
                  value={user.affiliate_id} 
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            )}
            
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
