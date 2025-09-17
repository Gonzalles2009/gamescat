# GamesCat

Modern web project with a browser fighting game built on Next.js 14, TypeScript, Tailwind CSS, and Phaser.js. Includes Player vs Player and Player vs Bot modes, round system (best-of-3), blocking, multiple attacks with animations, health UI, timers, and a start menu.

- Repo: [`github.com/Gonzalles2009/gamescat`](https://github.com/Gonzalles2009/gamescat)
- App structure: Next.js App Router (`/app`) with a game page at `/games/fighter`

## Tech
- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS
- Phaser.js (Arcade Physics)

## Getting Started

Prerequisites:
- Node.js 18+
- npm 9+

Install deps:
```bash
npm install
```

Run dev server:
```bash
npm run dev
```
Open http://localhost:3000

Build:
```bash
npm run build
npm run start
```

## Project Layout

- `app/` — Next.js routes and UI
  - `app/page.tsx` — landing
  - `app/games/fighter/page.tsx` — fighter game page (client-only)
- `games/fighter/` — Phaser game code
  - `FighterGame.ts` — Phaser initialization
  - `config/GameConfig.ts` — constants (screen, physics, inputs, combat)
  - `scenes/PreloadScene.ts` — assets (demo sprites), loading
  - `scenes/GameScene.ts` — main scene, UI, input, bot AI, rounds
  - `entities/Fighter.ts` — fighter logic (states, attacks, block, hitboxes)

## Gameplay

- Modes: Main menu → choose `Player vs Player` or `Player vs Bot`
- Rounds: best of 3 (2 wins to take the match)
- Timer: 99 seconds; higher health at 0 wins the round
- Controls:
  - Player 1: Arrows + J (Punch) / K (Block) / L (Kick)
  - Player 2 (PVP): WASD + U (Punch) / I (Block) / O (Kick)
  - Player 2 (PVE): Bot controls itself
- Specials:
  - Uppercut: Up + Punch
  - Spinning Kick: Down + Kick
  - Power Punch: Forward + Punch (relative to facing)
- Block:
  - Hold (`K`/`I`) to block. While blocking you take 0 damage, cannot attack, and movement is halted. Visual green shield is shown.

## Bot (PVE)
- Keeps mid-range, approaches/retreats
- Random short blocks, rare jumps
- Attacks more often when in range

## UI
- Health bars, names (`BOT` label in PVE), round indicators, timer
- Overlays for round wins, match win, and start menu

## Notes
- Phaser runs only on client. The game page uses dynamic, `ssr: false` loading.
- Debug rectangles were removed; physics debug is off by default.

## Development Tips
- Configs: `games/fighter/config/GameConfig.ts`
- Animations: created in `GameScene.createCombatAnimations()`
- Attacks/Hitboxes: `Fighter.performAnimatedAttack()` and `createAttackBox()`
- Blocking: `Fighter.startBlocking()/stopBlocking()` + shieldBox
- Rounds/Match flow: `GameScene.onTimeUp()`, `checkMatchEnd()`, `nextRound()`, KO event `round-ko`
- Bot AI: `GameScene.updateBotAI()` (decision cooldown, ranges, probabilities)

## Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

## License
This project is for demonstration/learning. Add a license if you plan to distribute.

# GamesCat - Browser Fighting Games

A modern web platform for 2D fighting games built with Next.js, TypeScript, and Phaser.js.

## 🎮 Features

- **Street Fighter Style Game**: Classic 2D fighting with combos and special moves
- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Phaser.js
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Combat**: Smooth 60fps gameplay with physics-based interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd gamescat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Game Controls

### Fighter Game

**Player 1:**
- Movement: Arrow Keys (←↑↓→)
- Light Punch: J
- Heavy Punch: K  
- Kick: L

**Player 2:**
- Movement: WASD
- Light Punch: U
- Heavy Punch: I
- Kick: O

**General:**
- Space: Start Game
- R: Restart Round
- ESC: Pause Game

## 🏗️ Project Structure

```
gamescat/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── games/fighter/     # Fighter game page
├── components/            # React components
├── games/                # Game implementations
│   └── fighter/          # Fighter game logic
│       ├── scenes/       # Phaser scenes
│       ├── entities/     # Game entities
│       ├── config/       # Game configuration
│       └── assets/       # Game assets
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── store/                # State management
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## 🎨 Adding New Games

1. Create a new folder in `games/` directory
2. Implement Phaser scenes and entities
3. Add a new page in `app/games/[gameId]/`
4. Update the home page to include your new game

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Code Standards

- **Language**: All code in English
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier + ESLint
- **Architecture**: Component-based with clear separation

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎲 Game Features Roadmap

- [x] Basic 2D Fighting Game
- [ ] Character Selection
- [ ] Special Moves System
- [ ] Sound Effects & Music
- [ ] Multiplayer Support
- [ ] Tournament Mode
- [ ] Custom Character Creation

---

Built with ❤️ using modern web technologies.
