// frontend/src/components/forms/FormSettingsModal.jsx
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { 
  X, 
  Copy, 
  CheckCircle, 
  Link, 
  Code, 
  Settings,
  Mail,
  Globe,
  Tag,
  Zap
} from 'lucide-react'

const FormSettingsModal = ({ isOpen, onClose, form }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('urls')
  const [copying, setCopying] = useState(null)
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
  })

  if (!isOpen || !form) return null

  const baseUrl = window.location.origin
  const isAffiliate = user?.user_type === 'affiliate'
  const isAdmin = user?.user_type === 'admin'

  // Generate URLs
  const getFormUrl = () => {
    let url = `${baseUrl}/embed/${form.id}/`
    const params = new URLSearchParams()
    
    if (isAffiliate && user.affiliate_id) {
      params.append('affiliate', user.affiliate_id)
    }
    
    // Add UTM parameters if they exist
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value.trim()) {
        params.append(key, value.trim())
      }
    })
    
    return params.toString() ? `${url}?${params.toString()}` : url
  }

  const getEmbedCode = () => {
    const formUrl = getFormUrl()
    return `<iframe src="${formUrl}" width="100%" height="600px" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`
  }

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    setCopying(type)
    try {
      await navigator.clipboard.writeText(text)
      setTimeout(() => setCopying(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      setCopying(null)
    }
  }

  // UTM Presets
  const utmPresets = [
    { name: 'Facebook Video Post', source: 'facebook', medium: 'video' },
    { name: 'Facebook Image Post', source: 'facebook', medium: 'image' },
    { name: 'Instagram Story', source: 'instagram', medium: 'story' },
    { name: 'Google Ads', source: 'google', medium: 'cpc' },
    { name: 'Email Newsletter', source: 'email', medium: 'newsletter' },
    { name: 'YouTube Video', source: 'youtube', medium: 'video' },
    { name: 'LinkedIn Post', source: 'linkedin', medium: 'social' },
    { name: 'Twitter Post', source: 'twitter', medium: 'social' }
  ]

  const applyPreset = (preset) => {
    setUtmParams({
      utm_source: preset.source,
      utm_medium: preset.medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content
    })
  }

  const clearUtmParams = () => {
    setUtmParams({
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: ''
    })
  }

  // Tab content components
  const URLsTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-3">
          <Link className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Form URL</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Direct link to your form{isAffiliate ? ' with your affiliate tracking' : ''}
        </p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">URL:</span>
            <button
              onClick={() => copyToClipboard(getFormUrl(), 'url')}
              disabled={copying === 'url'}
              className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {copying === 'url' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copying === 'url' ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
          <code className="text-xs text-gray-800 break-all block p-2 bg-white rounded border">
            {getFormUrl()}
          </code>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <Code className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          HTML code to embed this form on any website
        </p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">iframe Code:</span>
            <button
              onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
              disabled={copying === 'embed'}
              className="flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {copying === 'embed' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copying === 'embed' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <code className="text-xs text-gray-800 break-all block p-2 bg-white rounded border max-h-24 overflow-y-auto">
            {getEmbedCode()}
          </code>
        </div>
      </div>

      {isAffiliate && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Affiliate Tracking Active</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your affiliate code <span className="font-mono bg-blue-100 px-1 rounded">{user.affiliate_id}</span> is automatically included in all URLs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const UTMTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-3">
          <Tag className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">UTM Parameters</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add campaign tracking parameters to measure your marketing performance
        </p>

        {/* UTM Presets */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Quick Presets</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {utmPresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset)}
                className="text-xs p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-gray-600">{preset.source}/{preset.medium}</div>
              </button>
            ))}
          </div>
        </div>

        {/* UTM Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTM Source
            </label>
            <input
              type="text"
              value={utmParams.utm_source}
              onChange={(e) => setUtmParams({ ...utmParams, utm_source: e.target.value })}
              placeholder="facebook, google, email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTM Medium
            </label>
            <input
              type="text"
              value={utmParams.utm_medium}
              onChange={(e) => setUtmParams({ ...utmParams, utm_medium: e.target.value })}
              placeholder="video, image, cpc, email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTM Campaign
            </label>
            <input
              type="text"
              value={utmParams.utm_campaign}
              onChange={(e) => setUtmParams({ ...utmParams, utm_campaign: e.target.value })}
              placeholder="summer2024, leadgen"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTM Term
            </label>
            <input
              type="text"
              value={utmParams.utm_term}
              onChange={(e) => setUtmParams({ ...utmParams, utm_term: e.target.value })}
              placeholder="keywords, audience"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UTM Content
            </label>
            <input
              type="text"
              value={utmParams.utm_content}
              onChange={(e) => setUtmParams({ ...utmParams, utm_content: e.target.value })}
              placeholder="cta-button, sidebar-ad"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearUtmParams}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear All Parameters
          </button>
        </div>

        {/* Custom URL Preview */}
        {(utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-900">Custom Tracking URL</h4>
              <button
                onClick={() => copyToClipboard(getFormUrl(), 'custom')}
                disabled={copying === 'custom'}
                className="flex items-center px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {copying === 'custom' ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copying === 'custom' ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <code className="text-xs text-purple-800 break-all block p-2 bg-white rounded border">
              {getFormUrl()}
            </code>
          </div>
        )}
      </div>
    </div>
  )

  const EmailTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-3">
          <Mail className="h-5 w-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Configure email notifications for form submissions
        </p>
      </div>

      <div className="bg-orange-50 rounded-lg p-6 border border-orange-200 text-center">
        <Mail className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h4 className="font-medium text-orange-900 mb-2">Email Configuration</h4>
        <p className="text-sm text-orange-700 mb-4">
          Email notification settings will be available in the next update. This feature will allow you to:
        </p>
        <ul className="text-sm text-orange-700 text-left max-w-md mx-auto space-y-1">
          <li>• Configure email recipients</li>
          <li>• Edit email templates</li>
          <li>• Set up automated notifications</li>
          <li>• Customize email content</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Form Settings</h2>
              <p className="text-gray-600 mt-1">{form.name}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('urls')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'urls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Link className="h-4 w-4 inline mr-2" />
              URLs & Embedding
            </button>
            
            {isAffiliate && (
              <button
                onClick={() => setActiveTab('utm')}
                className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'utm'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tag className="h-4 w-4 inline mr-2" />
                UTM Parameters
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => setActiveTab('email')}
                className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'email'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-2" />
                Email Notifications
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'urls' && <URLsTab />}
          {activeTab === 'utm' && isAffiliate && <UTMTab />}
          {activeTab === 'email' && isAdmin && <EmailTab />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormSettingsModal
