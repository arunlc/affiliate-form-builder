import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, BarChart3, Zap, Shield, Globe, Smartphone } from 'lucide-react'

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
)

const StatCard = ({ number, label, suffix = "" }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
      {number}{suffix}
    </div>
    <div className="text-gray-600 text-sm uppercase tracking-wide">{label}</div>
  </div>
)

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      description: "Create and embed beautiful forms in minutes. No coding required, just drag, drop, and deploy."
    },
    {
      icon: Users,
      title: "Affiliate Tracking",
      description: "Automatically track and attribute leads to affiliates with comprehensive performance analytics."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor form performance, conversion rates, and affiliate metrics with stunning dashboards."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with data encryption, GDPR compliance, and secure data handling."
    },
    {
      icon: Globe,
      title: "Universal Embedding",
      description: "Embed forms anywhere - websites, landing pages, or mobile apps with responsive design."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Forms that look and work perfectly on all devices with touch-friendly interfaces."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Affiliate Forms
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
              <Zap className="h-4 w-4 mr-2" />
              Platform Ready for Deployment! 🚀
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Affiliate Form Builder
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SaaS Platform
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create embeddable lead capture forms with powerful affiliate tracking, 
              UTM attribution, and real-time analytics. Scale your lead generation 
              with enterprise-grade tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/login"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                Access Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="/admin"
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Admin Panel
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <StatCard number="99.9" suffix="%" label="Uptime" />
              <StatCard number="< 2" suffix="s" label="Load Time" />
              <StatCard number="256" suffix="-bit" label="Encryption" />
              <StatCard number="24/7" label="Support" />
            </div>
          </div>
        </div>
      </section>

      {/* Test Accounts Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Test Accounts Available</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="text-blue-600 font-semibold mb-2">🔑 Affiliate Account</div>
              <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
                affiliate1 / affiliate123
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="text-green-600 font-semibold mb-2">🔑 Operations Account</div>
              <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
                operations / ops123
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed for modern businesses. From form creation 
              to affiliate management, we've got you covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Affiliate Forms
          </div>
          <p className="text-gray-400 mb-6">
            Built with Django + React | Ready for form building & affiliate tracking
          </p>
          <div className="text-sm text-gray-500">
            © 2025 Affiliate Form Builder. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
