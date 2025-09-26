import * as Phaser from 'phaser'
import { TowerType, TOWER_CONFIGS } from '../config/TowerDefenseConfig'

export class Tower extends Phaser.Physics.Arcade.Sprite {
  public towerType: TowerType
  public damage: number
  public range: number
  public fireRate: number
  private lastShotTime: number = 0
  private target: Phaser.Physics.Arcade.Sprite | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    towerType: TowerType
  ) {
    super(scene, x, y, 'tower-basic') // TODO: Use proper sprite based on type

    const config = TOWER_CONFIGS[towerType]

    this.towerType = towerType
    this.damage = config.damage
    this.range = config.range
    this.fireRate = config.fireRate

    // Добавляем в сцену
    scene.add.existing(this)
    scene.physics.add.existing(this, true) // true = static body

    // Настраиваем внешний вид
    this.setTint(config.color)
    this.setScale(1.2)

    // Создаем радиус атаки для визуализации
    this.createRangeIndicator()
  }

  private createRangeIndicator() {
    const rangeCircle = this.scene.add.circle(this.x, this.y, this.range, 0x00ff00, 0.1)
    rangeCircle.setStrokeStyle(1, 0x00ff00, 0.3)
    this.setData('rangeIndicator', rangeCircle)
  }

  update() {
    this.updateTarget()
    this.tryShoot()
  }

  private updateTarget() {
    // Находим ближайшего врага в радиусе
    const enemies = this.scene.children.getAll().filter(child =>
      child instanceof Phaser.Physics.Arcade.Sprite &&
      child.getData('enemyType')
    ) as Phaser.Physics.Arcade.Sprite[]

    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null
    let nearestDistance = Infinity

    enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance <= this.range && distance < nearestDistance) {
        nearestEnemy = enemy
        nearestDistance = distance
      }
    })

    this.target = nearestEnemy
  }

  private tryShoot() {
    if (!this.target || !this.canShoot()) return

    this.shoot()
  }

  private canShoot(): boolean {
    const currentTime = this.scene.time.now
    return currentTime - this.lastShotTime >= this.fireRate
  }

  private shoot() {
    if (!this.target) return

    this.lastShotTime = this.scene.time.now

    // Создаем снаряд
    const projectile = this.scene.add.circle(this.x, this.y, 4, 0xffff00)
    this.scene.physics.add.existing(projectile)

    // Направляем снаряд к цели
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y)
    const velocityX = Math.cos(angle) * 300
    const velocityY = Math.sin(angle) * 300

    const body = projectile.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocityX, velocityY)

    // Настраиваем коллизию со врагами
    this.scene.physics.add.overlap(projectile, this.scene.children.getAll().filter(child =>
      child instanceof Phaser.Physics.Arcade.Sprite &&
      child.getData('enemyType')
    ), (proj, enemy) => {
      const projectile = proj as Phaser.Physics.Arcade.Sprite
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite

      projectile.destroy()

      // Наносим урон
      if (enemySprite.getData('takeDamage')) {
        (enemySprite as any).takeDamage(this.damage)
      }

      // Уведомляем сцену о попадании
      this.scene.events.emit('projectileHit', projectile, enemySprite)
    })

    // Визуальный эффект выстрела
    this.setTint(0xffffff)
    this.scene.time.delayedCall(50, () => {
      this.setTint(TOWER_CONFIGS[this.towerType].color)
    })
  }

  destroy(): void {
    // Удаляем индикатор радиуса
    const rangeIndicator = this.getData('rangeIndicator')
    if (rangeIndicator) {
      rangeIndicator.destroy()
    }

    super.destroy()
  }
}
