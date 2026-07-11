import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('アプリエラー:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pixel-bg-world min-h-screen flex items-center justify-center p-4">
          <div className="pixel-window max-w-md w-full p-6 text-center space-y-4">
            <h2 className="pixel-title text-lg">エラーが発生しました</h2>
            <p className="text-red-400 text-sm">{this.state.message}</p>
            <button
              type="button"
              className="pixel-btn pixel-btn-gold"
              onClick={() => {
                sessionStorage.clear()
                window.location.href = import.meta.env.BASE_URL
              }}
            >
              ログイン画面に戻る
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
