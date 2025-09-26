import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG } from '../config/TowerDefenseConfig'

export class TowerDefensePreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TowerDefensePreloadScene' })
  }

  preload() {
    console.log('TowerDefensePreloadScene: Starting preload...')

    // Создаем красивую полосу загрузки
    this.createLoadingBar()

    // Загружаем спрайты для игры
    this.loadSprites()

    console.log('TowerDefensePreloadScene: Preload complete')
  }

  private createLoadingBar() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Фон полосы загрузки
    const loadingBar = this.add.graphics()
    const loadingFrame = this.add.graphics()

    // Рамка полосы
    loadingFrame.lineStyle(3, 0x00ff88)
    loadingFrame.strokeRect(width / 2 - 200, height / 2 - 20, 400, 40)

    // Текст загрузки
    const loadingText = this.add.text(width / 2, height / 2 - 60, 'Loading Tower Defense...', {
      fontSize: '28px',
      color: '#00ff88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)

    // Обновление полосы загрузки
    this.load.on('progress', (value: number) => {
      loadingBar.clear()
      loadingBar.fillStyle(0x00ff88, 0.8)
      loadingBar.fillRect(width / 2 - 197, height / 2 - 17, 394 * value, 34)
    })

    // Очистка после загрузки
    this.load.on('complete', () => {
      loadingBar.destroy()
      loadingFrame.destroy()
      loadingText.destroy()
    })
  }

  private loadSprites() {
    // Создаем простые цветные текстуры для базовой версии
    this.createColoredTexture('base', 40, 60, 0x8B4513) // Коричневая база
    this.createColoredTexture('path', 40, 40, 0x654321) // Коричневый путь
    this.createColoredTexture('grass', 40, 40, 0x228B22) // Зеленая трава

    // Текстуры для врагов
    this.createColoredTexture('enemy-basic', 20, 20, 0xff0000)
    this.createColoredTexture('enemy-fast', 16, 16, 0x00ff00)
    this.createColoredTexture('enemy-tank', 30, 30, 0x666666)
    this.createColoredTexture('enemy-flying', 24, 24, 0xff00ff)

    // Текстуры для башен
    this.createColoredTexture('tower-basic', 30, 30, 0x00ff00)
    this.createColoredTexture('tower-sniper', 30, 30, 0xffaa00)
    this.createColoredTexture('tower-cannon', 30, 30, 0x666666)
    this.createColoredTexture('tower-frost', 30, 30, 0x0088ff)

    // Текстуры для снарядов
    this.createColoredTexture('projectile-basic', 6, 6, 0xffff00)
    this.createColoredTexture('projectile-sniper', 4, 4, 0xff6600)
    this.createColoredTexture('projectile-cannon', 10, 10, 0x333333)
    this.createColoredTexture('projectile-frost', 6, 6, 0x88ddff)

    // UI элементы
    this.createColoredTexture('ui-button', 80, 40, 0x444444)
    this.createColoredTexture('ui-button-hover', 80, 40, 0x666666)
    this.createColoredTexture('health-bar-bg', 200, 20, 0x330000)
    this.createColoredTexture('health-bar-fill', 200, 20, 0x00ff00)
  }

  private createColoredTexture(key: string, width: number, height: number, color: number) {
    const canvas = this.textures.createCanvas(key, width, height)
    if (canvas) {
      const ctx = canvas.context
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(0, 0, width, height)

      // Добавляем рамку для видимости
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, width - 2, height - 2)

      canvas.refresh()
    }
  }

  create() {
    console.log('TowerDefensePreloadScene: Create method called, starting TowerDefenseScene...')

    // Переходим к основной игровой сцене
    this.scene.start('TowerDefenseScene')

    console.log('TowerDefensePreloadScene: Scene transition initiated')
  }
}
