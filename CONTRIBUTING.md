# Contributing to GamesCat

Thank you for your interest in contributing to GamesCat! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/gamescat.git`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## 🎮 Adding New Games

### 1. Create Game Structure
```bash
mkdir -p games/your-game/{config,scenes,entities}
mkdir -p app/games/your-game
```

### 2. Required Files
- `games/your-game/YourGame.ts` - Main game class
- `games/your-game/config/GameConfig.ts` - Game configuration
- `games/your-game/scenes/PreloadScene.ts` - Asset loading
- `games/your-game/scenes/GameScene.ts` - Main game logic
- `app/games/your-game/page.tsx` - Next.js page component

### 3. Update Main Page
Add your game card to `app/page.tsx`

## 📝 Code Standards

### General Rules
- **Language**: All code and comments in English
- **TypeScript**: Strict mode, no `any` types
- **Formatting**: Use Prettier (automatic on save)
- **Linting**: Follow ESLint rules

### Naming Conventions
- **Classes**: PascalCase (`GameScene`, `Tower`)
- **Functions/Variables**: camelCase (`updateHealth`, `playerScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_HEALTH`, `SCREEN_WIDTH`)
- **Files**: PascalCase for classes, camelCase for utilities

### Game Development
- Use Phaser.js best practices
- Implement proper cleanup in `destroy()` methods
- Use event-driven architecture
- Store configuration in separate files
- Comment complex game logic

## 🧪 Testing

Before submitting:
```bash
npm run validate  # Runs type-check and lint
npm run build     # Test production build
```

## 📋 Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Follow code standards
3. **Test**: Ensure all checks pass
4. **Commit**: Use conventional commit messages
5. **Push**: `git push origin feature/your-feature`
6. **Create PR**: Provide clear description

### Commit Message Format
```
type(scope): description

feat(tower-defense): add new laser tower type
fix(fighter): resolve collision detection bug
docs(readme): update installation instructions
```

## 🎯 Areas for Contribution

### High Priority
- 🎮 New game implementations
- 🐛 Bug fixes and performance improvements
- 📱 Mobile responsiveness
- ♿ Accessibility improvements

### Medium Priority
- 🎨 UI/UX enhancements
- 🔊 Sound effects and music
- 📊 Analytics and metrics
- 🌐 Internationalization

### Low Priority
- 📚 Documentation improvements
- 🧪 Test coverage
- 🔧 Development tooling
- 📦 Build optimizations

## 🎮 Game Guidelines

### Performance
- Target 60 FPS on modern browsers
- Use object pooling for frequently created objects
- Optimize asset loading and memory usage
- Test on various devices and browsers

### User Experience
- Intuitive controls and clear instructions
- Responsive design for different screen sizes
- Proper error handling and user feedback
- Consistent visual style across games

### Code Quality
- Modular, reusable components
- Clear separation of concerns
- Comprehensive error handling
- Performance monitoring

## 🤝 Community

### Getting Help
- 💬 GitHub Discussions for questions
- 🐛 GitHub Issues for bug reports
- 💡 GitHub Issues for feature requests

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers learn and contribute
- Focus on what's best for the project

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Happy coding! 🎮✨
