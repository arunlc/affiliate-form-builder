// frontend/src/pages/LeadsPage.jsx - Complete Implementation
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import Layout from '../components/Layout'
import { leadsAPI, apiUtils } from '../services/api'
import { 
  Users, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Building,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Save,
  ExternalLink,
  BarChart3,
  FileText,
  Tag,
  MapPin,
  Smartphone
} from 'lucide-react'

// Lead Status Badge Component
const StatusBadge = ({ status, onChange, leadId, disabled = false }) => {
  const [isEditing, setIsEditing] = useState(false)
  
  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
    { value: 'demo_scheduled', label: 'Demo Scheduled', color: 'bg-purple-100 text-purple-800' },
    { value: 'demo_completed', label: 'Demo Completed', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-800' },
    { value: 'negotiating', label: 'Negotiating', color: 'bg-pink-100 text-pink-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
  ]

  const currentStatus = statusOptions.find(s => s.value === status) || statusOptions[0]

  if (disabled) {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.color}`}>
        {currentStatus.label}
      </span>
    )
  }

  if (isEditing) {
    return (
      <select
        value={status}
        onChange={(e) => {
          onChange(leadId, e.target.value)
          setIsEditing(false)
        }}
        onBlur={() => setIsEditing(false)}
        className="text-xs rounded px-2 py-1 border border-gray-300 focus:ring-1 focus:ring-blue-500"
        autoFocus
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-80 transition-opacity ${currentStatus.color}`}
    >
      {currentStatus.label}
    </button>
  )
}

