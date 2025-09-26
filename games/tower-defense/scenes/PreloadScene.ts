import * as Phaser from 'phaser'

export class TowerDefensePreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TowerDefensePreloadScene' })
  }

  preload() {
    // Create loading bar
    this.createLoadingBar()
    
    // For now, we're using simple graphics instead of sprites
    // In a real game, you would load actual sprite sheets here:
    
    // this.load.spritesheet('basic-tower', 'games/tower-defense/sprites/basic-tower.png', {
    //   frameWidth: 32,
    //   frameHeight: 32
    // })
    
    // this.load.spritesheet('enemies', 'games/tower-defense/sprites/enemies.png', {
    //   frameWidth: 24,
    //   frameHeight: 24
    // })
    
    // For demo purposes, we'll create placeholder textures
    this.createPlaceholderAssets()
  }

  private createLoadingBar() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Loading bar background
    const loadingBar = this.add.graphics()
    const loadingFrame = this.add.graphics()
    
    loadingFrame.lineStyle(2, 0x00ff88)
    loadingFrame.strokeRect(width / 2 - 160, height / 2 - 15, 320, 30)
    
    // Loading text
    this.add.text(width / 2, height / 2 - 50, 'Loading Tower Defense...', {
      fontSize: '24px',
      color: '#00ff88',
      fontFamily: 'monospace'
    }).setOrigin(0.5)
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      loadingBar.clear()
      loadingBar.fillStyle(0x00ff88)
      loadingBar.fillRect(width / 2 - 158, height / 2 - 13, 316 * value, 26)
    })
    
    this.load.on('complete', () => {
      loadingBar.destroy()
      loadingFrame.destroy()
    })
  }

  private createPlaceholderAssets() {
    // Create simple colored textures for game elements
    
    // Grid tile texture
    this.createColoredTexture('grid-tile', 40, 40, 0x2a2a2a)
    
    // Path tile texture  
    this.createColoredTexture('path-tile', 40, 40, 0x8B4513)
    
    // UI button texture
    this.createColoredTexture('ui-button', 80, 60, 0x4a5568)
    
    // UI panel texture
    this.createColoredTexture('ui-panel', 1200, 100, 0x1a202c)
  }

  private createColoredTexture(key: string, width: number, height: number, color: number) {
    const canvas = this.textures.createCanvas(key, width, height)
    if (canvas) {
      const ctx = canvas.context
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(0, 0, width, height)
      
      // Add subtle border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, width, height)
      
      canvas.refresh()
    }
  }

  create() {
    // Add some intro text
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2
    
    const titleText = this.add.text(centerX, centerY + 50, 'Tower Defense', {
      fontSize: '48px',
      color: '#00ff88',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    
    const instructionText = this.add.text(centerX, centerY + 140, 'Click to place towers • Survive as long as you can', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    // Animate title
    this.tweens.add({
      targets: titleText,
      scale: { from: 0.8, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Start main game scene after a delay
    this.time.delayedCall(2000, () => {
      this.scene.start('TowerDefenseGameScene')
    })
  }
}

