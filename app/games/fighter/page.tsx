'use client'

import { useEffect, useRef, useState } from 'react'

export default function FighterPage() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameError, setGameError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameContainerRef.current || typeof window === 'undefined') return

    const initGame = async () => {
      try {
        setIsLoading(true)
        setGameError(null)
        
        // Динамически импортируем игру только на клиенте
        const { initializeFighterGame } = await import('@/games/fighter/FighterGame')
        const container = gameContainerRef.current as HTMLElement
        const game = await initializeFighterGame(container)
        gameInstanceRef.current = game

        // Game loaded successfully
        setTimeout(() => setIsLoading(false), 1000)
        
      } catch (error) {
        console.error('Failed to initialize fighter game:', error)
        setGameError('Failed to load game. Please refresh the page.')
        setIsLoading(false)
      }
    }

    initGame()

    // Cleanup function
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      }
    }
  }, [])

  if (gameError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{gameError}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-game-primary hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Game Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-game-accent border-t-transparent mb-4"></div>
            <div className="font-game text-game-accent text-xl">Loading Fighter Game...</div>
          </div>
        </div>
      )}

      {/* Game Controls Info */}
      <div className="mb-4 text-center">
        <h1 className="font-game text-3xl text-game-accent mb-2">Street Fighter Style</h1>
        <div className="text-gray-400 text-sm space-y-1">
          <div>Player 1: Arrow Keys to move, J/K/L for attacks</div>
          <div>Player 2: WASD to move, U/I/O for attacks</div>
        </div>
      </div>

      {/* Game Container */}
      <div 
        ref={gameContainerRef}
        className="relative border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl"
        style={{ 
          width: '1200px', 
          height: '800px',
          maxWidth: '100vw',
          maxHeight: '85vh'
        }}
      />

      {/* Game Footer */}
      <div className="mt-4 text-center">
        <div className="flex gap-4 justify-center text-sm text-gray-500">
          <span>ESC: Pause Game</span>
          <span>R: Restart Round</span>
          <span>Space: Start Game</span>
        </div>
      </div>
    </div>
  )
}