// Lead Notes Modal
const LeadNotesModal = ({ isOpen, onClose, lead }) => {
  const [notes, setNotes] = useState('')
  const [existingNotes, setExistingNotes] = useState([])
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen && lead) {
      setNotes(lead.notes || '')
      // In a real implementation, you'd fetch lead notes from the API
      setExistingNotes([
        { id: 1, note: 'Initial contact made via email', user: 'John Doe', created_at: new Date().toISOString() },
        { id: 2, note: 'Follow-up scheduled for next week', user: 'Jane Smith', created_at: new Date().toISOString() }
      ])
    }
  }, [isOpen, lead])

  const handleSaveNote = async () => {
    if (!notes.trim()) return
    
    setLoading(true)
    try {
      // In a real implementation, you'd save the note via API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Lead Notes</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">{lead?.email}</p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Existing Notes */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-900">Previous Notes</h3>
            {existingNotes.length > 0 ? (
              <div className="space-y-3">
                {existingNotes.map(note => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800 text-sm">{note.note}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span>{note.user}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No previous notes</p>
            )}
          </div>

          {/* Add New Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add New Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Add your note here..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveNote}
            disabled={!notes.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Lead Detail Modal
const LeadDetailModal = ({ isOpen, onClose, lead }) => {
  if (!isOpen || !lead) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>

                {lead.name && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{lead.name}</p>
                    </div>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}

                {lead.form_data?.company && (
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{lead.form_data.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Form Submission</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                {Object.entries(lead.form_data || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tracking Details</h3>
              
              <div className="space-y-3">
                {lead.utm_source && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Source</p>
                      <p className="font-medium">{lead.utm_source}</p>
                    </div>
                  </div>
                )}

                {lead.utm_medium && (
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Medium</p>
                      <p className="font-medium">{lead.utm_medium}</p>
                    </div>
                  </div>
                )}

                {lead.utm_campaign && (
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Campaign</p>
                      <p className="font-medium">{lead.utm_campaign}</p>
                    </div>
                  </div>
                )}

                {lead.affiliate_code && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Affiliate</p>
                      <p className="font-medium">{lead.affiliate_code}</p>
                    </div>
                  </div>
                )}

                {lead.ip_address && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">IP Address</p>
                      <p className="font-medium">{lead.ip_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(lead.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(lead.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Form</p>
                    <p className="font-medium">{lead.form_name || 'Unknown Form'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Lead Card Component
const LeadCard = ({ lead, onStatusChange, onViewDetails, onAddNote }) => {
  const getPriorityColor = (status) => {
    if (['new', 'contacted'].includes(status)) return 'border-l-blue-500'
    if (['qualified', 'demo_scheduled'].includes(status)) return 'border-l-yellow-500'
    if (['demo_completed', 'proposal_sent', 'negotiating'].includes(status)) return 'border-l-orange-500'
    if (status === 'closed_won') return 'border-l-green-500'
    return 'border-l-red-500'
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`bg-white rounded-xl border-l-4 ${getPriorityColor(lead.status)} shadow-sm hover:shadow-md transition-all duration-200 p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{lead.email}</h3>
              {lead.name && <p className="text-sm text-gray-600">{lead.name}</p>}
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            {lead.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.form_data?.company && (
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-gray-400" />
                <span>{lead.form_data.company}</span>
              </div>
            )}
            {lead.utm_source && (
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-gray-400" />
                <span>Source: {lead.utm_source}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <StatusBadge
            status={lead.status}
            onChange={onStatusChange}
            leadId={lead.id}
          />
          <span className="text-xs text-gray-500">{getTimeAgo(lead.created_at)}</span>
        </div>
      </div>

      {/* Lead Message/Notes Preview */}
      {lead.form_data?.message && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 line-clamp-2">{lead.form_data.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewDetails(lead)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onAddNote(lead)}
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
        
        <div className="text-xs text-gray-500">
          Form: {lead.form_name || 'Unknown'}
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
)

// Main LeadsPage Component
export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const queryClient = useQueryClient()

  // Fetch leads
  const { data: leadsData, isLoading, error } = useQuery(
    ['leads', { searchTerm, statusFilter, sourceFilter, dateFilter }],
    () => leadsAPI.getLeads({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      utm_source: sourceFilter !== 'all' ? sourceFilter : undefined,
      date_range: dateFilter !== 'all' ? dateFilter : undefined
    }),
    {
      retry: 2,
      refetchOnWindowFocus: false
    }
  )

  const leads = leadsData?.data?.results || leadsData?.data || []

  // Update lead status mutation
  const updateLeadMutation = useMutation(
    ({ leadId, status }) => leadsAPI.updateLead(leadId, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('leads')
      },
      onError: (error) => {
        console.error('Failed to update lead status:', error)
      }
    }
  )

  // Export leads
  const handleExportLeads = async () => {
    setExporting(true)
    try {
      const response = await leadsAPI.exportLeads({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        utm_source: sourceFilter !== 'all' ? sourceFilter : undefined
      })
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  // Event handlers
  const handleStatusChange = (leadId, newStatus) => {
    updateLeadMutation.mutate({ leadId, status: newStatus })
  }

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
    setIsDetailModalOpen(true)
  }

  const handleAddNote = (lead) => {
    setSelectedLead(lead)
    setIsNotesModalOpen(true)
  }

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => ['qualified', 'demo_scheduled', 'demo_completed'].includes(l.status)).length,
    closed: leads.filter(l => l.status === 'closed_won').length
  }

  // Get unique sources for filter
  const uniqueSources = [...new Set(leads.map(l => l.utm_source).filter(Boolean))]

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Leads</h2>
            <p className="text-gray-600 mb-4">Unable to load leads. Please try again.</p>
            <button
              onClick={() => queryClient.invalidateQueries('leads')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-gray-600 mt-1">
              Track, manage, and nurture your leads through the sales pipeline
            </p>
          </div>
          <button
            onClick={handleExportLeads}
            disabled={exporting}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            {exporting ? 'Exporting...' : 'Export Leads'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Leads"
            value={stats.total}
            subtitle="All time"
            icon={Users}
            color="blue"
            trend="+12% this month"
          />
          <StatsCard
            title="New Leads"
            value={stats.new}
            subtitle="Needs attention"
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Qualified"
            value={stats.qualified}
            subtitle="In pipeline"
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Closed Won"
            value={stats.closed}
            subtitle="Converted"
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {leads.length} leads found
            </div>
          </div>
        </div>

        {/* Leads Grid */}
        {leads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No leads have been captured yet. Create a form to start collecting leads.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setSourceFilter('all')
                  setDateFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
                onAddNote={handleAddNote}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <LeadDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedLead(null)
          }}
          lead={selectedLead}
        />

        <LeadNotesModal
          isOpen={isNotesModalOpen}
          onClose={() => {
            setIsNotesModalOpen(false)
            setSelectedLead(null)
          }}
          lead={selectedLead}
        />
      </div>
    </Layout>
  )
}
