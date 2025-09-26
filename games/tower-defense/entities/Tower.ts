import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG, TowerType } from '../config/TowerDefenseConfig'
import { Enemy } from './Enemy'
import { Projectile } from './Projectile'

export class Tower extends Phaser.GameObjects.Container {
  public readonly isTower: boolean = true
  public towerType: TowerType
  public damage: number
  public range: number
  public fireRate: number
  public cost: number
  
  private sprite: Phaser.GameObjects.Graphics
  private rangeCircle?: Phaser.GameObjects.Graphics
  private lastFireTime: number = 0
  private target?: Enemy
  private projectileSpeed: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    towerType: TowerType
  ) {
    super(scene, x, y)
    
    const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[towerType]
    
    this.towerType = towerType
    this.damage = config.damage
    this.range = config.range
    this.fireRate = config.fireRate
    this.cost = config.cost
    this.projectileSpeed = config.projectileSpeed
    
    // Create tower sprite (simple shapes for now)
    this.sprite = scene.add.graphics()
    this.createTowerSprite(config.color)
    this.add(this.sprite)
    
    // Add to scene
    scene.add.existing(this)
    this.setDepth(10)
    
    // Show range on hover and allow sell on right-click
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains)
    this.on('pointerover', this.showRange, this)
    this.on('pointerout', this.hideRange, this)
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.scene.events.emit('tower-sell-request', this)
    })
  }

  private createTowerSprite(color: number) {
    this.sprite.clear()
    
    switch (this.towerType) {
      case 'BASIC':
        // Simple square tower
        this.sprite.fillStyle(color)
        this.sprite.fillRect(-15, -15, 30, 30)
        this.sprite.lineStyle(2, 0x000000)
        this.sprite.strokeRect(-15, -15, 30, 30)
        break
        
      case 'CANNON':
        // Circular cannon
        this.sprite.fillStyle(color)
        this.sprite.fillCircle(0, 0, 18)
        this.sprite.lineStyle(2, 0x000000)
        this.sprite.strokeCircle(0, 0, 18)
        // Cannon barrel
        this.sprite.fillStyle(0x333333)
        this.sprite.fillRect(-3, -20, 6, 15)
        break
        
      case 'LASER':
        // Diamond shape
        this.sprite.fillStyle(color)
        this.sprite.fillTriangle(0, -20, -15, 0, 0, 20)
        this.sprite.fillTriangle(0, -20, 15, 0, 0, 20)
        this.sprite.lineStyle(2, 0x000000)
        this.sprite.strokeTriangle(0, -20, -15, 0, 0, 20)
        this.sprite.strokeTriangle(0, -20, 15, 0, 0, 20)
        break
    }
  }

  public update(enemies: Enemy[], delta?: number) {
    const currentTime = this.scene.time.now
    
    // Find target
    this.findTarget(enemies)
    
    // Calculate effective fire rate based on game speed
    // Higher speed = faster firing (lower fire rate value)
    const gameSpeed = (this.scene as any).gameSpeed || 1
    const effectiveFireRate = this.fireRate / gameSpeed
    
    // Shoot if we have a target and enough time has passed
    if (this.target && currentTime - this.lastFireTime >= effectiveFireRate) {
      this.shoot()
      this.lastFireTime = currentTime
    }
  }

  private findTarget(enemies: Enemy[]): void {
    // Clear target if current target is dead or out of range
    if (this.target && (!this.target.isAlive() || this.getDistanceToTarget(this.target) > this.range)) {
      this.target = undefined
    }
    
    // Find new target if we don't have one
    if (!this.target) {
      let closestEnemy: Enemy | undefined
      let closestDistance = Infinity
      
      for (const enemy of enemies) {
        if (!enemy.isAlive()) continue
        
        const distance = this.getDistanceToTarget(enemy)
        if (distance <= this.range && distance < closestDistance) {
          closestDistance = distance
          closestEnemy = enemy
        }
      }
      
      this.target = closestEnemy
    }
  }

  private getDistanceToTarget(enemy: Enemy): number {
    return Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
  }

  private shoot(): void {
    if (!this.target) return
    
    // Create projectile
    const projectile = new Projectile(
      this.scene,
      this.x,
      this.y,
      this.target,
      this.damage,
      this.projectileSpeed,
      this.towerType
    )
    
    // Add projectile to scene's projectile group (we'll create this in GameScene)
    this.scene.events.emit('projectile-created', projectile)
    
    // Visual effect - muzzle flash
    this.createMuzzleFlash()
  }

  private createMuzzleFlash(): void {
    // Create multi-layer muzzle flash (anchor at tower position and draw locally)
    const flash = this.scene.add.graphics()
    flash.setDepth(15)
    flash.setPosition(this.x, this.y)

    // Outer bright ring
    flash.lineStyle(3, 0xffff66, 0.85)
    flash.strokeCircle(0, 0, 9)

    // Inner bright core
    flash.fillStyle(0xffff66, 0.75)
    flash.fillCircle(0, 0, 5)

    // Add sparkles around muzzle - reduced count
    for (let i = 0; i < 2; i++) {
      const sparkle = this.scene.add.graphics()
      
      // Position sparkle at tower location FIRST
      sparkle.setPosition(this.x, this.y)
      
      sparkle.fillStyle(0xffff00, 0.8)
      sparkle.fillCircle(0, 0, 0.5) // Much smaller sparkles
      sparkle.setDepth(16)

      // Calculate controlled sparkle position
      const angle = (i / 2) * Math.PI * 2 + Math.random() * 0.3
      const distance = 4 + Math.random() * 5 // Stronger spread
      const finalX = this.x + Math.cos(angle) * distance
      const finalY = this.y + Math.sin(angle) * distance

      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: 0.4,
        x: finalX,
        y: finalY,
        duration: 100,
        onComplete: () => sparkle.destroy()
      })
    }

    // Animate main flash
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.0,
      duration: 160,
      onComplete: () => flash.destroy()
    })
  }

  private showRange(): void {
    if (this.rangeCircle) return
    
    this.rangeCircle = this.scene.add.graphics()
    this.rangeCircle.lineStyle(2, 0x00ff00, 0.5)
    this.rangeCircle.strokeCircle(this.x, this.y, this.range)
    this.rangeCircle.setDepth(1)
  }

  private hideRange(): void {
    if (this.rangeCircle) {
      this.rangeCircle.destroy()
      this.rangeCircle = undefined
    }
  }

  public destroy(): void {
    this.hideRange()
    super.destroy()
  }

  public getTowerInfo(): string {
    const config = TOWER_DEFENSE_CONFIG.TOWER_TYPES[this.towerType]
    return `${config.name}\nDamage: ${this.damage}\nRange: ${this.range}\nFire Rate: ${(1000/this.fireRate).toFixed(1)}/s`
  }
}

