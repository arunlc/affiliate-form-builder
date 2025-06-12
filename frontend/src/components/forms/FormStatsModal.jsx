// frontend/src/components/forms/FormStatsModal.jsx
import React, { useState, useEffect } from 'react'
import { 
  X, 
  TrendingUp, 
  Users, 
  Eye, 
  Calendar, 
  BarChart3, 
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react'

const FormStatsModal = ({ isOpen, onClose, form }) => {
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('30') // days
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && form) {
      loadStats()
    }
  }, [isOpen, form, dateRange])

  const loadStats = async () => {
    if (!form) return
    
    setLoading(true)
    setError(null)
    
    try {
      // In a real implementation, you'd call the API
      // const response = await formsAPI.getFormStats(form.id, { days: dateRange })
      // setStatsData(response.data)
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockStats = {
        form_id: form.id,
        form_name: form.name,
        total_submissions: Math.floor(Math.random() * 1000) + 100,
        total_views: Math.floor(Math.random() * 5000) + 500,
        conversion_rate: (Math.random() * 20 + 5).toFixed(1),
        recent_submissions: Math.floor(Math.random() * 50) + 10,
        bounce_rate: (Math.random() * 30 + 20).toFixed(1),
        avg_completion_time: Math.floor(Math.random() * 180 + 60), // seconds
        created_at: form.created_at,
        is_active: form.is_active,
        embed_url: `${window.location.origin}/embed/${form.id}/`,
        
        // Time-based stats
        daily_data: Array.from({ length: parseInt(dateRange) }, (_, i) => ({
          date: new Date(Date.now() - (parseInt(dateRange) - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 100) + 10,
          submissions: Math.floor(Math.random() * 20) + 1
        })),
        
        // Source breakdown
        traffic_sources: [
          { source: 'Direct', count: Math.floor(Math.random() * 50) + 20, percentage: 35 },
          { source: 'Google', count: Math.floor(Math.random() * 40) + 15, percentage: 28 },
          { source: 'Facebook', count: Math.floor(Math.random() * 30) + 10, percentage: 22 },
          { source: 'Referral', count: Math.floor(Math.random() * 20) + 5, percentage: 15 }
        ],
        
        // Device breakdown
        device_stats: [
          { device: 'Desktop', count: Math.floor(Math.random() * 60) + 30, percentage: 52 },
          { device: 'Mobile', count: Math.floor(Math.random() * 40) + 20, percentage: 35 },
          { device: 'Tablet', count: Math.floor(Math.random() * 20) + 5, percentage: 13 }
        ],
        
        // Form field analytics
        field_analytics: form.fields?.map(field => ({
          field_name: field.label,
          completion_rate: (Math.random() * 20 + 80).toFixed(1),
          avg_time: Math.floor(Math.random() * 30) + 5
        })) || [],
        
        // Recent activity
        recent_activity: [
          { action: 'Form submitted', details: 'john@example.com', time: '2 hours ago' },
          { action: 'Form viewed', details: '5 unique visitors', time: '4 hours ago' },
          { action: 'High conversion hour', details: '8 submissions in 1 hour', time: '6 hours ago' }
        ]
      }
      
      setStatsData(mockStats)
    } catch (err) {
      setError('Failed to load statistics. Please try again.')
      console.error('Stats loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportStats = () => {
    if (!statsData) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Submissions', statsData.total_submissions],
      ['Total Views', statsData.total_views],
      ['Conversion Rate', `${statsData.conversion_rate}%`],
      ['Bounce Rate', `${statsData.bounce_rate}%`],
      ['Average Completion Time', `${statsData.avg_completion_time}s`]
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form.name.replace(/\s+/g, '_')}_stats.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Form Analytics</h2>
              <p className="text-gray-600 mt-1">{form?.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button
                onClick={loadStats}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadStats}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : statsData ? (
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{statsData.total_submissions}</div>
                  <div className="text-sm text-blue-600 flex items-center justify-center mt-1">
                    <Users className="h-4 w-4 mr-1" />
                    Total Submissions
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{statsData.total_views}</div>
                  <div className="text-sm text-green-600 flex items-center justify-center mt-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Total Views
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">{statsData.conversion_rate}%</div>
                  <div className="text-sm text-purple-600 flex items-center justify-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Conversion Rate
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{statsData.avg_completion_time}s</div>
                  <div className="text-sm text-orange-600 flex items-center justify-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Avg. Completion
                  </div>
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-100">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Chart Visualization</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Daily views and submissions for the last {dateRange} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Traffic Sources & Device Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Traffic Sources
                  </h3>
                  <div className="space-y-3">
                    {statsData.traffic_sources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" style={{
                            backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index]
                          }}></div>
                          <span className="text-sm font-medium text-gray-900">{source.source}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">{source.count}</div>
                          <div className="text-xs text-gray-500">{source.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Device Breakdown
                  </h3>
                  <div className="space-y-3">
                    {statsData.device_stats.map((device, index) => {
                      const icons = [Monitor, Smartphone, Smartphone]
                      const Icon = icons[index]
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-900">{device.device}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{device.count}</div>
                            <div className="text-xs text-gray-500">{device.percentage}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Field Analytics */}
              {statsData.field_analytics.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Field Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Completion Rate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Avg. Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.field_analytics.map((field, index) => (
                          <tr key={index} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-3 px-4 text-gray-900">{field.field_name}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${field.completion_rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-900">{field.completion_rate}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900">{field.avg_time}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {statsData.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Section */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={exportStats}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Statistics
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No analytics data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormStatsModal
