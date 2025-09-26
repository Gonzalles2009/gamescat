import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG, TowerType } from '../config/TowerDefenseConfig'
import { Tower } from '../entities/Tower'
import { Enemy } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { WaveManager } from '../entities/WaveManager'

export class TowerDefenseGameScene extends Phaser.Scene {
  // Game state
  private playerHealth: number = TOWER_DEFENSE_CONFIG.INITIAL_HEALTH
  private playerMoney: number = TOWER_DEFENSE_CONFIG.INITIAL_MONEY
  private gameStarted: boolean = false
  private gameOver: boolean = false
  
  // Game objects
  private towers: Tower[] = []
  private projectiles: Projectile[] = []
  private waveManager!: WaveManager
  
  // UI elements
  private uiContainer!: Phaser.GameObjects.Container
  private healthText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private selectedTowerType: TowerType = 'BASIC'
  private towerButtons: { [key in TowerType]: Phaser.GameObjects.Container } = {} as any
  private startWaveButton!: Phaser.GameObjects.Container
  private towersPlacedByType: Record<TowerType, number> = { BASIC: 0, CANNON: 0, LASER: 0 }

  // Speed control
  private gameSpeed: number = 1 // 1 = normal, 2 = 2x, 4 = 4x, 0 = paused
  private isPaused: boolean = false
  private speedButtons: Phaser.GameObjects.Container[] = []

  // Game menu
  private gameMenu!: Phaser.GameObjects.Container
  private menuBackground!: Phaser.GameObjects.Graphics
  private menuVisible: boolean = false
  private startupMenuContainer!: Phaser.GameObjects.Container
  private pauseMenuContainer!: Phaser.GameObjects.Container
  
  // Difficulty
  private difficulty: 'EASY' | 'NORMAL' | 'HARD' = 'EASY'
  private difficultyButtons: { container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; value: 'EASY'|'NORMAL'|'HARD' }[] = []

  // Grid and path
  private gridGraphics!: Phaser.GameObjects.Graphics
  private pathGraphics!: Phaser.GameObjects.Graphics
  private pathSegments: { x1: number; y1: number; x2: number; y2: number }[] = []
  
  // Dynamic obstacles that block placement and gradually disappear with waves
  private obstacleGraphics!: Phaser.GameObjects.Graphics
  private candidateCells: { col: number; row: number; x: number; y: number }[] = []
  private blockedCells: Set<string> = new Set()
  private blockOrder: string[] = []
  
