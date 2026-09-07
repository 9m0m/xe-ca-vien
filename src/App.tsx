import { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingScreen } from './components/common/LoadingScreen'
import { GameShell } from './components/layout/GameShell'
import { PhaserContainer } from './components/game/PhaserContainer'
import { useAppStore } from './store/useAppStore'

export function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const { initSession, setIsOnline } = useAppStore()

  useEffect(() => {
    // 1. Initialize server-authoritative guest session
    initSession().finally(() => {
      setIsInitializing(false)
    })

    // 2. Track online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 3. Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {})
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped/failed:', err)
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [initSession, setIsOnline])

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
