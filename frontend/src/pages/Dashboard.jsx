// frontend/src/pages/Dashboard.jsx
import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { coreAPI } from '../services/api'
import Header from '../components/common/Header'
import Loading from '../components/common/Loading'
import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    coreAPI.getDashboard
  )

  if (isLoading) return <Loading />

  const data = dashboardData?.data || {}

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your {user?.user_type} account.
            </p>
          </div>

          {user?.user_type === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Forms"
                value={data.total_forms || 0}
                icon={FileText}
                color="blue"
              />
              <StatCard
                title="Total Leads"
                value={data.total_leads || 0}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Active Affiliates"
                value={data.total_affiliates || 0}
                icon={TrendingUp}
                color="purple"
              />
            </div>
          )}

          {user?.user_type === 'affiliate' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="My Leads"
                value={data.my_leads || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Conversions"
                value={data.conversions || 0}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Conversion Rate"
                value={`${data.conversion_rate?.toFixed(1) || 0}%`}
                icon={TrendingUp}
                color="purple"
              />
            </div>
          )}

          {user?.user_type === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Leads"
                value={data.total_leads || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Pending Leads"
                value={data.pending_leads || 0}
                icon={FileText}
                color="yellow"
              />
              <StatCard
                title="Qualified Leads"
                value={data.qualified_leads || 0}
                icon={TrendingUp}
                color="green"
              />
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
            </div>
            <div className="px-6 py-4">
              {data.recent_leads?.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_leads.map((lead, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium text-gray-900">{lead.email}</p>
                        <p className="text-sm text-gray-500">{lead.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
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
                <p className="text-gray-500 text-center py-8">No recent leads</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
