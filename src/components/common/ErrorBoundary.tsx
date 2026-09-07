import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Xe Cá Viên:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-street-bg p-4 text-slate-100">
          <div className="surface-board flex max-w-sm flex-col items-center gap-4 p-6 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-950/80 text-red-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Chảo Dầu Gặp Sự Cố!</h2>
              <p className="mt-2 text-sm text-slate-300">
                Đã xảy ra lỗi ngoài ý muốn. Vui lòng nhấn nút bên dưới để khởi động lại xe cá viên.
              </p>
              {this.state.error && (
                <pre className="mt-3 max-h-24 overflow-auto rounded bg-slate-900/90 p-2 text-left text-xs text-red-300">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button onClick={this.handleReset} className="btn-street-red w-full">
              <RotateCcw className="h-4 w-4" />
              Khởi động lại xe
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
