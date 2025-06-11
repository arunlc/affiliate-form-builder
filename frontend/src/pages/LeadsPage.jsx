// frontend/src/pages/LeadsPage.jsx
import React from 'react'
import Layout from '../components/Layout'
import { Users, Download } from 'lucide-react'

export default function LeadsPage() {
  return (
    <Layout>
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leads Management</h1>
        <p className="text-gray-600 mb-8">View and manage all your leads</p>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto">
          <Download className="h-5 w-5 mr-2" />
          Export Leads
        </button>
      </div>
    </Layout>
  )
}
