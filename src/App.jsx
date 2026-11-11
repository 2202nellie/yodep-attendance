import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClockPage from './pages/ClockPage'
import LeavePage from './pages/LeavePage'
import ReportsPage from './pages/ReportsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminLeavesPage from './pages/AdminLeavesPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import Layout from './components/layout/Layout'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="clock" element={<ClockPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="admin/leaves" element={<AdminRoute><AdminLeavesPage /></AdminRoute>} />
        <Route path="admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="admin/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
