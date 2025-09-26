import * as Phaser from 'phaser'
import { EnemyType, ENEMY_CONFIGS } from '../config/TowerDefenseConfig'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyType: EnemyType
  public health: number
  public maxHealth: number
  public reward: number
  private pathIndex: number = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyType: EnemyType
  ) {
    super(scene, x, y, 'enemy-basic') // TODO: Use proper sprite based on type

    const config = ENEMY_CONFIGS[enemyType]

    this.enemyType = enemyType
    this.health = config.health
    this.maxHealth = config.health
    this.reward = config.reward

    // Добавляем в сцену
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Настраиваем физику
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(16, 16) // Размер хитбокса
    body.setCollideWorldBounds(false)

    // Устанавливаем цвет
    this.setTint(config.color)
    this.setScale(config.scale)
  }

  update() {
    // Простое движение вправо для базовой версии
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.setVelocity(50, 0)
    }
  }

  takeDamage(damage: number) {
    this.health = Math.max(0, this.health - damage)

    // Визуальный эффект получения урона
    this.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      this.setTint(ENEMY_CONFIGS[this.enemyType].color)
    })

    if (this.health <= 0) {
      this.die()
    }
  }

  private die() {
    // Создаем эффект смерти
    this.scene.add.particles(this.x, this.y, 'projectile-basic', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 5
    })

    // Уведомляем сцену о смерти врага
    this.scene.events.emit('enemyDied', this)

    this.destroy()
  }
}
