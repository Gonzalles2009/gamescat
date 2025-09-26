import * as Phaser from 'phaser'
import { Enemy } from './Enemy'
import { TowerType } from '../config/TowerDefenseConfig'

export class Projectile extends Phaser.GameObjects.Graphics {
  private target: Enemy
  private damage: number
  private speed: number
  private towerType: TowerType
  private isActive: boolean = true
  private projectileColor: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    speed: number,
    towerType: TowerType
  ) {
    super(scene, { x, y })
    
    this.target = target
    this.damage = damage
    this.speed = speed
    this.towerType = towerType
    this.projectileColor = this.getProjectileColor()
    
    // Create projectile visual based on tower type
    this.createProjectileVisual()
    
    // Add to scene
    scene.add.existing(this)
    this.setDepth(8)
  }

  private createProjectileVisual(): void {
    this.clear()
    
    switch (this.towerType) {
      case 'BASIC':
        // Small yellow bullet
        this.fillStyle(this.projectileColor)
        this.fillCircle(0, 0, 3)
        this.lineStyle(1, 0x000000)
        this.strokeCircle(0, 0, 3)
        break
        
      case 'CANNON':
        // Larger red cannonball
        this.fillStyle(this.projectileColor)
        this.fillCircle(0, 0, 5)
        this.lineStyle(1, 0x000000)
        this.strokeCircle(0, 0, 5)
        break
        
      case 'LASER':
        // Blue energy bolt
        this.fillStyle(this.projectileColor)
        this.fillRect(-2, -8, 4, 16)
        this.lineStyle(1, 0x0088ff)
        this.strokeRect(-2, -8, 4, 16)
        break
    }
  }

  private getProjectileColor(): number {
    switch (this.towerType) {
      case 'BASIC':
        return 0xffff66
      case 'CANNON':
        return 0xff6633
      case 'LASER':
        return 0x66e0ff
      default:
        return 0xffffff
    }
  }

  public update(delta: number): void {
    if (!this.isActive || !this.target || !this.target.isAlive()) {
      this.explode()
      return
    }
    
    // Move towards target
    const targetPos = this.target.getPosition()
    const currentPos = new Phaser.Math.Vector2(this.x, this.y)
    
    // Calculate direction to target
    const direction = targetPos.clone().subtract(currentPos).normalize()
    
    // Move projectile
    const moveDistance = (this.speed * delta) / 1000
    const newPos = currentPos.add(direction.scale(moveDistance))
    
    this.setPosition(newPos.x, newPos.y)
    
    // Rotate projectile to face movement direction (for laser)
    if (this.towerType === 'LASER') {
      this.setRotation(direction.angle() + Math.PI / 2)
    }
    
    // Check if we hit the target
    const distanceToTarget = Phaser.Math.Distance.Between(
      this.x, this.y, 
      targetPos.x, targetPos.y
    )
    
    if (distanceToTarget < 10) {
      this.hitTarget()
    }
    
    // Remove projectile if it goes off screen
    if (this.x < -50 || this.x > 1250 || this.y < -50 || this.y > 850) {
      this.explode()
    }
  }

  private hitTarget(): void {
    if (!this.isActive || !this.target) return
    
    this.isActive = false
    
    // Deal damage to target
    const killed = this.target.takeDamage(this.damage, this.projectileColor)
    
    // Create hit effect
    this.createHitEffect(killed)
    
    // Destroy projectile
    this.destroy()
  }

  private createHitEffect(enemyKilled: boolean): void {
    // Use projectile color for hits; if enemy killed, tint slightly redder
    const baseColor = this.projectileColor
    const effectColor = enemyKilled ? 0xff2222 : baseColor
    const effectSize = enemyKilled ? 16 : 12  // Stronger size

    // Use target's position instead of projectile's position
    const effectX = this.target.x
    const effectY = this.target.y

    // Create explosion effect with ring (anchor graphics at hit position)
    const explosion = this.scene.add.graphics()
    explosion.setDepth(12)
    explosion.setPosition(effectX, effectY)

    // Outer ring - centered at local (0,0)
    explosion.lineStyle(4, effectColor, 0.95)
    explosion.strokeCircle(0, 0, effectSize + 2)

    // Inner fill - centered at local (0,0)
    explosion.fillStyle(effectColor, 0.75)
    explosion.fillCircle(0, 0, effectSize)

    // Add sparkle effect
    for (let i = 0; i < 5; i++) {
      const sparkle = this.scene.add.graphics()
      // Anchor sparkle graphics at hit position and draw locally
      sparkle.setPosition(effectX, effectY)
      sparkle.fillStyle(effectColor, 0.8)
      sparkle.fillCircle(
        (Math.random() - 0.5) * effectSize,
        (Math.random() - 0.5) * effectSize,
        2.5
      )
      sparkle.setDepth(13)

      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: 0.6,
        duration: 130,
        onComplete: () => sparkle.destroy()
      })
    }

    // Animate explosion
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2.2, // Stronger expansion
      duration: 250, // Slightly longer
      onComplete: () => explosion.destroy()
    })

    // Add particles only for cannon shots (not for every hit)
    if (this.towerType === 'CANNON') {
      // Subtle camera shake on powerful cannon hits
      if (this.scene.cameras && (this.scene.cameras as any).main) {
        ;(this.scene.cameras as any).main.shake(120, 0.002)
      }
      this.createParticleEffectAtTarget(effectX, effectY)
    }
  }

  private createParticleEffect(): void {
    // Use projectile's position for particle effect
    this.createParticleEffectAtTarget(this.x, this.y)
  }

  private createParticleEffectAtTarget(targetX: number, targetY: number): void {
    // Create particle effect with different colors based on tower type
    const particleCount = this.towerType === 'CANNON' ? 6 : 4 // Stronger for cannon
    const particleColor = this.projectileColor

    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics()

      // Position particle at target location FIRST
      particle.setPosition(targetX, targetY)

      // Different particle shapes
      if (i % 2 === 0) {
        particle.fillStyle(particleColor)
        particle.fillCircle(0, 0, 2) // Round particle
      } else {
        particle.fillStyle(particleColor, 0.8)
        particle.fillRect(-1, -3, 2, 6) // Line particle
      }

      particle.setDepth(11)

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4
      const distance = 22 + Math.random() * 14 // Stronger spread distance

      // Calculate final position
      const finalX = targetX + Math.cos(angle) * distance
      const finalY = targetY + Math.sin(angle) * distance

      this.scene.tweens.add({
        targets: particle,
        x: finalX,
        y: finalY,
        alpha: 0,
        scale: 0.55, // Slightly stronger
        rotation: Math.random() * Math.PI * 2,
        duration: 230 + Math.random() * 120, // Slightly longer
        onComplete: () => particle.destroy()
      })
    }

    // Add center burst effect (anchor at target to avoid scale drift)
    const centerBurst = this.scene.add.graphics()
    centerBurst.setDepth(10)
    centerBurst.setPosition(targetX, targetY)
    centerBurst.fillStyle(this.projectileColor, 0.5)
    centerBurst.fillCircle(0, 0, 10)

    this.scene.tweens.add({
      targets: centerBurst,
      alpha: 0,
      scale: 1.8,
      duration: 180,
      onComplete: () => centerBurst.destroy()
    })
  }

  private explode(): void {
    if (!this.isActive) return

    this.isActive = false
    this.destroy()
  }

  public isProjectileActive(): boolean {
    return this.isActive
  }
}

