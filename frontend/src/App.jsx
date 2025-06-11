import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AffiliateDashboard from './pages/AffiliateDashboard'
import OperationsDashboard from './pages/OperationsDashboard'
import FormsPage from './pages/FormsPage'
import LeadsPage from './pages/LeadsPage'
import AffiliatesPage from './pages/AffiliatesPage'
import ProfilePage from './pages/ProfilePage'

// Components
import Loading from './components/common/Loading'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Dashboard Router - Routes users to their appropriate dashboard
const DashboardRouter = () => {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.user_type) {
    case 'admin':
      return <AdminDashboard />
    case 'affiliate':
      return <AffiliateDashboard />
    case 'operations':
      return <OperationsDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <Loading />

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/forms"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FormsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliates"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AffiliatesPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
