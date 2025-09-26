import * as Phaser from 'phaser'
import { ProjectileType, PROJECTILE_CONFIGS } from '../config/TowerDefenseConfig'

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public projectileType: ProjectileType
  public damage: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    projectileType: ProjectileType,
    damage: number = 25
  ) {
    super(scene, x, y, 'projectile-basic') // TODO: Use proper sprite based on type

    const config = PROJECTILE_CONFIGS[projectileType]

    this.projectileType = projectileType
    this.damage = damage

    // Добавляем в сцену
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Настраиваем физику
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(config.size, config.size)

    // Устанавливаем цвет
    this.setTint(config.color)
    this.setScale(1.0)
  }

  update() {
    // Проверяем, не вышел ли снаряд за пределы экрана
    if (this.x < -50 || this.x > 1450 || this.y < -50 || this.y > 850) {
      this.destroy()
    }
  }

  destroy(): void {
    // Создаем эффект исчезновения
    this.scene.add.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 100,
      onComplete: () => {
        super.destroy()
      }
    })
  }
}
