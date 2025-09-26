# 🎮 GamesCat

A modern web platform for diverse browser games built with Next.js, TypeScript, and Phaser.js.

![GamesCat Platform](https://img.shields.io/badge/Platform-Browser%20Games-blue)
![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20TypeScript%20%7C%20Phaser.js-green)
![Status](https://img.shields.io/badge/Status-Active%20Development-orange)

## 🌟 Overview

GamesCat is a comprehensive gaming platform that brings various game genres to your browser. From intense fighting battles to strategic tower defense, experience high-quality games without downloads or installations.

### 🎯 Available Games

- **🥊 Fighting Arena** - Master combos and special moves in epic 2D battles
- **🏰 Tower Defense** - Build towers, defend your base, survive endless waves

### 🚧 Coming Soon

- **🧩 Puzzle Quest** - Mind-bending puzzles and brain teasers
- **🚀 Space Shooter** - Blast through asteroids and alien fleets  
- **🏎️ Racing Circuit** - High-speed racing with customizable vehicles
- **⚔️ RPG Adventure** - Epic quests, character progression, and exploration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+ or **yarn**

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Gonzalles2009/gamescat.git
cd gamescat
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## 🎮 Games Documentation

### 🥊 Fighting Arena

Classic 2D fighting game with smooth combat mechanics.

**Game Modes:**
- Player vs Player (Local)
- Player vs Bot (AI)

**Controls:**
- **Player 1:** Arrow Keys + J (Punch) / K (Block) / L (Kick)
- **Player 2:** WASD + U (Punch) / I (Block) / O (Kick)

**Special Moves:**
- **Uppercut:** ↑ + Punch
- **Spinning Kick:** ↓ + Kick  
- **Power Punch:** → + Punch (direction-based)

**Features:**
- Best of 3 rounds system
- 99-second timer per round
- Block system with visual feedback
- Intelligent bot AI with adaptive behavior
- Smooth animations and physics

### 🏰 Tower Defense

Strategic defense game with progressive difficulty and multiple tower types.

**Game Features:**
- **10 Progressive Waves** with increasing difficulty
- **3 Difficulty Levels:** Easy, Normal, Hard
- **3 Tower Types:** Basic (fast), Cannon (splash), Laser (high damage)
- **Dynamic Pricing:** Tower costs increase with each purchase
- **Obstacle System:** Blocked cells that clear progressively
- **Visual Effects:** Muzzle flashes, hit effects, death animations

**Controls:**
- **Left Click:** Place tower / Open sell menu
- **Mouse Hover:** Preview tower placement and range
- **PAUSE:** Open game menu
- **1x/2x/4x:** Speed controls
- **HOME:** Return to main menu (with confirmation)

**Tower Types:**
- **Basic Tower:** Fast firing rate, moderate damage
- **Cannon Tower:** Splash damage, slower rate, high impact
- **Laser Tower:** High damage, precise targeting, expensive

**Difficulty Scaling:**
- **Easy:** Standard enemy count, 10% tower cost increase, 5% obstacles clear per wave
- **Normal:** +60% enemies, 18% tower cost increase, 3% obstacles clear per wave  
- **Hard:** +120% enemies, 25% tower cost increase, 2% obstacles clear per wave

**Game Mechanics:**
- **Tower Selling:** Right-click towers for 20% refund
- **Range Preview:** See tower range when placing
- **Path Validation:** Smart placement system prevents blocking enemy path
- **Progressive Obstacles:** 90% of cells blocked initially, clearing each wave
- **Victory Condition:** Survive all 10 waves

## 🏗️ Project Architecture

```
gamescat/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles & Tailwind
│   ├── layout.tsx               # Root layout with fonts
│   ├── page.tsx                 # Main landing page
│   └── games/                   # Game-specific pages
│       ├── fighter/page.tsx     # Fighting game host
│       └── tower-defense/page.tsx # Tower defense host
├── games/                       # Phaser game implementations
│   ├── fighter/                 # Fighting game
│   │   ├── FighterGame.ts      # Game initialization
│   │   ├── config/GameConfig.ts # Game constants
│   │   ├── scenes/             # Phaser scenes
│   │   │   ├── PreloadScene.ts # Asset loading
│   │   │   └── GameScene.ts    # Main game logic
│   │   └── entities/           # Game entities
│   │       └── Fighter.ts      # Fighter character logic
│   └── tower-defense/          # Tower defense game
│       ├── TowerDefenseGame.ts # Game initialization  
│       ├── config/TowerDefenseConfig.ts # Game constants
│       ├── scenes/             # Phaser scenes
│       │   ├── PreloadScene.ts # Asset loading
│       │   └── GameScene.ts    # Main game logic & UI
│       └── entities/           # Game entities
│           ├── Tower.ts        # Tower logic & targeting
│           ├── Enemy.ts        # Enemy movement & health
│           ├── Projectile.ts   # Projectile physics & effects
│           └── WaveManager.ts  # Wave spawning & management
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & scripts
```

## 🛠️ Tech Stack

### Core Technologies
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Phaser.js](https://phaser.io/)** - 2D game framework

### Game Development
- **Phaser Arcade Physics** - Collision detection and physics
- **Event-driven Architecture** - Clean separation between game systems
- **Object-oriented Design** - Modular entity system
- **State Management** - Game state handling and persistence

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Framer Motion** - UI animations
- **PostCSS** - CSS processing

## 🎨 Adding New Games

### 1. Create Game Structure

```bash
# Create game directories
mkdir -p games/your-game/{config,scenes,entities}
mkdir -p app/games/your-game
```

### 2. Implement Core Files

**Game Initialization** (`games/your-game/YourGame.ts`):
```typescript
import * as Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { GameScene } from './scenes/GameScene'

export class YourGame {
  private game: Phaser.Game | null = null

  public init(containerId: string): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerId,
      scene: [PreloadScene, GameScene]
    }
    
    this.game = new Phaser.Game(config)
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }
}
```

**Next.js Page** (`app/games/your-game/page.tsx`):
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { YourGame } from '../../../games/your-game/YourGame'

export default function YourGamePage() {
  const gameRef = useRef<YourGame | null>(null)

  useEffect(() => {
    gameRef.current = new YourGame()
    gameRef.current.init('your-game-container')

    return () => {
      gameRef.current?.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <div id="your-game-container" className="w-full h-full" />
    </div>
  )
}
```

### 3. Update Main Page

Add your game to `app/page.tsx`:
```typescript
<GameCard 
  title="Your Game"
  description="Description of your awesome game"
  href="/games/your-game"
  status="Available"
  gradient="from-purple-600 to-blue-600"
/>
```

## 🔧 Development Guidelines

### Code Standards
- **Language:** All code and comments in English
- **TypeScript:** Strict mode enabled, no `any` types
- **Naming:** PascalCase for classes, camelCase for functions/variables
- **Architecture:** Clean separation between UI, game logic, and data

### Game Development Best Practices
- **Entity System:** Create reusable entity classes
- **Event-driven:** Use Phaser events for communication
- **Configuration:** Store constants in config files
- **Performance:** Use object pooling for frequently created objects
- **Responsive:** Support different screen sizes

### File Organization
- **Scenes:** Game states (Menu, Game, GameOver)
- **Entities:** Game objects (Player, Enemy, Projectile)
- **Config:** Constants and configuration
- **Assets:** Images, sounds, fonts (in `public/`)

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full Support |
| Firefox | 88+     | ✅ Full Support |
| Safari  | 14+     | ✅ Full Support |
| Edge    | 90+     | ✅ Full Support |

## 🚀 Performance

### Optimization Features
- **Next.js SSG** - Static generation for fast loading
- **Dynamic Imports** - Games loaded only when needed
- **Asset Optimization** - Compressed images and efficient loading
- **Object Pooling** - Reuse game objects for better performance
- **Efficient Rendering** - Optimized Phaser rendering pipeline

### Recommended Specs
- **CPU:** Modern dual-core processor
- **RAM:** 4GB minimum
- **Graphics:** Hardware-accelerated browser
- **Network:** Broadband for initial load

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/gamescat.git
cd gamescat
npm install
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Development
- Follow code standards
- Add TypeScript types
- Test your changes
- Update documentation

### 4. Submit PR
- Clear description of changes
- Link any related issues
- Ensure all tests pass

### Areas for Contribution
- 🎮 New game implementations
- 🎨 UI/UX improvements  
- 🐛 Bug fixes and optimizations
- 📚 Documentation improvements
- 🧪 Test coverage expansion

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |

## 🐛 Troubleshooting

### Common Issues

**Game not loading:**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

**Performance issues:**
- Close other browser tabs
- Check system resources
- Lower game quality settings if available

**Controls not working:**
- Click on game area to focus
- Check if another element has focus
- Verify browser compatibility

### Getting Help

1. **Check Issues:** Look for existing solutions
2. **Create Issue:** Provide detailed description and steps to reproduce
3. **Community:** Join discussions in Issues section

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Phaser.js** - Amazing 2D game framework
- **Next.js Team** - Excellent React framework
- **Tailwind CSS** - Beautiful utility-first CSS
- **TypeScript** - Type safety and developer experience

---

**Built with ❤️ by the GamesCat team**

Ready to play? Visit [GamesCat](https://gamescat.vercel.app) and start your gaming adventure!