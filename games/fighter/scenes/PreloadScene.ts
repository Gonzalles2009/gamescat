import * as Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // Create loading bar
    this.createLoadingBar()
    
    // Load demo sprites (Phaser public assets)
    this.load.spritesheet('fighter1', 'https://labs.phaser.io/assets/sprites/dude.png', {
      frameWidth: 32,
      frameHeight: 48
    })
    this.load.spritesheet('fighter2', 'https://labs.phaser.io/assets/sprites/dude.png', {
      frameWidth: 32,
      frameHeight: 48
    })
    
    // In a real game, you would load sprite sheets like this:
    // this.load.spritesheet('fighter1', 'games/fighter/sprites/fighter1.png', {
    //   frameWidth: 64,
    //   frameHeight: 64
    // })
  }

  private createLoadingBar() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Loading bar background
    const loadingBar = this.add.graphics()
    const loadingFrame = this.add.graphics()
    
    loadingFrame.lineStyle(2, 0x00ff00)
    loadingFrame.strokeRect(width / 2 - 160, height / 2 - 15, 320, 30)
    
    // Loading text
    this.add.text(width / 2, height / 2 - 50, 'Loading Fighter Game...', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: 'monospace'
    }).setOrigin(0.5)
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      loadingBar.clear()
      loadingBar.fillStyle(0x00ff00)
      loadingBar.fillRect(width / 2 - 158, height / 2 - 13, 316 * value, 26)
    })
    
    this.load.on('complete', () => {
      loadingBar.destroy()
      loadingFrame.destroy()
    })
  }

  // Placeholder generator kept for reference (unused when demo sprites are loaded)
  private createPlaceholderAssets() {}

  private createColoredTexture(key: string, width: number, height: number, color: number) {
    console.log(`Creating texture: ${key}, size: ${width}x${height}, color: #${color.toString(16).padStart(6, '0')}`)
    
    const canvas = this.textures.createCanvas(key, width, height)
    if (canvas) {
      const ctx = canvas.context
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(0, 0, width, height)
      
      // Add border for visibility
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, width-2, height-2)
      
      canvas.refresh()
      console.log(`Texture ${key} created successfully`)
    } else {
      console.error(`Failed to create canvas for ${key}`)
    }
  }


  create() {
    // Start the main game scene
    this.scene.start('GameScene')
  }
}




