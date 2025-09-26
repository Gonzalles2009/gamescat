import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG, EnemyType } from '../config/TowerDefenseConfig'

export class Enemy extends Phaser.GameObjects.Container {
  public health: number
  public maxHealth: number
  public speed: number
  public reward: number
  public enemyType: EnemyType
  
  private pathIndex: number = 0
  private pathProgress: number = 0
  private sprite: Phaser.GameObjects.Graphics
  private healthBar: Phaser.GameObjects.Graphics
  private path: Phaser.Math.Vector2[]
  private isDead: boolean = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: EnemyType
  ) {
    super(scene, x, y)
    
    const config = TOWER_DEFENSE_CONFIG.ENEMY_TYPES[enemyType]
    
    this.enemyType = enemyType
    this.health = config.health
    this.maxHealth = config.health
    this.speed = config.speed
    this.reward = config.reward
    
    // Create path from config
    this.path = TOWER_DEFENSE_CONFIG.PATH_POINTS.map(point => 
      new Phaser.Math.Vector2(point.x, point.y)
    )
    
    // Create enemy sprite (simple circle for now)
    this.sprite = scene.add.graphics()
    this.add(this.sprite)
    this.redrawSprite() // Use our helper method
    
    // Create health bar
    this.healthBar = scene.add.graphics()
    this.updateHealthBar()
    this.add(this.healthBar)
    
    // Add to scene
    scene.add.existing(this)
    
    // Set initial position to first path point
    if (this.path.length > 0) {
      this.setPosition(this.path[0].x, this.path[0].y)
    }
    
    this.setDepth(5)
  }

  public update(delta: number) {
    if (this.isDead || this.path.length < 2) return
    
    this.moveAlongPath(delta)
  }

  private moveAlongPath(delta: number) {
    if (this.pathIndex >= this.path.length - 1) {
      // Reached the end - damage player base
      this.reachEnd()
      return
    }
    
    const currentPoint = this.path[this.pathIndex]
    const nextPoint = this.path[this.pathIndex + 1]
    
    // Calculate distance to move this frame
    const moveDistance = (this.speed * delta) / 1000
    const segmentLength = Phaser.Math.Distance.Between(
      currentPoint.x, currentPoint.y,
      nextPoint.x, nextPoint.y
    )
    
    // Update progress along current segment
    this.pathProgress += moveDistance / segmentLength
    
    if (this.pathProgress >= 1) {
      // Move to next segment
      this.pathIndex++
      this.pathProgress = 0
      
      if (this.pathIndex >= this.path.length - 1) {
        // Reached the end
        this.setPosition(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y)
        this.reachEnd()
        return
      }
    }
    
    // Interpolate position between current and next point
    const currentSeg = this.path[this.pathIndex]
    const nextSeg = this.path[this.pathIndex + 1]
    
    const newX = Phaser.Math.Interpolation.Linear([currentSeg.x, nextSeg.x], this.pathProgress)
    const newY = Phaser.Math.Interpolation.Linear([currentSeg.y, nextSeg.y], this.pathProgress)
    
    this.setPosition(newX, newY)
  }

  public takeDamage(damage: number, hitColor?: number): boolean {
    if (this.isDead) return false
    
    this.health = Math.max(0, this.health - damage)
    this.updateHealthBar()
    
    // Flash with projectile color when hit (fallback to red)
    this.redrawSprite(hitColor !== undefined ? hitColor : 0xff0000)
    this.scene.time.delayedCall(100, () => {
      if (!this.isDead) {
        this.redrawSprite() // Restore original color
      }
    })
    
    if (this.health <= 0) {
      this.die()
      return true // Enemy killed
    }
    
    return false // Enemy still alive
  }

  private updateHealthBar() {
    this.healthBar.clear()
    
    if (this.health < this.maxHealth) {
      const barWidth = 30
      const barHeight = 4
      const healthPercent = this.health / this.maxHealth
      
      // Background
      this.healthBar.fillStyle(0x000000)
      this.healthBar.fillRect(-barWidth/2, -25, barWidth, barHeight)
      
      // Health
      this.healthBar.fillStyle(healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000)
      this.healthBar.fillRect(-barWidth/2, -25, barWidth * healthPercent, barHeight)
    }
  }

  private die() {
    if (this.isDead) return

    this.isDead = true

    // Create death explosion effect
    const deathEffect = this.scene.add.graphics()
    deathEffect.setDepth(12)
    deathEffect.setPosition(this.x, this.y)

    // Outer explosion ring - stronger
    deathEffect.lineStyle(4, 0xff4444, 0.75)
    deathEffect.strokeCircle(0, 0, 12)

    // Inner explosion fill
    deathEffect.fillStyle(0xff6666, 0.55)
    deathEffect.fillCircle(0, 0, 7)

    // Add death particles - reduced count
    for (let i = 0; i < 2; i++) {
      const particle = this.scene.add.graphics()
      
      // Position particle at enemy location FIRST
      particle.setPosition(this.x, this.y)
      
      particle.fillStyle(0xff8888, 0.7)
      particle.fillCircle(0, 0, 1 + Math.random() * 1) // Smaller particles
      particle.setDepth(13)

      // Calculate controlled spread direction
      const angle = (i / 2) * Math.PI * 2 + Math.random() * 0.5
      const distance = 18 + Math.random() * 12 // Stronger spread
      const finalX = this.x + Math.cos(angle) * distance
      const finalY = this.y + Math.sin(angle) * distance

      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        x: finalX,
        y: finalY,
        scale: 0.3, // Shrink as it moves
        duration: 250 + Math.random() * 100, // Shorter duration
        onComplete: () => particle.destroy()
      })
    }

    // Animate death effect
    this.scene.tweens.add({
      targets: deathEffect,
      alpha: 0,
      scale: 2.2,
      duration: 280,
      onComplete: () => deathEffect.destroy()
    })

    // Death animation for enemy - fade out with explosion
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.3, // Smaller scale increase
      duration: 200,
      onComplete: () => {
        // Emit death event with reward
        this.scene.events.emit('enemy-killed', this.reward)
        this.destroy()
      }
    })
  }

  private reachEnd() {
    if (this.isDead) return
    
    this.isDead = true
    
    // Emit event that enemy reached the end
    this.scene.events.emit('enemy-reached-end', 1) // 1 damage to base
    
    // Simple fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy()
      }
    })
  }

  public getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y)
  }

  public isAlive(): boolean {
    return !this.isDead && this.health > 0
  }

  private redrawSprite(overrideColor?: number): void {
    const config = TOWER_DEFENSE_CONFIG.ENEMY_TYPES[this.enemyType]
    const color = overrideColor !== undefined ? overrideColor : config.color
    
    this.sprite.clear()
    this.sprite.fillStyle(color)
    this.sprite.fillCircle(0, 0, config.size)
    this.sprite.lineStyle(2, 0x000000)
    this.sprite.strokeCircle(0, 0, config.size)
  }
}
