import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import QRDisplayPage from './pages/QRDisplayPage'
import CheckInPage from './pages/CheckInPage'
import AttendancePage from './pages/AttendancePage'
import LeavesPage from './pages/LeavesPage'
import DisciplinaryPage from './pages/DisciplinaryPage'
import SettingsPage from './pages/SettingsPage'
import MyAttendancePage from './pages/MyAttendancePage'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-950">
    <div className="text-accent-lime font-mono">Chargement...</div>
  </div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c26',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'Space Grotesk, sans-serif',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/check-in" element={<CheckInPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/qr-display" element={
              <ProtectedRoute roles={['admin', 'manager']}><QRDisplayPage /></ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute roles={['admin', 'manager']}><EmployeesPage /></ProtectedRoute>
            } />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/my-attendance" element={<MyAttendancePage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/disciplinary" element={<DisciplinaryPage />} />
            <Route path="/settings" element={
              <ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
