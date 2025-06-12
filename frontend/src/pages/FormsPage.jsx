// frontend/src/pages/FormsPage.jsx - Debug version to identify the issue
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { formsAPI } from '../services/api'
import { 
  FileText, 
  Plus, 
  Eye, 
  Copy, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Users
} from 'lucide-react'

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Debug the API call
  const { data: formsData, isLoading, error } = useQuery(
    'forms', 
    formsAPI.getForms,
    {
      retry: 1,
      onSuccess: (data) => {
        console.log('✅ Forms API Success:', data)
      },
      onError: (error) => {
        console.error('❌ Forms API Error:', error)
      }
    }
  )

  // Debug: Log all the data
  console.log('🔍 Forms Debug Info:')
  console.log('- isLoading:', isLoading)
  console.log('- error:', error)
  console.log('- formsData:', formsData)
  console.log('- formsData?.data:', formsData?.data)
  console.log('- formsData?.data?.results:', formsData?.data?.results)

  // Extract forms from different possible response structures
  let forms = []
  if (formsData?.data?.results) {
    forms = formsData.data.results
  } else if (formsData?.data && Array.isArray(formsData.data)) {
    forms = formsData.data
  } else if (Array.isArray(formsData)) {
    forms = formsData
  }

  console.log('- Final forms array:', forms)
  console.log('- Forms count:', forms.length)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your embeddable lead capture forms
            </p>
          </div>
          <button
            onClick={() => alert('Create form functionality will be added soon!')}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Form
          </button>
        </div>

        {/* Debug Panel - Remove this after debugging */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Information</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {error ? error.message : 'None'}</div>
            <div>Raw Data: {JSON.stringify(formsData)}</div>
            <div>Forms Count: {forms.length}</div>
            <div>API URL: {window.location.origin}/api/forms/forms/</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading forms...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Forms</h3>
                <p className="text-red-700 mt-1">
                  {error.message || 'Unable to load forms. Please try again.'}
                </p>
                <button
                  onClick={() => queryClient.invalidateQueries('forms')}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State - No Forms */}
        {!isLoading && !error && forms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              You don't have any forms yet. Create your first lead capture form to start collecting leads.
            </p>
            <button
              onClick={() => alert('Create form functionality will be added soon!')}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Form
            </button>
          </div>
        )}

        {/* Success State - With Forms */}
        {!isLoading && !error && forms.length > 0 && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {forms.map((form) => (
                <div key={form.id || form.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {form.name || 'Untitled Form'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {form.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {form.fields?.length || 0} fields
                        </span>
                      </div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Embed URL */}
                  {form.id && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Embed URL:</p>
                      <code className="text-xs text-gray-700 break-all">
                        {window.location.origin}/embed/{form.id}/
                      </code>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      {form.id && (
                        <button
                          onClick={() => window.open(`${window.location.origin}/embed/${form.id}/`, '_blank')}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const embedCode = `<iframe src="${window.location.origin}/embed/${form.id}/" width="100%" height="600px" frameborder="0"></iframe>`
                          navigator.clipboard.writeText(embedCode)
                          alert('Embed code copied!')
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy Embed Code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      ID: {form.id || 'No ID'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
