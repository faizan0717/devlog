import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
          <h1 className="text-headline text-ink-primary">Something broke.</h1>
          <p className="text-body text-ink-secondary max-w-sm">{this.state.error?.message}</p>
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
