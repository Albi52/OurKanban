import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import BoardPage from './pages/BoardPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster theme="dark" position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/board/:id" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
          <Route path="/verify-email" element={<ProtectedRoute><VerifyEmailPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}