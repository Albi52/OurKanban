import React from 'react'
import { useLocation } from 'react-router-dom'
import ErrorPage from '@pages/ErrorPage'   

interface State {
  error: Error | null
}

class ErrorBoundaryInner extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPage
          statusCode={500}
          title="Something went wrong"
          message="An unexpected error interrupted this page. It's not you — it's us."
          detail={this.state.error.stack ?? this.state.error.message}
        />
      )
    }
    return this.props.children
  }
}

// Class error boundaries don't clear their caught-error state on their own —
// once tripped, they'd keep rendering ErrorPage forever, even after the user
// clicks "Back to home" and client-side navigates away. Keying on the pathname
// forces a remount (and therefore a state reset) whenever the route changes.
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return <ErrorBoundaryInner key={location.pathname}>{children}</ErrorBoundaryInner>
}