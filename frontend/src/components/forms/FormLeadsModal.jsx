// frontend/src/components/forms/FormLeadsModal.jsx
import React, { useState, useEffect } from 'react'
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MapPin,
  Globe,
  User,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react'

const FormLeadsModal = ({ isOpen, onClose, form }) => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [error, setError] = useState(null)

  // Load leads when modal opens or filters change
  useEffect(() => {
    if (isOpen && form) {
      loadLeads()
    }
  }, [isOpen, form, currentPage, searchTerm, statusFilter, dateFilter])

  const loadLeads = async () => {
    if (!form) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dateFilter !== 'all') params.append('date_range', dateFilter)
      
      // Call the submissions endpoint we already have
      const response = await fetch(`/api/forms/forms/${form.id}/submissions/?${params}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load leads')
      }
      
      const data = await response.json()
      setLeads(data.results || [])
      setTotalCount(data.total_count || 0)
    } catch (err) {
      console.error('Error loading leads:', err)
      setError('Failed to load leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleDateFilter = (value) => {
    setDateFilter(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const exportLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('form', form.id)
      
      const response = await fetch(`/api/leads/export/?${params}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${form.name.replace(/\s+/g, '_')}_leads.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'demo_scheduled': 'bg-purple-100 text-purple-800',
      'demo_completed': 'bg-indigo-100 text-indigo-800',
      'proposal_sent': 'bg-orange-100 text-orange-800',
      'negotiating': 'bg-pink-100 text-pink-800',
      'closed_won': 'bg-emerald-100 text-emerald-800',
      'closed_lost': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'new': 'New',
      'contacted': 'Contacted',
      'qualified': 'Qualified',
      'demo_scheduled': 'Demo Scheduled',
      'demo_completed': 'Demo Completed',
      'proposal_sent': 'Proposal Sent',
      'negotiating': 'Negotiating',
      'closed_won': 'Closed Won',
      'closed_lost': 'Closed Lost'
    }
    return labels[status] || status
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Form Entries</h2>
              <p className="text-gray-600 mt-1">{form?.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportLeads}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {totalCount} total entries
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading entries...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-red-600">
                <p className="mb-4">{error}</p>
                <button
                  onClick={loadLeads}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'This form hasn\'t received any submissions yet'
                }
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{lead.email}</h4>
                            {lead.name && <p className="text-sm text-gray-600">{lead.name}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {lead.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              <span>{lead.phone}</span>
                            </div>
                          )}

                          {lead.form_data?.company && (
                            <div className="flex items-center text-gray-600">
                              <Building className="h-4 w-4 mr-2" />
                              <span>{lead.form_data.company}</span>
                            </div>
                          )}

                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(lead.created_at)}</span>
                          </div>

                          {lead.utm_source && (
                            <div className="flex items-center text-gray-600">
                              <Globe className="h-4 w-4 mr-2" />
                              <span>Source: {lead.utm_source}</span>
                            </div>
                          )}

                          {lead.ip_address && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{lead.ip_address}</span>
                            </div>
                          )}

                          {lead.affiliate_code && (
                            <div className="flex items-center text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <span>Affiliate: {lead.affiliate_code}</span>
                            </div>
                          )}
                        </div>

                        {/* Form Data */}
                        {lead.form_data && Object.keys(lead.form_data).length > 0 && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Form Data:</h5>
                            <div className="text-sm text-gray-600 space-y-1">
                              {Object.entries(lead.form_data).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="font-medium capitalize mr-2">{key.replace('_', ' ')}:</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add Note"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = i + Math.max(1, currentPage - 2)
                        if (page > totalPages) return null
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormLeadsModal
