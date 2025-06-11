// frontend/src/pages/AffiliatesPage.jsx
import React from 'react'
import Layout from '../components/Layout'
import { Users, Plus } from 'lucide-react'

export default function AffiliatesPage() {
  return (
    <Layout>
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Affiliates Management</h1>
        <p className="text-gray-600 mb-8">Manage your affiliate partners</p>
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto">
          <Plus className="h-5 w-5 mr-2" />
          Add New Affiliate
        </button>
      </div>
    </Layout>
  )
}
