import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@context/AuthContext'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import ProtectedRoute from '@components/account/auth/ProtectedRoute'
import LandingPage from '@pages/LandingPage'
import AuthPage from '@pages/auth/AuthPage'
import HomePage from '@pages/HomePage'
import BoardPage from '@pages/BoardPage'
import VerifyEmailPage from '@pages/auth/VerifyEmailPage'
import TermsPage from '@pages/auth/TermsPage'
import PrivacyPolicyPage from '@pages/auth/PrivacyPolicyPage'
import { AuthGate } from '@components/account/auth/AuthGate'

export default function App() {
  const { theme } = useTheme()
  return (
    <ThemeProvider>
    <AuthProvider>
      <Toaster theme={theme} position="top-right" />
      <BrowserRouter>
      <AuthGate />
        <Routes>
          
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/board/:id" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}