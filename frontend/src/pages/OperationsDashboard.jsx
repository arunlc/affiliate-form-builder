import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Calendar,
  Activity,
  Target
} from 'lucide-react'
import { coreAPI } from '../services/api'
import Layout from '../components/Layout'
import Loading from '../components/common/Loading'

const StatusCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <span>{trend} from yesterday</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
)

const LeadCard = ({ lead, onStatusChange }) => {
  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'demo_scheduled': 'bg-purple-100 text-purple-800',
      'closed_won': 'bg-emerald-100 text-emerald-800',
      'closed_lost': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{lead.email}</h4>
              <p className="text-sm text-gray-500">{lead.name || 'No name provided'}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            {lead.phone && (
              <p>📞 {lead.phone}</p>
            )}
            {lead.company && (
              <p>🏢 {lead.company}</p>
            )}
            {lead.utm_source && (
              <p>📊 Source: {lead.utm_source}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
            {lead.status.replace('_', ' ')}
          </span>
          <p className="text-xs text-gray-500">
            {new Date(lead.created_at).toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-1">
            <button 
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button 
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Edit lead"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {lead.notes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{lead.notes}</p>
        </div>
      )}
    </div>
  )
}

const QuickActions = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-4">
      <Link
        to="/leads?status=new"
        className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
      >
        <div className="text-center">
          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-900">New Leads</p>
        </div>
      </Link>
      
      <Link
        to="/leads?export=true"
        className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
      >
        <div className="text-center">
          <Download className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900">Export Data</p>
        </div>
      </Link>
      
      <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
        <div className="text-center">
          <Filter className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-purple-900">Filter Leads</p>
        </div>
      </button>
      
      <button className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200">
        <div className="text-center">
          <Target className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-orange-900">Bulk Actions</p>
        </div>
      </button>
    </div>
  </div>
)

const RecentActivity = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <Activity className="h-5 w-5 text-gray-400" />
    </div>
    
    <div className="space-y-4">
      {[
        { action: 'Lead status updated to "Qualified"', lead: 'john.doe@example.com', time: '2 hours ago' },
        { action: 'Note added to lead', lead: 'jane.smith@example.com', time: '4 hours ago' },
        { action: 'Demo scheduled', lead: 'mike.wilson@example.com', time: '6 hours ago' },
        { action: 'Lead marked as "Closed Won"', lead: 'sarah.jones@example.com', time: '1 day ago' }
      ].map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.action}</p>
            <p className="text-xs text-gray-600 mt-1">
              {activity.lead} • {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function OperationsDashboard() {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    coreAPI.getDashboard
  )

  if (isLoading) return <Loading />

  const data = dashboardData?.data || {}

  const sampleLeads = [
    {
      id: 1,
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      company: 'Tech Startup Inc',
      status: 'new',
      utm_source: 'google',
      created_at: new Date().toISOString(),
      notes: 'Interested in enterprise plan. Follow up needed.'
    },
    {
      id: 2,
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      company: 'Marketing Agency',
      status: 'qualified',
      utm_source: 'facebook',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage leads, update statuses, and track conversion pipeline.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            title="Total Leads"
            value={data.total_leads || 147}
            subtitle="All time"
            icon={Users}
            color="blue"
            trend="+12 new"
          />
          <StatusCard
            title="Pending Review"
            value={data.pending_leads || 23}
            subtitle="Needs attention"
            icon={Clock}
            color="yellow"
          />
          <StatusCard
            title="Qualified"
            value={data.qualified_leads || 45}
            subtitle="Ready for sales"
            icon={CheckCircle}
            color="green"
          />
          <StatusCard
            title="Conversion Rate"
            value="18.5%"
            subtitle="This month"
            icon={Target}
            color="purple"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search leads by email, name, or company..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="demo_scheduled">Demo Scheduled</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leads List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
              <Link 
                to="/leads" 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
              >
                View All
                <Eye className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {sampleLeads.length > 0 ? (
                sampleLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No leads to review</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </div>
    </Layout>
  )
}
