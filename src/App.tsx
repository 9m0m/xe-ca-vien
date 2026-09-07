import { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingScreen } from './components/common/LoadingScreen'
import { GameShell } from './components/layout/GameShell'
import { PhaserContainer } from './components/game/PhaserContainer'
import { useAppStore } from './store/useAppStore'

export function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const { initSession } = useAppStore()

  useEffect(() => {
    // Initialize server-authoritative guest session
    initSession().finally(() => {
      setIsInitializing(false)
    })
  }, [initSession])

  return (
    <ErrorBoundary>
      <GameShell>
        {isInitializing && <LoadingScreen message="Đang đốt nóng chảo dầu..." />}
        <PhaserContainer />
      </GameShell>
    </ErrorBoundary>
  )
}

export default App
