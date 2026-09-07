import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from '@/game/config'

interface PhaserContainerProps {
  onReady?: (game: Phaser.Game) => void
}

export const PhaserContainer: React.FC<PhaserContainerProps> = ({ onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Prevent double instantiation in React StrictMode
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }

    const config = createGameConfig(containerRef.current)
    const game = new Phaser.Game(config)
    gameRef.current = game

    if (onReady) {
      onReady(game)
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [onReady])

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
    />
  )
}