  // Game state flags
  private placingTower: boolean = false
  private towerPreview?: Phaser.GameObjects.Graphics
  private previewRange?: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'TowerDefenseGameScene' })
  }

  create() {
    console.log('Tower Defense Game Scene created')
    
    // Reset game state on scene restart
    this.resetGameState()
    
    this.setupBackground()
    this.setupGrid()
    this.setupPath()
    this.setupObstacles()
    this.setupUI()
    this.setupInput()
    this.setupWaveManager()
    this.setupEventListeners()
    
    // Create speed controls and game menu
    this.createTopPanel()
  }

  private resetGameState() {
    // Reset core game state
    this.gameStarted = false
    this.gameOver = false
    this.menuVisible = false
    this.isPaused = false
    this.gameSpeed = 1
    this.playerHealth = TOWER_DEFENSE_CONFIG.INITIAL_HEALTH
    this.playerMoney = TOWER_DEFENSE_CONFIG.INITIAL_MONEY
    
    // Reset time scale
    if (this.time) {
      this.time.timeScale = 1
    }
    
    // Clear game objects
    this.towers.forEach(tower => tower.destroy())
    this.towers = []
    this.projectiles = []
    this.towersPlacedByType = { BASIC: 0, CANNON: 0, LASER: 0 }
    
    // Reset wave manager if it exists
    if (this.waveManager) {
      this.waveManager.reset()
    }
    
    // Reset UI state
    this.selectedTowerType = 'BASIC'
    this.difficulty = 'EASY'
    
    console.log('Game state reset for new game')
  }

  private setupBackground() {
    // Create gradient background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a202c, 0x1a202c, 0x2d3748, 0x2d3748)
    bg.fillRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT)
    bg.setDepth(0)
  }

  private setupGrid() {
    this.gridGraphics = this.add.graphics()
    this.drawGrid()
  }

  private drawGrid() {
    this.gridGraphics.clear()
    this.gridGraphics.lineStyle(1, 0x4a5568, 0.3)
    
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    const width = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH
    const height = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      this.gridGraphics.moveTo(x, 0)
      this.gridGraphics.lineTo(x, height)
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      this.gridGraphics.moveTo(0, y)
      this.gridGraphics.lineTo(width, y)
    }
    
    this.gridGraphics.strokePath()
    this.gridGraphics.setDepth(1)
  }

  private setupPath() {
    this.pathGraphics = this.add.graphics()
    this.drawPath()
    // Precompute path segments for fast distance checks
    const pts = TOWER_DEFENSE_CONFIG.PATH_POINTS
    this.pathSegments = []
    for (let i = 0; i < pts.length - 1; i++) {
      this.pathSegments.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y })
    }
  }

  private setupObstacles() {
    // Prepare graphics layer
    this.obstacleGraphics = this.add.graphics()
    this.obstacleGraphics.setDepth(3)

    // Precompute eligible grid cells (not on path and inside game area)
    this.candidateCells = []
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    const gameAreaTop = TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT
    const gameAreaBottom = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
    const pathWidth = TOWER_DEFENSE_CONFIG.PATH_WIDTH

    for (let y = gameAreaTop + gridSize / 2; y < gameAreaBottom; y += gridSize) {
      for (let x = gridSize / 2; x < TOWER_DEFENSE_CONFIG.SCREEN_WIDTH; x += gridSize) {
        // Skip cells too close to the path
        let tooCloseToPath = false
        for (let i = 0; i < this.pathSegments.length; i++) {
          const s = this.pathSegments[i]
          const dist = this.distanceToLineSegment(x, y, s.x1, s.y1, s.x2, s.y2)
          if (dist < pathWidth / 2 + 5) {
            tooCloseToPath = true
            break
          }
        }
        if (tooCloseToPath) continue

        const col = Math.floor(x / gridSize)
        const row = Math.floor((y - 0) / gridSize)
        this.candidateCells.push({ col, row, x, y })
      }
    }

    // Build a stable random order of cells (shuffle once) for monotonic freeing
    this.blockOrder = this.candidateCells.map(c => `${c.col},${c.row}`)
    for (let i = this.blockOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.blockOrder[i], this.blockOrder[j]] = [this.blockOrder[j], this.blockOrder[i]]
    }

    // Initialize obstacles for wave 1 (90% blocked)
    this.updateObstaclesForWave(1)
  }

  private renderObstacles() {
    this.obstacleGraphics.clear()
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    if (this.blockedCells.size === 0) {
      this.obstacleGraphics.setVisible(false)
      return
    }
    this.obstacleGraphics.setVisible(true)
    // Softer blocked style: neutral slate overlay + subtle cross hatch
    this.obstacleGraphics.fillStyle(0x475569, 0.28)
    this.obstacleGraphics.lineStyle(1, 0x94a3b8, 0.35)

    this.blockedCells.forEach((cellKey) => {
      const [colStr, rowStr] = cellKey.split(',')
      const col = parseInt(colStr, 10)
      const row = parseInt(rowStr, 10)
      const cx = col * gridSize + gridSize / 2
      const cy = row * gridSize + gridSize / 2
      const x0 = cx - gridSize / 2 + 2
      const y0 = cy - gridSize / 2 + 2
      const w = gridSize - 4
      const h = gridSize - 4
      this.obstacleGraphics.fillRect(x0, y0, w, h)
      // Cross hatch
      const m = 4
      this.obstacleGraphics.beginPath()
      this.obstacleGraphics.moveTo(x0 + m, y0 + m)
      this.obstacleGraphics.lineTo(x0 + w - m, y0 + h - m)
      this.obstacleGraphics.moveTo(x0 + m, y0 + h - m)
      this.obstacleGraphics.lineTo(x0 + w - m, y0 + m)
      this.obstacleGraphics.strokePath()
    })
  }

  private updateObstaclesForWave(waveNumber: number) {
    // Fraction of blocked cells: wave 1 -> 0.9, wave 2 -> 0.8, ... wave 10 -> 0
    // On higher difficulties, fewer cells open each wave
    const perWave = this.difficulty === 'EASY' ? 0.05 : this.difficulty === 'NORMAL' ? 0.03 : 0.02
    const blockedFraction = Math.max(0, 0.9 - perWave * (waveNumber - 1))

    const blockedCount = Math.floor(this.blockOrder.length * blockedFraction)
    this.blockedCells.clear()
    for (let i = 0; i < blockedCount; i++) {
      this.blockedCells.add(this.blockOrder[i])
    }

    this.renderObstacles()
  }

  private drawPath() {
    this.pathGraphics.clear()
    
    const pathWidth = TOWER_DEFENSE_CONFIG.PATH_WIDTH
    const points = TOWER_DEFENSE_CONFIG.PATH_POINTS
    
    // Draw path using two strokes: outer darker border, then main fill on top
    // 1) Outer border (slightly wider)
    this.pathGraphics.lineStyle(pathWidth + 4, 0x654321, 1)
    
    if (points.length > 1) {
      this.pathGraphics.beginPath()
      this.pathGraphics.moveTo(points[0].x, points[0].y)
      
      for (let i = 1; i < points.length; i++) {
        this.pathGraphics.lineTo(points[i].x, points[i].y)
      }
      
      this.pathGraphics.strokePath()
    }

    // 2) Main road on top (slightly narrower)
    this.pathGraphics.lineStyle(pathWidth, 0x8B4513, 0.9)
    if (points.length > 1) {
      this.pathGraphics.beginPath()
      this.pathGraphics.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        this.pathGraphics.lineTo(points[i].x, points[i].y)
      }
      this.pathGraphics.strokePath()
    }
    
    // No additional center strokes; border already drawn underneath
    
    // Draw start and end markers
    this.pathGraphics.fillStyle(0x00ff00)
    this.pathGraphics.fillCircle(points[0].x, points[0].y, 15)
    
    this.pathGraphics.fillStyle(0xff0000)
    this.pathGraphics.fillCircle(points[points.length - 1].x, points[points.length - 1].y, 15)
    
    this.pathGraphics.setDepth(2)
  }

  private setupUI() {
    this.uiContainer = this.add.container(0, 0)
    this.uiContainer.setDepth(100)
    console.log('UI container created with depth 100')
    
    // Create UI panel background
    const panelY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
    const uiPanel = this.add.graphics()
    uiPanel.fillStyle(0x1a202c, 0.95)
    uiPanel.fillRect(0, panelY, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT)
    uiPanel.lineStyle(2, 0x4a5568)
    uiPanel.strokeRect(0, panelY, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT)
    this.uiContainer.add(uiPanel)
    
    this.createTowerButtons()
    // Start Wave button is now in the game menu
  }


  private createTowerButtons() {
    const panelY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
    const startX = 250
    const buttonSpacing = 100
    
    const towerTypes: TowerType[] = ['BASIC', 'CANNON', 'LASER']
    
    towerTypes.forEach((towerType, index) => {
      const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[towerType]
      const x = startX + index * buttonSpacing
      const y = panelY + 10
      
      // Button container
      const buttonContainer = this.add.container(x, y)
      
      // Button background
      const buttonBg = this.add.graphics()
      buttonBg.fillStyle(towerType === this.selectedTowerType ? 0x4a5568 : 0x2d3748)
      buttonBg.fillRoundedRect(0, 0, TOWER_DEFENSE_CONFIG.UI.BUTTON_WIDTH, TOWER_DEFENSE_CONFIG.UI.BUTTON_HEIGHT, 5)
      buttonBg.lineStyle(2, towerType === this.selectedTowerType ? 0x00ff88 : 0x4a5568)
      buttonBg.strokeRoundedRect(0, 0, TOWER_DEFENSE_CONFIG.UI.BUTTON_WIDTH, TOWER_DEFENSE_CONFIG.UI.BUTTON_HEIGHT, 5)
      buttonContainer.add(buttonBg)
      
      // Tower preview
      const towerPreview = this.add.graphics()
      this.drawTowerPreview(towerPreview, towerType, 40, 25)
      buttonContainer.add(towerPreview)
      
      // Cost text
      const costText = this.add.text(40, 45, `$${config.cost}`, {
        fontSize: '12px',
        color: this.playerMoney >= config.cost ? '#51cf66' : '#ff6b6b',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      buttonContainer.add(costText)
      
      // Make interactive - use rectangle hit area for better detection
      const hitArea = new Phaser.Geom.Rectangle(0, 0, TOWER_DEFENSE_CONFIG.UI.BUTTON_WIDTH, TOWER_DEFENSE_CONFIG.UI.BUTTON_HEIGHT)
      buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      buttonContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        console.log(`Tower button clicked: ${towerType}, pointer position: ${pointer.x}, ${pointer.y}, container position: ${x}, ${y}`)
        this.selectTowerType(towerType)
      })
      buttonContainer.on('pointerover', () => {
        console.log(`Tower button hover: ${towerType}`)
        this.onTowerButtonHover(buttonContainer, true)
      })
      buttonContainer.on('pointerout', () => {
        console.log(`Tower button out: ${towerType}`)
        this.onTowerButtonHover(buttonContainer, false)
      })
      
      this.towerButtons[towerType] = buttonContainer
      this.uiContainer.add(buttonContainer)

      // Set higher z-index for tower buttons to ensure they're clickable
      buttonContainer.setDepth(10)
      console.log(`Tower button ${towerType} added to UI container at depth 10`)
    })

    // Update button states after creation
    this.updateTowerButtons()
    console.log('Tower buttons created and initialized')

    // Log button positions for debugging
    Object.entries(this.towerButtons).forEach(([towerType, button]) => {
      console.log(`Button ${towerType} position: x=${button.x}, y=${button.y}, interactive=${button.input?.enabled}`)
    })
  }

  private drawTowerPreview(graphics: Phaser.GameObjects.Graphics, towerType: TowerType, x: number, y: number, overrideColor?: number) {
    const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[towerType]
    const color = overrideColor !== undefined ? overrideColor : config.color
    graphics.setPosition(x, y)
    
    switch (towerType) {
      case 'BASIC':
        graphics.fillStyle(color)
        graphics.fillRect(-8, -8, 16, 16)
        graphics.lineStyle(1, 0x000000)
        graphics.strokeRect(-8, -8, 16, 16)
        break
        
      case 'CANNON':
        graphics.fillStyle(color)
        graphics.fillCircle(0, 0, 10)
        graphics.lineStyle(1, 0x000000)
        graphics.strokeCircle(0, 0, 10)
        break
        
      case 'LASER':
        graphics.fillStyle(color)
        graphics.fillTriangle(0, -10, -8, 5, 8, 5)
        graphics.lineStyle(1, 0x000000)
        graphics.strokeTriangle(0, -10, -8, 5, 8, 5)
        break
    }
  }

  // Start Wave button functionality moved to game menu
  // createWaveButton() method removed

  private createTopPanel() {
    // Create top panel background
    const topPanelBg = this.add.graphics()
    topPanelBg.fillStyle(0x2a2a2a, 0.9)
    topPanelBg.fillRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT)
    topPanelBg.lineStyle(2, 0x4a4a4a)
    topPanelBg.strokeRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT)
    topPanelBg.setDepth(300)

    // Reset speed buttons on (re)create to avoid stale references after restart
    this.speedButtons = []

    // Create speed control buttons (left side)
    this.createSpeedControlButtons()

    // Create game info display (right side)
    this.createGameInfoDisplay()

    // Create game menu
    this.createGameMenu()

    // Initialize game state
    this.gameStarted = false
    this.menuVisible = false

    // Show menu immediately on game start
    this.time.delayedCall(100, () => {
      console.log('🚀 Attempting to show game menu on startup')
      this.showGameMenu()
    })

    // Update initial state
    this.updateSpeedControls()
  }

  private createSpeedControlButtons() {
    const buttonY = 25 // Center buttons in top panel
    const startX = 20

    // Pause/Menu button
    this.createSpeedButton('PAUSE', startX, buttonY, 0x888888, () => this.toggleGameMenu())

    // Speed buttons
    this.createSpeedButton('1x', startX + 70, buttonY, 0x00aa44, () => this.setGameSpeed(1))
    this.createSpeedButton('2x', startX + 130, buttonY, 0x0088aa, () => this.setGameSpeed(2))
    this.createSpeedButton('4x', startX + 190, buttonY, 0x4400aa, () => this.setGameSpeed(4))
  }

  private createGameInfoDisplay() {
    const rightMargin = 20
    const verticalCenter = TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT / 2 - 10
    
    // HOME button (rightmost)
    this.createHomeButton()
    
    // Health display 
    this.healthText = this.add.text(TOWER_DEFENSE_CONFIG.SCREEN_WIDTH - rightMargin - 80, verticalCenter, '', {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(301)

    // Money display 
    this.moneyText = this.add.text(TOWER_DEFENSE_CONFIG.SCREEN_WIDTH - rightMargin - 220, verticalCenter, '', {
      fontSize: '16px',
      color: '#4ecdc4',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(301)

    // Wave display 
    this.waveText = this.add.text(TOWER_DEFENSE_CONFIG.SCREEN_WIDTH - rightMargin - 360, verticalCenter, '', {
      fontSize: '16px',
      color: '#ffe66d',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(301)
  }

  private createHomeButton() {
    const buttonX = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH - 50
    const buttonY = 25

    const homeButton = this.add.container(buttonX, buttonY)

    // Button background
    const homeBg = this.add.graphics()
    homeBg.fillStyle(0xf59e0b, 0.9)
    homeBg.fillRoundedRect(-25, -15, 50, 30, 6)
    homeBg.lineStyle(2, 0xd97706)
    homeBg.strokeRoundedRect(-25, -15, 50, 30, 6)
    homeButton.add(homeBg)

    // Button text
    const homeText = this.add.text(0, 0, 'HOME', {
      fontSize: '12px',
      color: '#000000',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    homeButton.add(homeText)

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-25, -15, 50, 30)
    homeButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
    homeButton.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.showHomeConfirmation()
    })

    // Hover effects
    homeButton.on('pointerover', () => {
      homeBg.lineStyle(3, 0xffff00)
      homeBg.strokeRoundedRect(-25, -15, 50, 30, 6)
      homeButton.setScale(1.05)
    })

    homeButton.on('pointerout', () => {
      homeBg.lineStyle(2, 0xd97706)
      homeBg.strokeRoundedRect(-25, -15, 50, 30, 6)
      homeButton.setScale(1.0)
    })

    homeButton.setDepth(350)
    console.log('HOME button created in top panel')
  }

  private showHomeConfirmation() {
    // Create confirmation dialog
    const centerX = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2
    const centerY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT / 2

    const confirmContainer = this.add.container(centerX, centerY)
    confirmContainer.setDepth(400) // Above everything else

    // Semi-transparent background
    const confirmBg = this.add.graphics()
    confirmBg.fillStyle(0x000000, 0.8)
    confirmBg.fillRect(-centerX, -centerY, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT)
    confirmContainer.add(confirmBg)

    // Confirmation panel
    const panel = this.add.graphics()
    panel.fillStyle(0x1a202c, 0.95)
    panel.lineStyle(4, 0xef4444)
    panel.fillRoundedRect(-200, -120, 400, 240, 15)
    panel.strokeRoundedRect(-200, -120, 400, 240, 15)
    confirmContainer.add(panel)

    // Warning title
    const title = this.add.text(0, -80, 'WARNING!', {
      fontSize: '28px',
      color: '#ef4444',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    confirmContainer.add(title)

    // Warning message
    const message = this.add.text(0, -30, 'Going to home page will\nend the current game.\n\nAre you sure?', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)
    confirmContainer.add(message)

    // Yes button (go to home)
    const yesBtn = this.add.container(-80, 60)
    const yesBg = this.add.graphics()
    yesBg.fillStyle(0xef4444)
    yesBg.fillRoundedRect(-60, -20, 120, 40, 8)
    yesBg.lineStyle(3, 0xb91c1c)
    yesBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    const yesText = this.add.text(0, 0, 'YES', { fontSize: '18px', color: '#ffffff', fontFamily: 'Arial Black' }).setOrigin(0.5)
    yesBtn.add([yesBg, yesText])
    yesBtn.setSize(120, 40)
    yesBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains)
    yesBg.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains)
    
    const doGoHome = (event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      // Navigate to home page
      window.location.href = '/'
    }
    yesBtn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doGoHome(event))
    yesBg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doGoHome(event))
    
    // Hover effect
    yesBtn.on('pointerover', () => {
      yesBg.lineStyle(4, 0xffff00)
      yesBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    })
    yesBtn.on('pointerout', () => {
      yesBg.lineStyle(3, 0xb91c1c)
      yesBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    })
    confirmContainer.add(yesBtn)

    // No button (cancel)
    const noBtn = this.add.container(80, 60)
    const noBg = this.add.graphics()
    noBg.fillStyle(0x6b7280)
    noBg.fillRoundedRect(-60, -20, 120, 40, 8)
    noBg.lineStyle(3, 0x4b5563)
    noBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    const noText = this.add.text(0, 0, 'NO', { fontSize: '18px', color: '#ffffff', fontFamily: 'Arial Black' }).setOrigin(0.5)
    noBtn.add([noBg, noText])
    noBtn.setSize(120, 40)
    noBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains)
    noBg.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains)
    
    const doCancel = (event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      confirmContainer.destroy()
    }
    noBtn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doCancel(event))
    noBg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doCancel(event))
    
    // Hover effect
    noBtn.on('pointerover', () => {
      noBg.lineStyle(4, 0xffff00)
      noBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    })
    noBtn.on('pointerout', () => {
      noBg.lineStyle(3, 0x4b5563)
      noBg.strokeRoundedRect(-60, -20, 120, 40, 8)
    })
    confirmContainer.add(noBtn)

    // Animate appearance
    confirmContainer.setAlpha(0)
    confirmContainer.setScale(0.8)
    this.tweens.add({
      targets: confirmContainer,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    })

    console.log('🏠 Home confirmation dialog shown')
  }

  private createSpeedButton(text: string, x: number, y: number, color: number, onClick: () => void) {
    const button = this.add.container(x, y)

    // Add background for better visibility
    const background = this.add.graphics()
    background.fillStyle(0x000000, 0.7)
    background.fillRoundedRect(-5, -5, 60, 45, 4)
    button.add(background)

    // Button background - make it more visible
    const buttonBg = this.add.graphics()
    buttonBg.fillStyle(color)
    buttonBg.fillRoundedRect(0, 0, 50, 35, 4) // Larger buttons
    buttonBg.lineStyle(3, color - 0x222222)
    buttonBg.strokeRoundedRect(0, 0, 50, 35, 4)
    button.add(buttonBg)

    // Button text - make it more visible
    const buttonText = this.add.text(25, 18, text, {
      fontSize: '14px', // Larger font
      color: '#ffffff',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    button.add(buttonText)

    // Make interactive with proper hit area
    const hitArea = new Phaser.Geom.Rectangle(-5, -5, 60, 45)
    button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
    button.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      // Останавливаем распространение события, чтобы не ставились башни
      event.stopPropagation()
      console.log(`Speed button '${text}' clicked`)
      onClick()
    })

    // Hover effect
    button.on('pointerover', () => {
      button.setScale(1.1)
      buttonBg.lineStyle(4, 0xffff00) // Yellow border on hover
      buttonBg.strokeRoundedRect(0, 0, 50, 35, 4)
    })

    button.on('pointerout', () => {
      button.setScale(1.0)
      buttonBg.lineStyle(3, color - 0x222222)
      buttonBg.strokeRoundedRect(0, 0, 50, 35, 4)
    })

    // НЕ добавляем в uiContainer, создаем как отдельный объект
    button.setDepth(350) // Выше фона верхней панели (depth 300)

    this.speedButtons.push(button)
    console.log(`Speed control button '${text}' created at (${x}, ${y})`)
  }

  private createGameMenu() {
    console.log('🎮 Creating game menu...')
    const centerX = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2
    const centerY = TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT + 220 // Опущено ниже верхней панели

    // Create menu container
    this.gameMenu = this.add.container(centerX, centerY)
    this.gameMenu.setDepth(200) // Самый высокий приоритет
    console.log(`🎮 Game menu container created at (${centerX}, ${centerY})`)

    // Semi-transparent background covering the entire screen
    this.menuBackground = this.add.graphics()
    this.menuBackground.fillStyle(0x000000, 0.6)
    this.menuBackground.fillRect(-centerX, -centerY, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT)
    this.menuBackground.setInteractive()
    this.menuBackground.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      // Останавливаем распространение события
      event.stopPropagation()
      
      // Convert world coordinates to local coordinates relative to menu container
      const adjustedX = pointer.x - centerX
      const adjustedY = pointer.y - centerY
      
      // Only close menu if clicking outside the menu panel (not on the panel itself)
      const panelBounds = new Phaser.Geom.Rectangle(-210, -160, 420, 340)
      if (!Phaser.Geom.Rectangle.Contains(panelBounds, adjustedX, adjustedY)) {
        console.log('Clicking outside menu panel - closing menu')
        this.hideGameMenu()
      } else {
        console.log('Clicking inside menu panel - keeping menu open')
      }
    })
    // Startup menu container (difficulty + start)
    this.startupMenuContainer = this.add.container(0, 0)
    const startupPanel = this.add.graphics()
    startupPanel.fillStyle(0x1a202c, 0.9)
    startupPanel.lineStyle(4, 0x4a5568)
    startupPanel.fillRoundedRect(-210, -160, 420, 340, 15)
    startupPanel.strokeRoundedRect(-210, -160, 420, 340, 15)
    const startupTitle = this.add.text(0, -110, 'TOWER DEFENSE', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.startupMenuContainer.add([startupPanel, startupTitle])

    // Difficulty selectors (EASY / NORMAL / HARD)
    const difficulties: Array<{label: string; value: 'EASY'|'NORMAL'|'HARD'; color: number}> = [
      { label: 'EASY', value: 'EASY', color: 0x22c55e },
      { label: 'NORMAL', value: 'NORMAL', color: 0xf59e0b },
      { label: 'HARD', value: 'HARD', color: 0xef4444 }
    ]
    const diffY = -40
    const startX = -140
    const step = 140
    this.difficultyButtons = []
    difficulties.forEach((d, i) => {
      const c = this.add.container(startX + i * step, diffY)
      const bg = this.add.graphics()
      bg.fillStyle(0x1f2937, 0.9)
      bg.fillRoundedRect(-60, -18, 120, 36, 10)
      bg.lineStyle(3, 0x374151, 1)
      bg.strokeRoundedRect(-60, -18, 120, 36, 10)
      const t = this.add.text(0, 0, d.label, { fontSize: '16px', color: '#ffffff', fontFamily: 'Arial Black' }).setOrigin(0.5)
      c.add([bg, t])
      c.setSize(120, 36)
      c.setInteractive(new Phaser.Geom.Rectangle(-60, -18, 120, 36), Phaser.Geom.Rectangle.Contains)
      bg.setInteractive(new Phaser.Geom.Rectangle(-60, -18, 120, 36), Phaser.Geom.Rectangle.Contains)
      c.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        this.difficulty = d.value
        this.updateDifficultyButtonsUI()
      })
      bg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        this.difficulty = d.value
        this.updateDifficultyButtonsUI()
      })
      this.difficultyButtons.push({ container: c, bg, text: t, value: d.value })
      this.startupMenuContainer.add(c)
    })

    // Start button
    const startWaveButton = this.add.container(0, 80)
    const startWaveBg = this.add.graphics()
    startWaveBg.fillStyle(0x00ff88)
    startWaveBg.fillRoundedRect(-80, -25, 160, 50, 10)
    startWaveBg.lineStyle(3, 0x00cc66)
    startWaveBg.strokeRoundedRect(-80, -25, 160, 50, 10)
    startWaveButton.add(startWaveBg)
    const startWaveText = this.add.text(0, 0, 'START GAME', {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    startWaveButton.add(startWaveText)
    startWaveButton.setSize(160, 50)
    startWaveButton.setInteractive()
    startWaveButton.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      console.log('START GAME button clicked - starting game')
      this.gameStarted = true
      this.startNextWave()
      this.hideGameMenu()
    })
    startWaveButton.on('pointerover', () => {
      startWaveBg.lineStyle(4, 0xffff00)
      startWaveBg.strokeRoundedRect(-80, -25, 160, 50, 10)
    })
    startWaveButton.on('pointerout', () => {
      startWaveBg.lineStyle(3, 0x00cc66)
      startWaveBg.strokeRoundedRect(-80, -25, 160, 50, 10)
    })
    this.startupMenuContainer.add(startWaveButton)

    // Pause menu container (continue + restart)
    this.pauseMenuContainer = this.add.container(0, 0)
    const pausePanel = this.add.graphics()
    pausePanel.fillStyle(0x1a202c, 0.9)
    pausePanel.lineStyle(4, 0x4a5568)
    pausePanel.fillRoundedRect(-210, -160, 420, 340, 15)
    pausePanel.strokeRoundedRect(-210, -160, 420, 340, 15)
    const pauseTitle = this.add.text(0, -110, 'PAUSED', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Continue button
    const continueBtn = this.add.container(0, -10)
    const continueBg = this.add.graphics()
    continueBg.fillStyle(0x60a5fa)
    continueBg.fillRoundedRect(-100, -24, 200, 48, 10)
    continueBg.lineStyle(3, 0x3b82f6)
    continueBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    const continueText = this.add.text(0, 0, 'CONTINUE', { fontSize: '20px', color: '#000000', fontFamily: 'Arial Black' }).setOrigin(0.5)
    continueBtn.add([continueBg, continueText])
    continueBtn.setSize(200, 48)
    continueBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -24, 200, 48), Phaser.Geom.Rectangle.Contains)
    // Make the background itself fully clickable
    continueBg.setInteractive(new Phaser.Geom.Rectangle(-100, -24, 200, 48), Phaser.Geom.Rectangle.Contains)
    const doContinue = (event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.hideGameMenu()
    }
    continueBtn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doContinue(event))
    continueBg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doContinue(event))
    // Hover feedback
    continueBtn.on('pointerover', () => {
      continueBg.lineStyle(4, 0xffff00)
      continueBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    })
    continueBtn.on('pointerout', () => {
      continueBg.lineStyle(3, 0x3b82f6)
      continueBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    })

    // Restart button
    const restartBtn = this.add.container(0, 60)
    const restartBg = this.add.graphics()
    restartBg.fillStyle(0x34d399)
    restartBg.fillRoundedRect(-100, -24, 200, 48, 10)
    restartBg.lineStyle(3, 0x10b981)
    restartBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    const restartText = this.add.text(0, 0, 'RESTART', { fontSize: '20px', color: '#000000', fontFamily: 'Arial Black' }).setOrigin(0.5)
    restartBtn.add([restartBg, restartText])
    restartBtn.setSize(200, 48)
    restartBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -24, 200, 48), Phaser.Geom.Rectangle.Contains)
    // Make the background itself fully clickable
    restartBg.setInteractive(new Phaser.Geom.Rectangle(-100, -24, 200, 48), Phaser.Geom.Rectangle.Contains)
    const doRestart = (event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.scene.restart()
    }
    restartBtn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doRestart(event))
    restartBg.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doRestart(event))
    // Hover feedback
    restartBtn.on('pointerover', () => {
      restartBg.lineStyle(4, 0xffff00)
      restartBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    })
    restartBtn.on('pointerout', () => {
      restartBg.lineStyle(3, 0x10b981)
      restartBg.strokeRoundedRect(-100, -24, 200, 48, 10)
    })

    this.pauseMenuContainer.add([pausePanel, pauseTitle, continueBtn, restartBtn])

    // Add to root menu container
    this.gameMenu.add([this.menuBackground, this.startupMenuContainer, this.pauseMenuContainer])

    // Initially hide the menu
    this.gameMenu.setAlpha(0)
    this.gameMenu.setScale(0.8)
    // Default to startup menu visible
    this.startupMenuContainer.setVisible(true)
    this.pauseMenuContainer.setVisible(false)

    console.log('🎮 Game menu creation completed')
    this.updateDifficultyButtonsUI()
  }

  private updateDifficultyButtonsUI() {
    this.difficultyButtons.forEach(({ bg, text, value }) => {
      const isActive = value === this.difficulty
      bg.clear()
      if (isActive) {
        const color = value === 'EASY' ? 0x22c55e : value === 'NORMAL' ? 0xf59e0b : 0xef4444
        bg.fillStyle(color, 0.9)
        bg.fillRoundedRect(-60, -18, 120, 36, 10)
        bg.lineStyle(3, 0xffffff, 0.9)
        bg.strokeRoundedRect(-60, -18, 120, 36, 10)
        text.setColor('#000000')
      } else {
        bg.fillStyle(0x1f2937, 0.9)
        bg.fillRoundedRect(-60, -18, 120, 36, 10)
        bg.lineStyle(3, 0x374151, 1)
        bg.strokeRoundedRect(-60, -18, 120, 36, 10)
        text.setColor('#ffffff')
      }
    })
  }

  private toggleGameMenu() {
    if (this.menuVisible) {
      this.hideGameMenu()
    } else {
      this.showGameMenu()
    }
  }

  private showGameMenu() {
    if (!this.gameMenu) {
      console.warn('Game menu not created yet')
      return
    }

    this.menuVisible = true
    // Switch menu content depending on game state
    if (this.gameStarted && !this.gameOver) {
      this.startupMenuContainer.setVisible(false)
      this.pauseMenuContainer.setVisible(true)
    } else {
      this.startupMenuContainer.setVisible(true)
      this.pauseMenuContainer.setVisible(false)
    }
    this.gameMenu.setAlpha(0)
    this.gameMenu.setScale(0.8)

    // Animate menu appearance
    this.tweens.add({
      targets: this.gameMenu,
      alpha: 1,
      scale: 1.0,
      duration: 200,
      ease: 'Back.easeOut'
    })

    // Animate background fade in
    this.tweens.add({
      targets: this.menuBackground,
      alpha: 1,
      duration: 200
    })

    console.log('🎮 Game Menu SHOWED')
    
    // Update speed controls to show "CLOSE" on pause button
    this.updateSpeedControls()
  }

  private hideGameMenu() {
    if (!this.gameMenu) {
      console.warn('Game menu not created yet')
      return
    }

    this.menuVisible = false

    // Animate menu disappearance
    this.tweens.add({
      targets: this.gameMenu,
      alpha: 0,
      scale: 0.8,
      duration: 150,
      ease: 'Back.easeIn',
      onComplete: () => {
        // Hide menu completely after animation
        this.gameMenu.setAlpha(0)
        this.gameMenu.setScale(0.8)
      }
    })

    // Animate background fade out
    this.tweens.add({
      targets: this.menuBackground,
      alpha: 0,
      duration: 150
    })

    console.log('🎮 Game Menu HIDDEN')
    
    // Update speed controls to show "PAUSE" on pause button
    this.updateSpeedControls()
  }

  private pauseGame() {
    this.isPaused = true
    this.gameSpeed = 0
    this.scene.pause()
    this.updateSpeedControls()
    console.log('🎮 Game PAUSED')
  }

  private resumeGame() {
    this.isPaused = false
    this.gameSpeed = 1
    this.scene.resume()
    this.updateSpeedControls()
    console.log('▶️ Game RESUMED')
  }

  private setGameSpeed(speed: number) {
    console.log(`🚀 Setting game speed to ${speed}x (current: ${this.gameSpeed})`)
    
    if (speed === 0) {
      this.pauseGame()
      return
    }

    this.isPaused = false
    this.gameSpeed = speed

    // Resume if paused
    if (this.scene.isPaused()) {
      this.scene.resume()
      console.log('🔄 Scene resumed from pause')
    }

    // Set time scale for Phaser timers
    this.time.timeScale = speed
    console.log(`⏱️ Time scale set to ${speed}`)

    this.updateSpeedControls()
    console.log(`⚡ Game speed successfully set to ${speed}x`)
  }

  private updateSpeedControls() {
    // Guard: buttons may not be created yet (e.g., during restart)
    if (!this.speedButtons || this.speedButtons.length === 0) {
      return
    }
    // Update pause button
    const pauseButton = this.speedButtons[0]
    if (!pauseButton || !pauseButton.list || pauseButton.list.length < 3) {
      return
    }
    // Structure: [background, buttonBg, buttonText]
    const pauseBg = pauseButton.list[1] as Phaser.GameObjects.Graphics
    const pauseText = pauseButton.list[2] as Phaser.GameObjects.Text

    if (this.menuVisible) {
      pauseBg.fillStyle(0xff4444) // Red when menu is open
      pauseText.setText('CLOSE')
    } else {
      pauseBg.fillStyle(0x888888) // Gray when menu is closed
      pauseText.setText('PAUSE')
    }
    
    // Redraw the button background
    pauseBg.clear()
    if (this.menuVisible) {
      pauseBg.fillStyle(0xff4444)
    } else {
      pauseBg.fillStyle(0x888888)
    }
    pauseBg.fillRoundedRect(0, 0, 50, 35, 4)
    pauseBg.lineStyle(3, this.menuVisible ? 0xff2222 : 0x666666)
    pauseBg.strokeRoundedRect(0, 0, 50, 35, 4)

    // Update speed buttons - structure: [background, buttonBg, buttonText]
    for (let i = 1; i < this.speedButtons.length; i++) {
      const button = this.speedButtons[i]
      if (!button || !button.list || button.list.length < 3) {
        continue
      }
      const buttonBg = button.list[1] as Phaser.GameObjects.Graphics
      const buttonText = button.list[2] as Phaser.GameObjects.Text

      const speed = [1, 2, 4][i - 1]
      const isActive = this.gameSpeed === speed && !this.isPaused && !this.menuVisible
      
      // Redraw button background with correct color
      buttonBg.clear()
      if (isActive) {
        buttonBg.fillStyle(0x00ff44) // Active speed - bright green
        buttonBg.lineStyle(3, 0x00cc22)
      } else {
        const colors = [0x00aa44, 0x0088aa, 0x4400aa]
        buttonBg.fillStyle(colors[i - 1])
        buttonBg.lineStyle(3, colors[i - 1] - 0x222222)
      }
      buttonBg.fillRoundedRect(0, 0, 50, 35, 4)
      buttonBg.strokeRoundedRect(0, 0, 50, 35, 4)
      
      console.log(`Speed button ${speed}x: active=${isActive}, gameSpeed=${this.gameSpeed}, isPaused=${this.isPaused}`)
    }
  }

  private setupInput() {
    // Click to place towers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't process clicks if menu is visible
      if (this.menuVisible) {
        console.log('Menu is visible - ignoring click')
        return
      }

      // Ignore if clicking over any interactive UI element (towers, buttons, confirm panels)
      // If clicked on a tower, open sell confirm and stop
      const hits = this.input.manager.hitTest(pointer, (this.children as any).list, this.cameras.main) as any[]
      const hitTower = hits.find((o: any) => o && (o as any).isTower)
      if (hitTower) {
        console.log('Clicked on tower - opening sell confirm')
        this.showSellConfirm(hitTower as unknown as Tower)
        return
      }
      // If clicked any other interactive UI, ignore placement
      const overInteractive = hits.some((obj: any) => obj && obj.input && obj.input.enabled)
      if (overInteractive) {
        console.log('Click over interactive object - ignoring tower placement')
        return
      }

      // Check if click is on top panel (speed controls and info)
      if (pointer.y <= TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT) {
        console.log('Click detected on top panel - ignoring for tower placement')
        return
      }

      // Check if click is on bottom UI panel (tower buttons)
      const bottomPanelY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
      const isOnBottomUI = pointer.y > bottomPanelY

      console.log(`Pointer click at ${pointer.x}, ${pointer.y} - Game area: ${TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT}-${bottomPanelY}, isOnBottomUI: ${isOnBottomUI}`)

      if (isOnBottomUI) {
        console.log('Click detected on bottom UI panel - letting button handlers handle it')
        return // Clicked on UI - let button handlers deal with it
      }

      if (this.gameStarted && !this.gameOver) {
        console.log('Click detected on game field - placing tower')
        this.placeTower(pointer.x, pointer.y)
      }
    })

    // Mouse move for tower preview
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Don't show tower preview if menu is visible
      if (this.menuVisible) {
        return
      }

      // Show tower preview only in game area (between top and bottom panels)
      const gameAreaTop = TOWER_DEFENSE_CONFIG.UI.TOP_PANEL_HEIGHT
      const gameAreaBottom = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - TOWER_DEFENSE_CONFIG.UI.BOTTOM_PANEL_HEIGHT
      
      if (this.gameStarted && !this.gameOver && 
          pointer.y > gameAreaTop && pointer.y < gameAreaBottom) {
        this.updateTowerPreview(pointer.x, pointer.y)
      }
    })
  }

  private setupWaveManager() {
    this.waveManager = new WaveManager(this)
  }

  private setupEventListeners() {
    // Enemy events
    this.events.on('enemy-killed', (reward: number) => {
      // Scale reward by difficulty (less money on higher difficulties)
      const mul = this.difficulty === 'EASY' ? 1.0 : this.difficulty === 'NORMAL' ? 0.8 : 0.6
      this.playerMoney += Math.max(0, Math.floor(reward * mul))
      this.updateUI()
    })
    
    this.events.on('enemy-reached-end', (damage: number) => {
      this.playerHealth -= damage
      this.updateUI()
      
      if (this.playerHealth <= 0) {
        this.gameOver = true
        this.showGameOver()
      }
    })
    
    // Projectile events
    this.events.on('projectile-created', (projectile: Projectile) => {
      this.projectiles.push(projectile)
    })

    // Tower sell request (right-click on tower) -> show confirmation
    this.events.on('tower-sell-request', (tower: Tower) => {
      this.showSellConfirm(tower)
    })
    
    // Wave events
    this.events.on('wave-started', (waveNumber: number) => {
      console.log(`Wave ${waveNumber} started!`)
      // Update obstacles visibility for current wave (free 10% each wave)
      this.updateObstaclesForWave(waveNumber)
      this.updateUI()
    })

    this.events.on('wave-completed', (waveNumber: number) => {
      console.log(`Wave ${waveNumber} completed!`)
      this.updateUI()
    })

    // Preparation phase before next wave -> show brief message with time left
    this.events.on('wave-preparation', (ms: number) => {
      const secs = Math.ceil(ms / 1000)
      this.showMessage(`Next wave in ${secs}s`, '#ffe66d')
    })

    // All waves completed -> show congratulations + replay CTA
    this.events.on('all-waves-completed', (totalWaves: number) => {
      this.gameOver = true
      const cx = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2
      const cy = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT / 2
      const msg = this.add.text(cx, cy - 20, `VICTORY!\n\nYou defended ${totalWaves} waves!`, {
        fontSize: '36px',
        color: '#00ff88',
        fontFamily: 'Arial Black',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(300)
      // Subtle celebratory tween
      this.tweens.add({ targets: msg, scale: 1.1, yoyo: true, repeat: 6, duration: 150 })
      // CTA: Play again button
      const btn = this.add.container(cx, cy + 80)
      const g = this.add.graphics()
      g.fillStyle(0x22c55e, 1)
      g.fillRoundedRect(-110, -28, 220, 56, 12)
      g.lineStyle(3, 0x16a34a, 1)
      g.strokeRoundedRect(-110, -28, 220, 56, 12)
      const t = this.add.text(0, 0, 'PLAY AGAIN', { fontSize: '22px', color: '#000000', fontFamily: 'Arial Black' }).setOrigin(0.5)
      btn.add([g, t])
      btn.setSize(220, 56)
      btn.setInteractive(new Phaser.Geom.Rectangle(-110, -28, 220, 56), Phaser.Geom.Rectangle.Contains)
      // Make background graphic itself interactive across full area
      g.setInteractive(new Phaser.Geom.Rectangle(-110, -28, 220, 56), Phaser.Geom.Rectangle.Contains)
      const doPlayAgain = (event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        this.scene.restart()
      }
      btn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doPlayAgain(event))
      g.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => doPlayAgain(event))
      // Hover feedback
      btn.on('pointerover', () => {
        g.lineStyle(4, 0xffff00)
        g.strokeRoundedRect(-110, -28, 220, 56, 12)
      })
      btn.on('pointerout', () => {
        g.lineStyle(3, 0x16a34a, 1)
        g.strokeRoundedRect(-110, -28, 220, 56, 12)
      })
      btn.setDepth(300)
    })

    this.events.on('wave-ready', () => {
      console.log('Wave ready - auto-starting next wave')
      // Auto-start next wave after delay (not immediately to avoid infinite loop)
      this.time.delayedCall(2000, () => {
        if (!this.gameOver && !this.waveManager.isWaveActive()) {
          this.waveManager.forceStartNextWave()
        }
      })
    })
  }


  private startGame() {
    if (this.gameStarted) return
    
    this.gameStarted = true
    console.log('Tower Defense game started!')
  }

  private startNextWave() {
    console.log('Start Wave button pressed!')
    console.log(`Game started: ${this.gameStarted}, Game over: ${this.gameOver}, Wave active: ${this.waveManager.isWaveActive()}`)

    if (!this.gameStarted) {
      console.log('Starting game...')
      this.startGame()
    }

    if (!this.gameOver && !this.waveManager.isWaveActive()) {
      console.log('Starting next wave...')
      // Inform wave manager about difficulty scaling if it supports it via scene state
      // We keep logic here minimal; wave manager can read scene.difficulty
      this.waveManager.forceStartNextWave()
    } else {
      console.log('Cannot start wave - conditions not met')
    }
  }

  // Gentle inline confirmation near the tower
  private showSellConfirm(tower: Tower) {
    const refund = Math.floor(tower.cost * 0.2)
    const padding = 8
    const width = 140
    const height = 56

    const container = this.add.container(tower.x, tower.y - 40)
    container.setDepth(260)

    // Background panel
    const bg = this.add.graphics()
    bg.fillStyle(0x1f2937, 0.95)
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8)
    bg.lineStyle(2, 0x374151, 1)
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8)
    container.add(bg)

    // Make whole panel interactive to catch clicks and block placement
    container.setSize(width, height)
    container.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains)
    container.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
    })

    // Text
    const text = this.add.text(0, -8, `Sell for $${refund}?`, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial Black'
    }).setOrigin(0.5)
    container.add(text)

    // Buttons
    const btnW = 50, btnH = 20

    const makeButton = (label: string, x: number, onClick: () => void, color: number) => {
      const button = this.add.container(x, 14)
      const g = this.add.graphics()
      g.fillStyle(color, 1)
      g.fillRoundedRect(-btnW/2, -btnH/2, btnW, btnH, 6)
      g.lineStyle(2, 0x111827, 1)
      g.strokeRoundedRect(-btnW/2, -btnH/2, btnW, btnH, 6)
      const t = this.add.text(0, 0, label, { fontSize: '12px', color: '#000000', fontFamily: 'Arial Black' }).setOrigin(0.5)
      button.add([g, t])
      button.setSize(btnW, btnH)
      button.setInteractive(new Phaser.Geom.Rectangle(-btnW/2, -btnH/2, btnW, btnH), Phaser.Geom.Rectangle.Contains)
      // Also make the graphic itself interactive so the whole colored area is clickable
      g.setInteractive(new Phaser.Geom.Rectangle(-btnW/2, -btnH/2, btnW, btnH), Phaser.Geom.Rectangle.Contains)
      button.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        onClick()
      })
      g.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        onClick()
      })
      return button
    }

    const confirm = makeButton('Sell', -34, () => {
      // Remove tower and refund
      this.towers = this.towers.filter(t => t !== tower)
      tower.destroy()
      this.playerMoney += refund
      this.updateUI()
      this.showMessage(`Sold for $${refund}`, '#4ecdc4')
      container.destroy()
    }, 0x34d399)

    const cancel = makeButton('Cancel', 34, () => {
      container.destroy()
    }, 0xfca5a5)

    container.add([confirm, cancel])

    // Close on outside click
    const closeOnOutside = (pointer: Phaser.Input.Pointer) => {
      const worldPoint = new Phaser.Math.Vector2(pointer.x, pointer.y)
      const local = container.getBounds()
      if (!Phaser.Geom.Rectangle.Contains(local, worldPoint.x, worldPoint.y)) {
        container.destroy()
        this.input.off('pointerdown', closeOnOutside)
      }
    }
    this.input.once('pointerdown', closeOnOutside)
  }

  private selectTowerType(towerType: TowerType) {
    console.log(`Selecting tower type: ${towerType} (was: ${this.selectedTowerType})`)
    this.selectedTowerType = towerType
    this.updateTowerButtons()
    console.log(`Tower type changed to: ${this.selectedTowerType}`)
  }

  private updateTowerButtons() {
    console.log(`Updating tower buttons. Selected: ${this.selectedTowerType}, Money: $${this.playerMoney}`)
    Object.entries(this.towerButtons).forEach(([towerType, button]) => {
      const isSelected = towerType === this.selectedTowerType
      const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[towerType as TowerType]
      // Calculate dynamic cost preview
      const placed = this.towersPlacedByType[towerType as TowerType]
      const growth = this.difficulty === 'EASY' ? 0.10 : this.difficulty === 'NORMAL' ? 0.18 : 0.25
      const dynamicCost = Math.floor(config.cost * Math.pow(1 + growth, placed))
      const canAfford = this.playerMoney >= dynamicCost
      console.log(`  ${towerType}: selected=${isSelected}, canAfford=${canAfford}, cost=$${config.cost}`)
      
      // Update button appearance
      const buttonBg = button.list[0] as Phaser.GameObjects.Graphics
      buttonBg.clear()
      buttonBg.fillStyle(isSelected ? 0x4a5568 : 0x2d3748)
      buttonBg.fillRoundedRect(0, 0, TOWER_DEFENSE_CONFIG.UI.BUTTON_WIDTH, TOWER_DEFENSE_CONFIG.UI.BUTTON_HEIGHT, 5)
      buttonBg.lineStyle(2, isSelected ? 0x00ff88 : 0x4a5568)
      buttonBg.strokeRoundedRect(0, 0, TOWER_DEFENSE_CONFIG.UI.BUTTON_WIDTH, TOWER_DEFENSE_CONFIG.UI.BUTTON_HEIGHT, 5)
      
      // Update cost text color
      const costText = button.list[2] as Phaser.GameObjects.Text
      costText.setColor(canAfford ? '#51cf66' : '#ff6b6b')
      costText.setText(`$${dynamicCost}`)
    })
  }

  private onTowerButtonHover(button: Phaser.GameObjects.Container, isHover: boolean) {
    const scale = isHover ? 1.05 : 1
    this.tweens.add({
      targets: button,
      scaleX: scale,
      scaleY: scale,
      duration: 100
    })
  }

  private placeTower(x: number, y: number) {
    const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[this.selectedTowerType]
    // Dynamic pricing per difficulty and number of towers of this type
    const placed = this.towersPlacedByType[this.selectedTowerType]
    const diff = this.difficulty
    const growth = diff === 'EASY' ? 0.10 : diff === 'NORMAL' ? 0.18 : 0.25
    const dynamicCost = Math.floor(config.cost * Math.pow(1 + growth, placed))
    
    // Check if player has enough money
    if (this.playerMoney < dynamicCost) {
      this.showMessage('Not enough money!', '#ff6b6b')
      return
    }
    
    // Snap to grid
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    const gridX = Math.floor(x / gridSize) * gridSize + gridSize / 2
    const gridY = Math.floor(y / gridSize) * gridSize + gridSize / 2
    
    // Check if position is valid (not on path, not occupied)
    if (!this.isValidTowerPosition(gridX, gridY)) {
      this.showMessage('Cannot place tower here!', '#ff6b6b')
      return
    }
    
    // Create tower
    const tower = new Tower(this, gridX, gridY, this.selectedTowerType)
    this.towers.push(tower)
    
    // Deduct money
    this.playerMoney -= dynamicCost
    this.towersPlacedByType[this.selectedTowerType]++
    this.updateUI()
    
    this.showMessage(`${config.name} placed for $${dynamicCost}!`, '#51cf66')
  }

  private isValidTowerPosition(x: number, y: number): boolean {
    // Check if position is on the path
    const pathWidth = TOWER_DEFENSE_CONFIG.PATH_WIDTH
    
    for (let i = 0; i < this.pathSegments.length; i++) {
      const s = this.pathSegments[i]
      const distance = this.distanceToLineSegment(x, y, s.x1, s.y1, s.x2, s.y2)
      if (distance < pathWidth / 2 + 5) {
        return false // Too close to path (reduced buffer from 20 to 5)
      }
    }
    
    // Check dynamic obstacles (blocked cells for current wave)
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    const col = Math.floor(x / gridSize)
    const row = Math.floor(y / gridSize)
    if (this.blockedCells.has(`${col},${row}`)) {
      return false
    }

    // Check if position is occupied by another tower
    for (const tower of this.towers) {
      const distance = Phaser.Math.Distance.Between(x, y, tower.x, tower.y)
      if (distance < 30) {
        return false // Too close to another tower
      }
    }
    
    return true
  }

  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1))
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)))
    const projX = x1 + t * dx
    const projY = y1 + t * dy
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY))
  }

  private updateTowerPreview(x: number, y: number) {
    if (this.towerPreview) this.towerPreview.destroy()
    if (this.previewRange) this.previewRange.destroy()
    
    const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[this.selectedTowerType]
    const canAfford = this.playerMoney >= config.cost
    
    if (!canAfford) return
    
    // Snap to grid
    const gridSize = TOWER_DEFENSE_CONFIG.GRID_SIZE
    const gridX = Math.floor(x / gridSize) * gridSize + gridSize / 2
    const gridY = Math.floor(y / gridSize) * gridSize + gridSize / 2
    
    this.towerPreview = this.add.graphics()
    this.towerPreview.setDepth(50)
    
    const isValid = this.isValidTowerPosition(gridX, gridY)
    const alpha = isValid ? 0.7 : 0.3
    const color = isValid ? config.color : 0xff0000
    
    this.drawTowerPreview(this.towerPreview, this.selectedTowerType, gridX, gridY, color)
    this.towerPreview.setAlpha(alpha)

    // Draw preview range circle at the placement position
    this.previewRange = this.add.graphics()
    this.previewRange.setDepth(49)
    this.previewRange.lineStyle(2, isValid ? 0x00ff00 : 0xff0000, 0.6)
    this.previewRange.strokeCircle(gridX, gridY, config.range)
    this.previewRange.setAlpha(alpha)
  }

  private showMessage(text: string, color: string) {
    const messageText = this.add.text(
      TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
      100,
      text,
      {
        fontSize: '20px',
        color: color,
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5).setDepth(150)
    
    this.tweens.add({
      targets: messageText,
      y: 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => messageText.destroy()
    })
  }

  private updateUI() {
    this.healthText.setText(`❤️ ${this.playerHealth}`)
    this.moneyText.setText(`💰 $${this.playerMoney}`)
    this.waveText.setText(`🌊 Wave ${this.waveManager.getCurrentWave()}/10`)
    this.updateTowerButtons()
    this.updateSpeedControls()
    console.log(`UI updated: Health=${this.playerHealth}, Money=$${this.playerMoney}, Wave=${this.waveManager.getCurrentWave()}`)
  }

  private showGameOver() {
    const centerX = TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2
    const centerY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT / 2

    // Reset game speed to normal
    this.gameSpeed = 1
    this.isPaused = false
    this.time.timeScale = 1
    this.updateSpeedControls()

    const gameOverText = this.add.text(centerX, centerY,
      `GAME OVER\n\nWave Reached: ${this.waveManager.getCurrentWave()}\n\nClick to restart`, {
      fontSize: '32px',
      color: '#ff6b6b',
      fontFamily: 'Arial Black',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(200)

    gameOverText.setInteractive()
    gameOverText.on('pointerdown', () => {
      this.scene.restart()
    })
  }

  update() {
    if (!this.gameStarted || this.gameOver || this.menuVisible || this.isPaused) return

    // Calculate modified delta based on game speed
    const modifiedDelta = this.game.loop.delta * this.gameSpeed

    // Update wave manager with speed modifier
    this.waveManager.update(modifiedDelta)

    // Update towers
    const enemies = this.waveManager.getEnemies()
    this.towers.forEach(tower => {
      tower.update(enemies, modifiedDelta)
    })

    // Update projectiles with modified delta
    this.projectiles = this.projectiles.filter(projectile => {
      if (projectile.active) {
        projectile.update(modifiedDelta)
        return true
      } else {
        return false
      }
    })
  }
}
