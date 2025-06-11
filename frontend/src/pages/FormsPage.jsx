// frontend/src/pages/FormsPage.jsx
import React from 'react'
import Layout from '../components/Layout'
import { FileText, Plus } from 'lucide-react'

export default function FormsPage() {
  return (
    <Layout>
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forms Management</h1>
        <p className="text-gray-600 mb-8">Create and manage your lead capture forms</p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto">
          <Plus className="h-5 w-5 mr-2" />
          Create New Form
        </button>
      </div>
    </Layout>
  )
}
