import React from 'react'

/* Catches render crashes and shows a recovery UI instead of a blank page.
   Wraps dashboard route trees so back/forward navigation never blanks out. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('UI crash caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="card max-w-md text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-bad-soft flex items-center justify-center">
              <svg className="w-7 h-7 text-bad" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z" />
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
            <p className="text-sm text-ink-soft">
              This page failed to render. Your data is safe — reload to continue.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-secondary"
              >
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="btn-primary">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary