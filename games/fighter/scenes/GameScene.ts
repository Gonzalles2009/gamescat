import * as Phaser from 'phaser'
import { Fighter } from '../entities/Fighter'
import { GAME_CONFIG } from '../config/GameConfig'

export class GameScene extends Phaser.Scene {
  private player1!: Fighter
  private player2!: Fighter
  private ground!: Phaser.GameObjects.Rectangle
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: { [key: string]: Phaser.Input.Keyboard.Key }
  private player1Keys!: { [key: string]: Phaser.Input.Keyboard.Key }
  private player2Keys!: { [key: string]: Phaser.Input.Keyboard.Key }
  private gameStarted = false
  
  // UI Elements
  private uiContainer!: Phaser.GameObjects.Container
  private roundText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private p1NameText!: Phaser.GameObjects.Text
  private p2NameText!: Phaser.GameObjects.Text
  private p1RoundIndicators: Phaser.GameObjects.Graphics[] = []
  private p2RoundIndicators: Phaser.GameObjects.Graphics[] = []
  private roundTimer: number = 99
  private currentRound: number = 1
  private roundOver: boolean = false
  private overlayText?: Phaser.GameObjects.Text
  private gameMode: 'PVP' | 'PVE' = 'PVP'
  private menuContainer?: Phaser.GameObjects.Container
  private botNextActionAt: number = 0

  private getDisplayName(playerId: number): string {
    if (playerId === 1) return 'PLAYER 1'
    return this.gameMode === 'PVE' ? 'BOT' : 'PLAYER 2'
  }

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.setupBackground()
    this.setupGround()
    this.setupPlayers()
    this.setupInput()
    this.setupUI()
    this.setupCollisions()
    
    // Create all combat animations
    this.createCombatAnimations()
    
    this.showMainMenu()

    // Listen for KO events from fighters
    this.events.on('round-ko', (winnerId: number) => {
      if (this.roundOver) return
      this.roundOver = true
      // Freeze players
      this.player1.setVelocity(0, 0)
      this.player2.setVelocity(0, 0)
      this.player1.setActive(false)
      this.player2.setActive(false)

      if (winnerId === 1) {
        this.player1.roundWins++
      } else if (winnerId === 2) {
        this.player2.roundWins++
      }
      
      // Consistent round banner with proper name
      this.setOverlayText(`ROUND ${this.currentRound}: ${this.getDisplayName(winnerId)} WINS!`)

      this.time.delayedCall(1000, () => {
        this.checkMatchEnd()
      })
    })
  }

  private setOverlayText(message: string, durationMs: number = 1500) {
    if (this.overlayText) {
      this.overlayText.destroy()
      this.overlayText = undefined
    }
    this.overlayText = this.add.text(
      GAME_CONFIG.SCREEN_WIDTH / 2,
      GAME_CONFIG.SCREEN_HEIGHT / 2,
      message,
      {
        fontSize: '36px',
        color: '#FFD700',
        fontFamily: 'Arial Black',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(200)

    this.tweens.add({
      targets: this.overlayText,
      scale: { from: 0.9, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Back.easeOut'
    })

    if (durationMs > 0) {
      this.time.delayedCall(durationMs, () => {
        if (this.overlayText) {
          this.overlayText.destroy()
          this.overlayText = undefined
        }
      })
    }
  }

  private setupBackground() {
    // Create gradient background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x001122, 0x001122, 0x334455, 0x334455)
    bg.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT)
    bg.setDepth(0)
  }

  private setupGround() {
    // Create visible ground rectangle - верх полосы точно на GROUND_Y
    this.ground = this.add.rectangle(
      GAME_CONFIG.SCREEN_WIDTH / 2,
      GAME_CONFIG.GROUND_Y, // Центр прямоугольника на уровне земли
      GAME_CONFIG.SCREEN_WIDTH,
      100, // Увеличу толщину для лучшего вида
      0x4a5568
    )
    
    // Сдвинуть anchor point наверх, чтобы верх полосы был на GROUND_Y
    this.ground.setOrigin(0.5, 0) // origin: center horizontally, top vertically
    
    // Add physics body to ground
    this.physics.add.existing(this.ground, true) // true = static body
    this.ground.setDepth(1)
  }

  private setupPlayers() {
    console.log('Setting up players...')

    // Create Player 1 (right side) - arrows control
    // Start above ground, let physics handle falling to ground
    this.player1 = new Fighter(
      this,
      GAME_CONFIG.SCREEN_WIDTH - 250,
      200, // Start high, will fall to ground with physics
      'fighter1',
      1,
      0x0066cc
    )

    // Create Player 2 (left side) - WASD control  
    // Start above ground, let physics handle falling to ground
    this.player2 = new Fighter(
      this,
      250,
      200, // Start high, will fall to ground with physics
      'fighter2', 
      2,
      0xcc0066
    )

    // Set opponents
    this.player1.setOpponent(this.player2)
    this.player2.setOpponent(this.player1)

    // Force initial facing update
    this.updateFighterFacing(this.player1)
    this.updateFighterFacing(this.player2)
    
    console.log('Players setup complete')
  }

  private updateFighterFacing(fighter: Fighter) {
    if (!fighter.opponent) return
    
    if (fighter.opponent.x > fighter.x && !fighter.facingRight) {
      fighter.facingRight = true
      fighter.setFlipX(true) // Flip to face right
    } else if (fighter.opponent.x < fighter.x && fighter.facingRight) {
      fighter.facingRight = false
      fighter.setFlipX(false) // No flip = face left (default)
    }
    
  }

  private setupInput() {
    // Cursor keys for Player 1
    this.cursors = this.input.keyboard!.createCursorKeys()
    
    // WASD for Player 2
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D') as { [key: string]: Phaser.Input.Keyboard.Key }
    
    // Attack keys for Player 1
    this.player1Keys = this.input.keyboard!.addKeys('J,K,L') as { [key: string]: Phaser.Input.Keyboard.Key }
    
    // Attack keys for Player 2
    this.player2Keys = this.input.keyboard!.addKeys('U,I,O') as { [key: string]: Phaser.Input.Keyboard.Key }
    
    // Game control keys
    const spaceKey = this.input.keyboard!.addKey('SPACE')
    const rKey = this.input.keyboard!.addKey('R')
    
    spaceKey.on('down', () => {
      console.log('Space key pressed! Game started:', this.gameStarted)
      if (!this.gameStarted) {
        this.startGame()
      }
    })
    
    rKey.on('down', () => {
      this.restartRound()
    })
  }

  private setupUI() {
    // Create main UI container
    this.uiContainer = this.add.container(0, 0)
    this.uiContainer.setDepth(100)
    
    // Create top UI panel background
    const uiPanel = this.add.graphics()
    uiPanel.fillStyle(0x000000, 0.8)
    uiPanel.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, 120)
    uiPanel.lineStyle(2, 0x444444)
    uiPanel.strokeRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, 120)
    this.uiContainer.add(uiPanel)
    
    // Timer and round display
    this.createCenterUI()
    
    // Player 1 UI (Right side) - Player 1 стоит справа
    this.createPlayerUI(this.player1, false)
    
    // Player 2 UI (Left side) - Player 2 стоит слева
    this.createPlayerUI(this.player2, true)
    
    // Start timer countdown
    this.startRoundTimer()
  }

  private createCenterUI() {
    const centerX = GAME_CONFIG.SCREEN_WIDTH / 2
    
    // Round display with background
    const roundBg = this.add.graphics()
    roundBg.fillStyle(0x222222, 0.9)
    roundBg.fillRoundedRect(centerX - 80, 15, 160, 35, 5)
    roundBg.lineStyle(2, 0xFFD700)
    roundBg.strokeRoundedRect(centerX - 80, 15, 160, 35, 5)
    this.uiContainer.add(roundBg)
    
    this.roundText = this.add.text(centerX, 32, `ROUND ${this.currentRound}`, {
      fontSize: '18px',
      color: '#FFD700',
      fontFamily: 'Arial Black',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.uiContainer.add(this.roundText)
    
    // Timer
    this.timerText = this.add.text(centerX, 70, '99', {
      fontSize: '32px',
      color: '#FF4444',
      fontFamily: 'Arial Black',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)
    this.uiContainer.add(this.timerText)
  }

  private createPlayerUI(fighter: Fighter, isLeftSide: boolean) {
    const isP1 = fighter.playerId === 1
    const baseX = isLeftSide ? 20 : GAME_CONFIG.SCREEN_WIDTH - 20
    const healthBarX = isLeftSide ? 120 : GAME_CONFIG.SCREEN_WIDTH - 320
    
    // Character portrait
    const portrait = this.add.graphics()
    portrait.fillStyle(isP1 ? 0x0066cc : 0xcc0066, 1)
    portrait.fillRoundedRect(isLeftSide ? 20 : GAME_CONFIG.SCREEN_WIDTH - 80, 20, 60, 60, 8)
    portrait.lineStyle(3, 0xFFFFFF)
    portrait.strokeRoundedRect(isLeftSide ? 20 : GAME_CONFIG.SCREEN_WIDTH - 80, 20, 60, 60, 8)
    this.uiContainer.add(portrait)
    fighter.portrait = portrait
    
    // Player name
    const nameText = this.add.text(
      isLeftSide ? 90 : GAME_CONFIG.SCREEN_WIDTH - 90, 
      25, 
      isP1 ? 'PLAYER 1' : (this.gameMode === 'PVE' ? 'BOT' : 'PLAYER 2'), {
      fontSize: '14px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(isLeftSide ? 0 : 1, 0)
    this.uiContainer.add(nameText)
    
    if (isP1) this.p1NameText = nameText
    else this.p2NameText = nameText
    
    // Health bar background
    const healthBg = this.add.graphics()
    healthBg.fillStyle(0x330000)
    healthBg.fillRoundedRect(healthBarX - 2, 43, 204, 18, 3)
    healthBg.lineStyle(2, 0x666666)
    healthBg.strokeRoundedRect(healthBarX - 2, 43, 204, 18, 3)
    this.uiContainer.add(healthBg)
    fighter.healthBarBg = healthBg
    
    // Health bar
    const healthBar = this.add.graphics()
    this.updateHealthBar(fighter, healthBar, healthBarX, 44, 200, 16)
    this.uiContainer.add(healthBar)
    fighter.healthBar = healthBar
    
    // Round win indicators
    this.createRoundIndicators(fighter, isLeftSide)
  }

  private createRoundIndicators(fighter: Fighter, isLeftSide: boolean) {
    const indicators = []
    const startX = isLeftSide ? 120 : GAME_CONFIG.SCREEN_WIDTH - 180
    
    for (let i = 0; i < 2; i++) {
      const indicator = this.add.graphics()
      const x = startX + (i * 25)
      
      indicator.lineStyle(2, 0x666666)
      indicator.strokeCircle(x, 75, 8)
      this.uiContainer.add(indicator)
      indicators.push(indicator)
    }
    
    if (fighter.playerId === 1) {
      this.p1RoundIndicators = indicators
    } else {
      this.p2RoundIndicators = indicators  
    }
  }

  private updateHealthBar(fighter: Fighter, healthBar: Phaser.GameObjects.Graphics, x: number, y: number, maxWidth: number, height: number) {
    healthBar.clear()
    
    const healthPercent = fighter.health / fighter.maxHealth
    const currentWidth = maxWidth * healthPercent
    
    // Health bar gradient effect
    if (healthPercent > 0.6) {
      healthBar.fillStyle(0x00AA00) // Green
    } else if (healthPercent > 0.3) {
      healthBar.fillStyle(0xFFAA00) // Orange
    } else {
      healthBar.fillStyle(0xFF3333) // Red
    }
    
    if (currentWidth > 0) {
      healthBar.fillRoundedRect(x, y, currentWidth, height, 2)
      
      // Add highlight effect
      healthBar.fillStyle(0xFFFFFF, 0.3)
      healthBar.fillRoundedRect(x, y, currentWidth, height / 3, 2)
    }
  }

  private startRoundTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameStarted && this.roundTimer > 0) {
          this.roundTimer--
          this.timerText.setText(this.roundTimer.toString())
          
          if (this.roundTimer <= 10) {
            this.timerText.setColor('#FF0000')
            // Pulsing effect for last 10 seconds
            this.tweens.add({
              targets: this.timerText,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 100,
              yoyo: true
            })
          }
          
          if (this.roundTimer === 0) {
            this.onTimeUp()
          }
        }
      },
      repeat: -1
    })
  }

  private setupCollisions() {
    // Player vs Ground collisions
    this.physics.add.collider(this.player1, this.ground)
    this.physics.add.collider(this.player2, this.ground)
    
    // Player vs Player collision (they can't pass through each other)
    this.physics.add.collider(this.player1, this.player2)
  }

  private showMainMenu(congratsMessage?: string) {
    if (this.overlayText) {
      this.overlayText.destroy()
      this.overlayText = undefined
    }
    const container = this.add.container(0, 0)
    container.setDepth(300)

    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.75)
    panel.fillRect(0, 0, GAME_CONFIG.SCREEN_WIDTH, GAME_CONFIG.SCREEN_HEIGHT)
    container.add(panel)

    const title = this.add.text(
      GAME_CONFIG.SCREEN_WIDTH / 2,
      160,
      'FIGHTER',
      { fontSize: '64px', color: '#FFD700', fontFamily: 'Arial Black', stroke: '#000', strokeThickness: 6 }
    ).setOrigin(0.5)
    container.add(title)

    if (congratsMessage) {
      const congrats = this.add.text(
        GAME_CONFIG.SCREEN_WIDTH / 2,
        220,
        `Congratulations!\n${congratsMessage}`,
        { fontSize: '24px', color: '#FFFFFF', fontFamily: 'Arial Black', align: 'center' }
      ).setOrigin(0.5)
      container.add(congrats)
    } else {
      const subtitle = this.add.text(
        GAME_CONFIG.SCREEN_WIDTH / 2,
        220,
        'Choose Mode',
        { fontSize: '24px', color: '#FFFFFF', fontFamily: 'Arial Black' }
      ).setOrigin(0.5)
      container.add(subtitle)
    }

    const btnStyle = { fontSize: '28px', color: '#111111', backgroundColor: '#FFD700', padding: { x: 18, y: 10 } }
    const btnPvp = this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2, 300, 'Player vs Player', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    const btnPve = this.add.text(GAME_CONFIG.SCREEN_WIDTH / 2, 360, 'Player vs Bot', btnStyle).setOrigin(0.5).setInteractive({ useHandCursor: true })
    container.add(btnPvp)
    container.add(btnPve)

    btnPvp.on('pointerdown', () => {
      this.gameMode = 'PVP'
      container.destroy()
      this.menuContainer = undefined
      this.updateNamesForMode()
      this.showStartMessage()
    })
    btnPve.on('pointerdown', () => {
      this.gameMode = 'PVE'
      container.destroy()
      this.menuContainer = undefined
      this.updateNamesForMode()
      this.showStartMessage()
    })

    this.menuContainer = container
  }

  private showStartMessage() {
    if (this.overlayText) {
      this.overlayText.destroy()
      this.overlayText = undefined
    }
    const startText = this.add.text(
      GAME_CONFIG.SCREEN_WIDTH / 2,
      GAME_CONFIG.SCREEN_HEIGHT / 2,
      `Press SPACE to Start (${this.gameMode})\n\n🥊 CONTROLS 🥊\nP1: Arrows + J/K/L\n${this.gameMode === 'PVP' ? 'P2: WASD + U/I/O' : 'P2: Bot (auto)'}\n\nBlock: HOLD K/I  |  Punch: J/U  |  Kick: L/O`,
      {
        fontSize: '18px',
        color: '#FFD700',
        fontFamily: 'monospace',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5)
    
    // Blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    })
    
    startText.setData('startMessage', true)
  }

  private createCombatAnimations() {
    // Create animations for both fighters
    const fighters = ['fighter1', 'fighter2']
    
    fighters.forEach(fighterKey => {
      // Idle Animation - only use frame 0 for clean idle state
      if (!this.anims.exists(`${fighterKey}-idle`)) {
        this.anims.create({
          key: `${fighterKey}-idle`,
          frames: [
            { key: fighterKey, frame: 0 },
            { key: fighterKey, frame: 0 }
          ],
          frameRate: 4,
          repeat: -1
        })
      }

      // Walking Animation - use frames 1, 2, 3 for walking cycle
      if (!this.anims.exists(`${fighterKey}-walk`)) {
        this.anims.create({
          key: `${fighterKey}-walk`,
          frames: this.anims.generateFrameNumbers(fighterKey, { start: 1, end: 3 }),
          frameRate: 8,
          repeat: -1
        })
      }

      // LIGHT PUNCH - быстрый джеб рукой
      if (!this.anims.exists(`${fighterKey}-light-punch`)) {
        this.anims.create({
          key: `${fighterKey}-light-punch`,
          frames: [
            { key: fighterKey, frame: 0 }, // стойка
            { key: fighterKey, frame: 1 }, // быстрый джеб
            { key: fighterKey, frame: 0 }  // возврат
          ],
          frameRate: 25, // очень быстрая анимация
          repeat: 0
        })
      }

      // BLOCK - защитная стойка (простая статичная)
      if (!this.anims.exists(`${fighterKey}-block`)) {
        this.anims.create({
          key: `${fighterKey}-block`,
          frames: [
            { key: fighterKey, frame: 3 } // только одна защитная поза
          ],
          frameRate: 1, // неподвижная
          repeat: 0 // без повтора
        })
      }

      // KICK - мощный удар ногой с замахом
      if (!this.anims.exists(`${fighterKey}-kick`)) {
        this.anims.create({
          key: `${fighterKey}-kick`,
          frames: [
            { key: fighterKey, frame: 0 }, // стойка
            { key: fighterKey, frame: 1 }, // подготовка
            { key: fighterKey, frame: 2 }, // удар ногой
            { key: fighterKey, frame: 2 }, // удержание удара
            { key: fighterKey, frame: 1 }, // возврат ноги
            { key: fighterKey, frame: 0 }  // стойка
          ],
          frameRate: 14, // средняя скорость
          repeat: 0
        })
      }

      // UPPERCUT - специальная атака
      if (!this.anims.exists(`${fighterKey}-uppercut`)) {
        this.anims.create({
          key: `${fighterKey}-uppercut`,
          frames: [
            { key: fighterKey, frame: 3 }, // crouch wind up
            { key: fighterKey, frame: 1 }, // rising uppercut
            { key: fighterKey, frame: 1 }, // peak
            { key: fighterKey, frame: 0 }  // recovery
          ],
          frameRate: 18,
          repeat: 0
        })
      }

      // SPINNING KICK - эффектная атака
      if (!this.anims.exists(`${fighterKey}-spinning-kick`)) {
        this.anims.create({
          key: `${fighterKey}-spinning-kick`,
          frames: [
            { key: fighterKey, frame: 0 }, // wind up
            { key: fighterKey, frame: 2 }, // spin 1
            { key: fighterKey, frame: 3 }, // spin 2  
            { key: fighterKey, frame: 2 }, // spin 3
            { key: fighterKey, frame: 1 }, // strike
            { key: fighterKey, frame: 0 }  // recovery
          ],
          frameRate: 24,
          repeat: 0
        })
      }

      // POWER PUNCH - самая мощная атака
      if (!this.anims.exists(`${fighterKey}-power-punch`)) {
        this.anims.create({
          key: `${fighterKey}-power-punch`,
          frames: [
            { key: fighterKey, frame: 0 }, // wind up 1
            { key: fighterKey, frame: 0 }, // wind up 2
            { key: fighterKey, frame: 3 }, // charge up
            { key: fighterKey, frame: 3 }, // more charge
            { key: fighterKey, frame: 1 }, // STRIKE!
            { key: fighterKey, frame: 1 }, // hold strike
            { key: fighterKey, frame: 0 }  // recovery
          ],
          frameRate: 10,
          repeat: 0
        })
      }

      // Hit reaction
      if (!this.anims.exists(`${fighterKey}-hit`)) {
        this.anims.create({
          key: `${fighterKey}-hit`,
          frames: [
            { key: fighterKey, frame: 3 }, // recoil
            { key: fighterKey, frame: 0 }  // recover
          ],
          frameRate: 12,
          repeat: 0
        })
      }
    })
  }

  private startGame() {
    console.log('Starting game...')
    this.gameStarted = true
    
    // Remove start message
    this.children.getAll().forEach(child => {
      if (child.getData('startMessage')) {
        child.destroy()
      }
    })
    
    // Enable player controls
    this.player1.setActive(true)
    this.player2.setActive(true)
    
    console.log('Game started! Players activated:', {
      player1Active: this.player1.active,
      player2Active: this.player2.active,
      gameStarted: this.gameStarted
    })
  }

  private restartRound() {
    // Reset player positions and health - let them fall to ground with physics
    this.player1.resetFighter(GAME_CONFIG.SCREEN_WIDTH - 250, 200)
    this.player2.resetFighter(250, 200)
    
    this.gameStarted = false
    this.showStartMessage()
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) return

    // Update players
    this.updatePlayerInput(this.player1, this.cursors, this.player1Keys)
    if (this.gameMode === 'PVP') {
      this.updatePlayerInput(this.player2, this.wasdKeys, this.player2Keys)
    } else {
      this.updateBotAI(this.player2, this.player1)
    }
    
    this.player1.update(time, delta)
    this.player2.update(time, delta)
    
    this.updateUI()
  }

  // Simple bot: keep distance, walk toward opponent, occasional attacks, block randomly
  private updateBotAI(bot: Fighter, target: Fighter) {
    if (!bot.active) return
    const now = this.time.now
    if (now < this.botNextActionAt) return

    const distance = Math.abs(target.x - bot.x)

    // Random short block when very close
    if (distance < 110 && Math.random() < 0.12 && !bot.isBlocking) {
      bot.startBlocking()
      this.time.delayedCall(350, () => bot.stopBlocking())
      this.botNextActionAt = now + 200
      return
    }

    // Maintain preferred range ~100–140
    if (distance > 150) {
      if (target.x > bot.x) bot.moveRight(); else bot.moveLeft()
      this.botNextActionAt = now + 120
      return
    }
    if (distance < 70) {
      if (target.x > bot.x) bot.moveLeft(); else bot.moveRight()
      this.botNextActionAt = now + 120
      return
    }

    // Small chance to jump
    if (Math.random() < 0.05) {
      const body = bot.body as Phaser.Physics.Arcade.Body | null
      if (body && body.touching.down) bot.jump()
      this.botNextActionAt = now + 300
      return
    }

    // In range: choose an attack more often
    if (distance < 140) {
      const r = Math.random()
      if (r < 0.50) {
        bot.lightPunch(); this.botNextActionAt = now + 280 + Math.random()*120; return
      } else if (r < 0.80) {
        bot.kick(); this.botNextActionAt = now + 330 + Math.random()*170; return
      } else if (r < 0.93) {
        bot.uppercut(); this.botNextActionAt = now + 380 + Math.random()*220; return
      } else {
        bot.powerPunch(); this.botNextActionAt = now + 450 + Math.random()*300; return
      }
    }

    // Idle adjust if already in good range
    bot.stopMoving()
    this.botNextActionAt = now + 150
  }

  private updatePlayerInput(
    fighter: Fighter, 
    moveKeys: any, 
    attackKeys: { [key: string]: Phaser.Input.Keyboard.Key }
  ) {
    if (!this.gameStarted) {
      return
    }
    
    if (!fighter.active) {
      return
    }

    // Handle block input FIRST so release is processed even when fighter cannot move
    let isBlockPressed = false
    if (fighter.playerId === 1) {
      isBlockPressed = this.player1Keys.K?.isDown || false
    } else {
      isBlockPressed = this.player2Keys.I?.isDown || false
    }
    const currentlyBlocking = fighter.isBlocking || false
    if (isBlockPressed && !currentlyBlocking) {
      fighter.startBlocking()
    } else if (!isBlockPressed && currentlyBlocking) {
      fighter.stopBlocking()
    }

    // If blocking, force stop movement every frame and skip further input
    if (fighter.isBlocking) {
      fighter.stopMoving()
      return
    }

    // If cannot move for other reasons, skip
    if (!fighter.canMove()) {
      return
    }

    // Movement
    if (moveKeys.left?.isDown || moveKeys.A?.isDown) {
      fighter.moveLeft()
    } else if (moveKeys.right?.isDown || moveKeys.D?.isDown) {
      fighter.moveRight()
    } else {
      fighter.stopMoving()
    }

    // Jump
    const body = fighter.body as Phaser.Physics.Arcade.Body | null
    if ((moveKeys.up?.isDown || moveKeys.W?.isDown) && body && body.touching.down) {
      fighter.jump()
    }

    // Crouch
    if (moveKeys.down?.isDown || moveKeys.S?.isDown) {
      fighter.crouch()
    }

    // Basic Attacks
    if (Phaser.Input.Keyboard.JustDown(attackKeys.J || attackKeys.U)) {
      fighter.lightPunch()
    }

    if (Phaser.Input.Keyboard.JustDown(attackKeys.L || attackKeys.O)) {
      fighter.kick()
    }

    // Special Attacks (combinations)
    // UPPERCUT: Up + Light Punch
    if ((moveKeys.up?.isDown || moveKeys.W?.isDown) && 
        Phaser.Input.Keyboard.JustDown(attackKeys.J || attackKeys.U)) {
      fighter.uppercut()
    }
    
    // SPINNING KICK: Down + Kick  
    if ((moveKeys.down?.isDown || moveKeys.S?.isDown) && 
        Phaser.Input.Keyboard.JustDown(attackKeys.L || attackKeys.O)) {
      fighter.spinningKick()
    }
    
    // POWER PUNCH: Forward + Light Punch  
    if (((fighter.facingRight && (moveKeys.right?.isDown || moveKeys.D?.isDown)) ||
         (!fighter.facingRight && (moveKeys.left?.isDown || moveKeys.A?.isDown))) &&
        Phaser.Input.Keyboard.JustDown(attackKeys.J || attackKeys.U)) {
      fighter.powerPunch()
    }
  }

  private updateUI() {
    // Update health bars with new graphics system
    if (this.player1.healthBar) {
      this.updateHealthBar(this.player1, this.player1.healthBar, GAME_CONFIG.SCREEN_WIDTH - 320, 44, 200, 16)
    }
    
    if (this.player2.healthBar) {
      this.updateHealthBar(this.player2, this.player2.healthBar, 120, 44, 200, 16)
    }
    
    // Update combo displays
    this.updateComboDisplay(this.player1)
    this.updateComboDisplay(this.player2)
    
    // Update round indicators
    this.updateRoundIndicators()
  }

  private updateComboDisplay(fighter: Fighter) {
    if (fighter.currentCombo > 1) {
      if (!fighter.comboText) {
        const x = fighter.playerId === 1 ? 200 : GAME_CONFIG.SCREEN_WIDTH - 200
        fighter.comboText = this.add.text(x, GAME_CONFIG.SCREEN_HEIGHT / 2 - 100, '', {
          fontSize: '24px',
          color: '#FFD700',
          fontFamily: 'Arial Black',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(110)
      }
      
      fighter.comboText.setText(`${fighter.currentCombo} HIT COMBO!`)
      fighter.comboText.setVisible(true)
      
      // Animate combo text
      this.tweens.add({
        targets: fighter.comboText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.time.delayedCall(1500, () => {
            if (fighter.comboText) fighter.comboText.setVisible(false)
          })
        }
      })
    }
  }

  private updateRoundIndicators() {
    // Update Player 1 round wins (справа)
    for (let i = 0; i < this.p1RoundIndicators.length; i++) {
      const indicator = this.p1RoundIndicators[i]
      indicator.clear()
      
      if (i < this.player1.roundWins) {
        indicator.fillStyle(0x00FF00)
        indicator.fillCircle(GAME_CONFIG.SCREEN_WIDTH - 180 + (i * 25), 75, 8)
      } else {
        indicator.lineStyle(2, 0x666666)
        indicator.strokeCircle(GAME_CONFIG.SCREEN_WIDTH - 180 + (i * 25), 75, 8)
      }
    }
    
    // Update Player 2 round wins (слева)
    for (let i = 0; i < this.p2RoundIndicators.length; i++) {
      const indicator = this.p2RoundIndicators[i]
      indicator.clear()
      
      if (i < this.player2.roundWins) {
        indicator.fillStyle(0x00FF00)
        indicator.fillCircle(120 + (i * 25), 75, 8)
      } else {
        indicator.lineStyle(2, 0x666666)
        indicator.strokeCircle(120 + (i * 25), 75, 8)
      }
    }
  }

  private onTimeUp() {
    if (this.roundOver) return
    this.roundOver = true
    // Determine winner by health
    const p1HealthPercent = this.player1.health / this.player1.maxHealth
    const p2HealthPercent = this.player2.health / this.player2.maxHealth
    
    if (p1HealthPercent > p2HealthPercent) {
      this.player1.roundWins++
      this.setOverlayText(`ROUND ${this.currentRound}: ${this.getDisplayName(1)} WINS (TIME)!`)
    } else if (p2HealthPercent > p1HealthPercent) {
      this.player2.roundWins++
      this.setOverlayText(`ROUND ${this.currentRound}: ${this.getDisplayName(2)} WINS (TIME)!`)
    } else {
      // Draw - no one gets the round
      this.setOverlayText(`ROUND ${this.currentRound}: DRAW`)
    }
    
    // Freeze players on time up
    this.player1.setVelocity(0, 0)
    this.player2.setVelocity(0, 0)
    this.player1.setActive(false)
    this.player2.setActive(false)

    this.time.delayedCall(1000, () => {
      this.checkMatchEnd()
    })
  }

  private checkMatchEnd() {
    if (this.player1.roundWins >= 2) {
      this.showMatchEnd(`${this.getDisplayName(1)} WINS!`)
    } else if (this.player2.roundWins >= 2) {
      this.showMatchEnd(`${this.getDisplayName(2)} WINS!`)
    } else {
      // Continue to next round
      this.nextRound()
    }
  }

  private showMatchEnd(message: string) {
    this.setOverlayText(message, 1500)
    this.gameStarted = false

    // After showing winner, go back to main menu (reset match state)
    this.time.delayedCall(1500, () => {
      this.player1.roundWins = 0
      this.player2.roundWins = 0
      this.currentRound = 1
      this.roundOver = false
      this.roundTimer = 99
      this.roundText.setText(`ROUND ${this.currentRound}`)
      this.timerText.setText(this.roundTimer.toString())
      this.timerText.setColor('#FF4444')

      // Reset fighters positions and deactivate
      this.player1.resetFighter(GAME_CONFIG.SCREEN_WIDTH - 250, 200)
      this.player2.resetFighter(250, 200)

      // Open main menu with congrats
      this.showMainMenu(message)
    })
  }

  private nextRound() {
    this.currentRound++
    this.roundTimer = 99
    this.roundText.setText(`ROUND ${this.currentRound}`)
    this.timerText.setColor('#FF4444')
    this.roundOver = false
    
    if (this.overlayText) {
      this.overlayText.destroy()
      this.overlayText = undefined
    }

    // Reset fighters - let them fall to ground with physics
    this.player1.resetFighter(GAME_CONFIG.SCREEN_WIDTH - 250, 200)
    this.player2.resetFighter(250, 200)
    this.updateNamesForMode()
    
    this.gameStarted = false
    this.showStartMessage()
  }

  private updateNamesForMode() {
    if (this.p1NameText) this.p1NameText.setText('PLAYER 1')
    if (this.p2NameText) this.p2NameText.setText(this.gameMode === 'PVE' ? 'BOT' : 'PLAYER 2')
  }
}




