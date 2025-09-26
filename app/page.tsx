'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1 
          className="font-game text-6xl md:text-8xl font-bold text-game-accent mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          GamesCat
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Play amazing browser games - from fighting to strategy and beyond
        </motion.p>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <GameCard 
            title="Fighting Arena"
            description="Master combos and special moves in epic 2D battles"
            href="/games/fighter"
            status="Available"
            gradient="from-game-primary to-red-600"
          />
          
          <GameCard 
            title="Tower Defense"
            description="Build towers, defend your base, survive endless waves"
            href="/games/tower-defense"
            status="Available"
            gradient="from-game-secondary to-blue-600"
          />

          <GameCard 
            title="Puzzle Quest"
            description="Mind-bending puzzles and brain teasers await"
            href="/games/puzzle"
            status="Coming Soon"
            gradient="from-purple-600 to-pink-600"
          />

          <GameCard 
            title="Space Shooter"
            description="Blast through asteroids and alien fleets"
            href="/games/shooter"
            status="Coming Soon"
            gradient="from-cyan-600 to-blue-800"
          />

          <GameCard 
            title="Racing Circuit"
            description="High-speed racing with customizable vehicles"
            href="/games/racing"
            status="Coming Soon"
            gradient="from-orange-600 to-yellow-600"
          />

          <GameCard 
            title="RPG Adventure"
            description="Epic quests, character progression, and exploration"
            href="/games/rpg"
            status="Coming Soon"
            gradient="from-green-600 to-emerald-800"
          />
        </motion.div>
        
        <motion.div 
          className="mt-16 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          A diverse gaming platform built with Next.js, Phaser.js, and TypeScript
        </motion.div>
      </div>
    </div>
  )
}

interface GameCardProps {
  title: string
  description: string
  href: string
  status: string
  gradient: string
}

function GameCard({ title, description, href, status, gradient }: GameCardProps) {
  const isAvailable = status === 'Available'
  
  const content = (
    <div 
      className={`
        relative p-6 rounded-xl bg-gradient-to-br ${gradient}
        ${isAvailable ? 'hover:scale-105 cursor-pointer' : 'opacity-75 cursor-not-allowed'}
        transition-all duration-300 shadow-lg hover:shadow-xl
        border border-gray-700 hover:border-gray-600
      `}
    >
      <div className="absolute top-2 right-2">
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${isAvailable 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }
        `}>
          {status}
        </span>
      </div>
      
      <h3 className="font-game text-xl font-bold text-white mb-3">
        {title}
      </h3>
      
      <p className="text-gray-200 text-sm leading-relaxed">
        {description}
      </p>
      
      {isAvailable && (
        <div className="mt-4 flex items-center text-game-accent text-sm font-medium">
          Play Now
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
  
  return isAvailable ? (
    <Link href={href}>{content}</Link>
  ) : (
    <div>{content}</div>
  )
}





