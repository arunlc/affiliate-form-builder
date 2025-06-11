import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Plus,
  Eye,
  Download,
  BarChart3,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { coreAPI } from '../services/api'
import Layout from '../components/Layout'
import Loading from '../components/common/Loading'

const StatCard = ({ title, value, change, icon: Icon, color = 'blue', trend = 'up' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            <span>{change} from last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
)

const QuickActionCard = ({ title, description, icon: Icon, color, href, external = false }) => (
  <Link
    to={href}
    target={external ? '_blank' : undefined}
    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
  >
    <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className={`h-6 w-6 text-${color}-600`} />
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
)

const RecentActivity = ({ activities = [] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <Activity className="h-5 w-5 text-gray-400" />
    </div>
    
    {activities.length > 0 ? (
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No recent activity</p>
      </div>
    )}
  </div>
)

const RecentLeads = ({ leads = [] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
      <Link 
        to="/leads" 
        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
      >
        View All
        <Eye className="h-4 w-4 ml-1" />
      </Link>
    </div>
    
    {leads.length > 0 ? (
      <div className="space-y-4">
        {leads.map((lead, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{lead.email}</p>
                <p className="text-sm text-gray-500">{lead.name || 'No name'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lead.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No leads yet</p>
        <Link 
          to="/forms" 
          className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2 inline-block"
        >
          Create your first form
        </Link>
      </div>
    )}
  </div>
)

export default function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    coreAPI.getDashboard
  )

  if (isLoading) return <Loading />

  const data = dashboardData?.data || {}

  const quickActions = [
    {
      title: 'Create New Form',
      description: 'Build a new lead capture form',
      icon: Plus,
      color: 'blue',
      href: '/forms'
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      color: 'green',
      href: '/analytics'
    },
    {
      title: 'Manage Affiliates',
      description: 'Add or edit affiliate partners',
      icon: Users,
      color: 'purple',
      href: '/affiliates'
    },
    {
      title: 'Export Leads',
      description: 'Download lead data as Excel',
      icon: Download,
      color: 'orange',
      href: '/leads'
    }
  ]

  const recentActivities = [
    {
      message: 'New form "Contact Us" was created',
      time: '2 hours ago'
    },
    {
      message: 'Affiliate "AFF001" generated 5 new leads',
      time: '4 hours ago'
    },
    {
      message: 'Form "Newsletter Signup" received 12 submissions',
      time: '6 hours ago'
    }
  ]

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your platform.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Forms"
            value={data.total_forms || 0}
            change="+12%"
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Total Leads"
            value={data.total_leads || 0}
            change="+8%"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Active Affiliates"
            value={data.total_affiliates || 0}
            change="+3%"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Conversion Rate"
            value="12.5%"
            change="+2.1%"
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentLeads leads={data.recent_leads} />
          <RecentActivity activities={recentActivities} />
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Chart Component</p>
              <p className="text-sm text-gray-400 mt-1">Analytics visualization will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
