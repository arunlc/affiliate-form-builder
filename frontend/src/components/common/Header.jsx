// frontend/src/components/common/Header.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, User, Settings } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Affiliate Forms
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-900 hover:text-primary-600">
              Dashboard
            </Link>
            {user?.user_type === 'admin' && (
              <>
                <Link to="/forms" className="text-gray-900 hover:text-primary-600">
                  Forms
                </Link>
                <Link to="/affiliates" className="text-gray-900 hover:text-primary-600">
                  Affiliates
                </Link>
              </>
            )}
            <Link to="/leads" className="text-gray-900 hover:text-primary-600">
              Leads
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.username}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {user?.user_type}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
