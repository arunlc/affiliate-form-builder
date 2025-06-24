// frontend/src/hooks/useAuth.js - Enhanced with Password Management
import React, { useState, useEffect, createContext, useContext } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getProfile()
        .then(response => {
          setUser(response.data)
        })
        .catch((error) => {
          console.error('Failed to get user profile:', error)
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { user, token } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.non_field_errors?.[0] || 
               error.response?.data?.message || 
               error.response?.data?.error ||
               'Login failed. Please check your credentials.' 
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData)
      
      // Update token if a new one is provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      
      return { 
        success: true, 
        message: response.data.message || 'Password changed successfully'
      }
    } catch (error) {
      console.error('Change password error:', error)
      
      // Handle field-specific errors
      const errors = error.response?.data
      if (errors) {
        if (errors.current_password) {
          return { success: false, error: errors.current_password[0] }
        }
        if (errors.new_password) {
          return { success: false, error: errors.new_password[0] }
        }
        if (errors.confirm_password) {
          return { success: false, error: errors.confirm_password[0] }
        }
        if (errors.non_field_errors) {
          return { success: false, error: errors.non_field_errors[0] }
        }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      }
    }
  }

  const requestPasswordReset = async (email) => {
    try {
      const response = await authAPI.requestPasswordReset({ email })
      return { 
        success: true, 
        message: response.data.message || 'Password reset email sent'
      }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send password reset email' 
      }
    }
  }

  const confirmPasswordReset = async (token, passwordData) => {
    try {
      const response = await authAPI.confirmPasswordReset(token, passwordData)
      return { 
        success: true, 
        message: response.data.message || 'Password reset successfully'
      }
    } catch (error) {
      console.error('Password reset confirm error:', error)
      
      // Handle field-specific errors
      const errors = error.response?.data
      if (errors) {
        if (errors.new_password) {
          return { success: false, error: errors.new_password[0] }
        }
        if (errors.confirm_password) {
          return { success: false, error: errors.confirm_password[0] }
        }
        if (errors.non_field_errors) {
          return { success: false, error: errors.non_field_errors[0] }
        }
        if (errors.error) {
          return { success: false, error: errors.error }
        }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to reset password' 
      }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.data)
      return { 
        success: true, 
        user: response.data,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      }
    }
  }

  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data)
      return { success: true, user: response.data }
    } catch (error) {
      console.error('Refresh profile error:', error)
      return { success: false, error: 'Failed to refresh profile' }
    }
  }

  // Admin-only function to set password for other users
  const setUserPassword = async (passwordData) => {
    try {
      const response = await authAPI.setUserPassword(passwordData)
      return { 
        success: true, 
        message: response.data.message || 'Password set successfully'
      }
    } catch (error) {
      console.error('Set user password error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to set password' 
      }
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    updateProfile,
    refreshProfile,
    setUserPassword, // Admin only
  }

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  )
}
