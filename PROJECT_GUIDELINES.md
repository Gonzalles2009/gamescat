# GamesCat Project Guidelines

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Game Engine**: Phaser.js 3.70+
- **State Management**: Zustand (for game state)
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

### Project Structure
```
gamescat/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── games/
│       └── [gameId]/      # Dynamic game routes
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── game/             # Game-specific components
│   └── layout/           # Layout components
├── games/                # Game implementations
│   ├── fighter/
│   │   ├── scenes/       # Phaser scenes
│   │   ├── entities/     # Game entities (Player, AI)
│   │   ├── systems/      # Game systems (Physics, Input)
│   │   ├── config/       # Game configuration
│   │   └── assets/       # Game assets
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── store/                # Zustand stores
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 📝 Coding Standards

### General Rules
1. **Language**: All code, comments, and variables in English
2. **No emojis** in code comments or console logs
3. **Consistent naming**: camelCase for variables/functions, PascalCase for components/classes
4. **Strict TypeScript**: No `any` types, prefer interfaces over types
5. **Clean code**: Prefer explicit over implicit, readable over clever

### File Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `GameCard.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useGameState.ts`)
- **Utilities**: `camelCase.ts` (e.g., `gameHelpers.ts`)
- **Types**: `camelCase.types.ts` (e.g., `fighter.types.ts`)
- **Constants**: `UPPER_SNAKE_CASE.ts` (e.g., `GAME_CONFIG.ts`)

### Code Organization
```typescript
// File structure order:
// 1. External imports
// 2. Internal imports
// 3. Type definitions
// 4. Constants
// 5. Main component/function
// 6. Export default

import React from 'react';
import { NextPage } from 'next';

import { GameCard } from '@/components/game/GameCard';
import { useGameState } from '@/hooks/useGameState';

interface Props {
  gameId: string;
}

const GAME_SETTINGS = {
  maxPlayers: 2,
  roundTime: 60
};

const GamePage: NextPage<Props> = ({ gameId }) => {
  // Component logic
};

export default GamePage;
```

## 🎮 Game Development Standards

### Phaser.js Integration with React
```typescript
// Proper Phaser initialization in React
useEffect(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainerRef.current,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 500 }, debug: false }
    },
    scene: [PreloadScene, GameScene]
  };
  
  const game = new Phaser.Game(config);
  gameInstanceRef.current = game;
  
  return () => game.destroy(true);
}, []);
```

### Game Entity Architecture
```typescript
// Base entity pattern
export abstract class BaseEntity extends Phaser.GameObjects.Sprite {
  protected health: number;
  protected maxHealth: number;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.initializeEntity();
  }
  
  protected abstract initializeEntity(): void;
  public abstract update(time: number, delta: number): void;
  public abstract takeDamage(damage: number): void;
}
```

### State Management Pattern
```typescript
// Game state store
interface GameState {
  currentGame: string | null;
  playerStats: PlayerStats;
  gameSettings: GameSettings;
}

interface GameActions {
  setCurrentGame: (gameId: string) => void;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  currentGame: null,
  playerStats: defaultPlayerStats,
  gameSettings: defaultGameSettings,
  
  setCurrentGame: (gameId) => set({ currentGame: gameId }),
  updatePlayerStats: (stats) => set((state) => ({
    playerStats: { ...state.playerStats, ...stats }
  })),
  resetGame: () => set({ currentGame: null })
}));
```

## 🎯 Game-Specific Standards (Fighter)

### Combat System Architecture
```typescript
// Combat action types
export enum CombatAction {
  LIGHT_PUNCH = 'lightPunch',
  HEAVY_PUNCH = 'heavyPunch',
  KICK = 'kick',
  BLOCK = 'block',
  DODGE = 'dodge'
}

// Input mapping
export const INPUT_MAP = {
  [CombatAction.LIGHT_PUNCH]: ['J', 'SPACE'],
  [CombatAction.HEAVY_PUNCH]: ['K'],
  [CombatAction.KICK]: ['L'],
  [CombatAction.BLOCK]: ['SHIFT'],
  [CombatAction.DODGE]: ['S']
} as const;
```

### Animation System
```typescript
// Animation configuration pattern
export interface AnimationConfig {
  key: string;
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
  duration?: number;
  onComplete?: () => void;
}

export const FIGHTER_ANIMATIONS: Record<string, AnimationConfig> = {
  idle: { key: 'fighter-idle', frameRate: 6, repeat: -1 },
  walk: { key: 'fighter-walk', frameRate: 8, repeat: -1 },
  punch: { key: 'fighter-punch', frameRate: 12, repeat: 0 },
  kick: { key: 'fighter-kick', frameRate: 10, repeat: 0 }
};
```

## 🎨 UI/UX Guidelines

### Component Structure
```typescript
// Component template
interface ComponentProps {
  // Props with clear types
}

export const Component: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // Hooks at the top
  // Event handlers
  // Render logic
  
  return (
    <div className="component-wrapper">
      {/* Clean JSX with Tailwind */}
    </div>
  );
};
```

### Styling Conventions
- Use Tailwind utility classes
- Group related classes: `"flex items-center justify-between"`
- Use CSS custom properties for game-specific values
- Responsive-first design: `"sm:text-lg md:text-xl"`

### Accessibility
- All interactive elements have proper ARIA labels
- Keyboard navigation support for all UI
- Game controls clearly documented
- High contrast mode support

## 🔧 Development Workflow

### Git Workflow
- **main**: Production-ready code
- **staging**: Testing environment
- **feature/xxx**: Feature branches
- Commit format: `"feat: add player combat system"`

### Performance Guidelines
- Lazy load game assets
- Use React.memo for expensive components
- Implement proper cleanup for Phaser instances
- Monitor frame rate and optimize accordingly

### Testing Strategy
- Unit tests for game logic
- Integration tests for React-Phaser integration
- E2E tests for complete game flows
- Performance benchmarks for critical paths

## 📦 Asset Management

### File Organization
```
public/
├── games/
│   └── fighter/
│       ├── sprites/
│       │   ├── characters/
│       │   └── effects/
│       ├── audio/
│       │   ├── sfx/
│       │   └── music/
│       └── ui/
├── icons/
└── images/
```

### Asset Naming
- Sprites: `character-action-frame.png` (e.g., `ryu-punch-01.png`)
- Audio: `category-name.mp3` (e.g., `sfx-punch-heavy.mp3`)
- Spritesheets: `character-spritesheet.png`

## 🚀 Build & Deployment

### Environment Configuration
- `.env.local`: Local development
- `.env.staging`: Staging environment  
- `.env.production`: Production settings

### Build Optimization
- Code splitting by game
- Asset compression and lazy loading
- TypeScript strict mode enabled
- Bundle analysis and optimization

---

*This document is living and should be updated as the project evolves.*
