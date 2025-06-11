import React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ExternalLink,
  Copy,
  Eye,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react'
import { coreAPI } from '../services/api'
import Layout from '../components/Layout'
import Loading from '../components/common/Loading'

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', gradient = false }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${
    gradient 
      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
      : 'bg-white'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium mb-1 ${gradient ? 'text-blue-100' : 'text-gray-500'}`}>
          {title}
        </p>
        <p className={`text-3xl font-bold ${gradient ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-sm mt-2 ${gradient ? 'text-blue-100' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${
        gradient 
          ? 'bg-white/20' 
          : `bg-${color}-100`
      }`}>
        <Icon className={`h-6 w-6 ${
          gradient 
            ? 'text-white' 
            : `text-${color}-600`
        }`} />
      </div>
    </div>
  </div>
)

const TrackingLinkCard = ({ form, affiliateCode }) => {
  const trackingUrl = `https://affiliate-form-builder.onrender.com/embed/${form.id}/?affiliate=${affiliateCode}&utm_source=affiliate&utm_medium=referral`
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingUrl)
    // Could add a toast notification here
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{form.name}</h4>
          <p className="text-sm text-gray-500 mt-1">{form.description || 'No description'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Preview form"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-1">Your tracking link:</p>
        <code className="text-xs text-gray-700 break-all">{trackingUrl}</code>
      </div>
    </div>
  )
}

const RecentLeadsCard = ({ leads = [] }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Conversions</h3>
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
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{lead.email}</p>
                <p className="text-sm text-gray-500">{lead.name || 'No name provided'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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
        <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No conversions yet</p>
        <p className="text-sm text-gray-400 mt-1">Share your tracking links to start earning</p>
      </div>
    )}
  </div>
)

const PerformanceChart = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
      <Activity className="h-5 w-5 text-gray-400" />
    </div>
    <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Performance Chart</p>
        <p className="text-sm text-gray-400 mt-1">Your conversion trends will appear here</p>
      </div>
    </div>
  </div>
)

const AffiliateResources = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">Affiliate Resources</h3>
    
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex items-start space-x-3">
          <Award className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-gray-900">Marketing Guidelines</h4>
            <p className="text-sm text-gray-600 mt-1">
              Best practices for promoting our forms and maximizing conversions.
            </p>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
              View Guidelines →
            </a>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
        <div className="flex items-start space-x-3">
          <Target className="h-6 w-6 text-green-600 mt-1" />
          <div>
            <h4 className="font-medium text-gray-900">Creative Assets</h4>
            <p className="text-sm text-gray-600 mt-1">
              Download banners, images, and promotional materials.
            </p>
            <a href="#" className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
              Download Assets →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function AffiliateDashboard() {
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    coreAPI.getDashboard
  )

  if (isLoading) return <Loading />

  const data = dashboardData?.data || {}
  const sampleForms = [
    { id: '1', name: 'Lead Capture Form', description: 'Main lead generation form' },
    { id: '2', name: 'Newsletter Signup', description: 'Email subscription form' }
  ]

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track your performance and manage your affiliate links.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Your Affiliate Code</p>
              <p className="text-lg font-bold text-blue-600">AFF001</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Leads"
            value={data.my_leads || 0}
            subtitle="This month"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Conversions"
            value={data.conversions || 0}
            subtitle="Qualified leads"
            icon={Target}
            color="green"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${data.conversion_rate?.toFixed(1) || 0}%`}
            subtitle="Performance metric"
            icon={TrendingUp}
            gradient={true}
          />
          <MetricCard
            title="Earnings"
            value="$1,234"
            subtitle="Estimated commission"
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Tracking Links Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Tracking Links</h2>
            <Link 
              to="/forms" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All Forms
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sampleForms.map((form) => (
              <TrackingLinkCard 
                key={form.id} 
                form={form} 
                affiliateCode="AFF001" 
              />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentLeadsCard leads={data.recent_leads} />
          <AffiliateResources />
        </div>

        {/* Performance Chart */}
        <PerformanceChart />
      </div>
    </Layout>
  )
}
