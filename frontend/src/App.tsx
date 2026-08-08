import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@context/AuthContext'

import { ThemeProvider} from '@/context/ThemeContext'
import ProtectedRoute from '@components/account/auth/ProtectedRoute'
import LandingPage from '@pages/LandingPage'
import AuthPage from '@pages/auth/AuthPage'
import HomePage from '@pages/HomePage'
import BoardPage from '@pages/BoardPage'
import VerifyEmailPage from '@pages/auth/VerifyEmailPage'
import TermsPage from '@pages/auth/TermsPage'
import PrivacyPolicyPage from '@pages/auth/PrivacyPolicyPage'
import ErrorPage from '@pages/ErrorPage'
import { AuthGate } from '@components/account/auth/AuthGate'
import { AppErrorBoundary } from '@components/shared/ErrorBoundary'

export default function App() {


  return (
    <ThemeProvider>
    <AuthProvider>
      <Toaster theme="dark" position="top-right" />
      <BrowserRouter>
      <AuthGate />
      <AppErrorBoundary>
        <Routes>

          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/board/:id" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="*"
            element={
              <ErrorPage
                statusCode={404}
                title="Page not found"
                message="The page you're looking for doesn't exist, or it's moved somewhere else."
              />
            }
          />
        </Routes>
      </AppErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}