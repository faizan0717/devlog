import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const details = [
        this.state.error?.stack ?? this.state.error?.message,
        this.state.errorInfo?.componentStack,
      ].filter(Boolean).join('\n\n')

      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
          <h1 className="text-headline text-ink-primary">Something broke.</h1>
          <p className="text-body text-ink-secondary max-w-sm">{this.state.error?.message}</p>
          {details && (
            <pre className="max-h-72 w-full max-w-3xl overflow-auto rounded-xl border border-border bg-gray-50 p-4 text-left font-mono text-[11px] text-ink-secondary whitespace-pre-wrap">
              {details}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="text-accent hover:underline text-body"
          >
            Reload the page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
