import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG, GAME_STATES, TowerType, EnemyType, ProjectileType, WAVE_CONFIGS, GameState } from '../config/TowerDefenseConfig'

export class TowerDefenseScene extends Phaser.Scene {
  // Игровые объекты
  private base!: Phaser.GameObjects.Rectangle
  private baseHealth = TOWER_DEFENSE_CONFIG.BASE_HEALTH
  private money = TOWER_DEFENSE_CONFIG.STARTING_MONEY

  // Группы объектов
  private enemies!: Phaser.Physics.Arcade.Group
  private towers!: Phaser.Physics.Arcade.Group
  private projectiles!: Phaser.Physics.Arcade.Group

  // UI элементы
  private healthText!: Phaser.GameObjects.Text
  private moneyText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private gameStateText!: Phaser.GameObjects.Text

  // Состояние игры
  private gameState: GameState = GAME_STATES.MENU
  private currentWave = 0
  private enemiesRemaining = 0
  private selectedTowerType: TowerType | null = null

  // Игровые таймеры
  private waveTimer!: Phaser.Time.TimerEvent
  private enemySpawnTimer!: Phaser.Time.TimerEvent

  // Кнопки UI
  private towerButtons: Phaser.GameObjects.Container[] = []
  private startWaveButton!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'TowerDefenseScene' })
    console.log('TowerDefenseScene: Constructor called')
  }

  create() {
    console.log('TowerDefenseScene: Create method called')

    this.setupBackground()
    console.log('TowerDefenseScene: Background setup complete')

    this.setupBase()
    console.log('TowerDefenseScene: Base setup complete')

    this.setupPath()
    console.log('TowerDefenseScene: Path setup complete')

    this.setupGroups()
    console.log('TowerDefenseScene: Groups setup complete')

    this.setupUI()
    console.log('TowerDefenseScene: UI setup complete')

    this.setupEventListeners()
    console.log('TowerDefenseScene: Event listeners setup complete')

    this.showMainMenu()
    console.log('TowerDefenseScene: Main menu shown')
  }

  private setupBackground() {
    // Создаем градиентный фон
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x001122, 0x001122, 0x223344, 0x223344)
    bg.fillRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT)

    // Добавляем сетку травы
    for (let x = 0; x < TOWER_DEFENSE_CONFIG.SCREEN_WIDTH; x += 40) {
      for (let y = 0; y < TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT; y += 40) {
        if (Math.random() > 0.7) {
          this.add.image(x, y, 'grass')
        }
      }
    }
  }

  private setupBase() {
    // Создаем базу в конце пути
    const baseX = TOWER_DEFENSE_CONFIG.PATH[TOWER_DEFENSE_CONFIG.PATH.length - 1].x - 20
    const baseY = TOWER_DEFENSE_CONFIG.PATH[TOWER_DEFENSE_CONFIG.PATH.length - 1].y - 30

    this.base = this.add.rectangle(baseX, baseY, 40, 60, 0x8B4513)
    this.base.setStrokeStyle(3, 0xFFD700)
    this.physics.add.existing(this.base, true)
  }

  private setupPath() {
    // Рисуем путь для врагов
    const pathGraphics = this.add.graphics()
    pathGraphics.lineStyle(20, 0x654321, 1)

    const path = TOWER_DEFENSE_CONFIG.PATH
    pathGraphics.moveTo(path[0].x, path[0].y)

    for (let i = 1; i < path.length; i++) {
      pathGraphics.lineTo(path[i].x, path[i].y)
    }

    pathGraphics.strokePath()

    // Добавляем маркеры пути
    path.forEach((point, index) => {
      if (index % 2 === 0) {
        this.add.circle(point.x, point.y, 8, 0xFFD700, 0.5)
      }
    })
  }

  private setupGroups() {
    // Создаем группы для физических объектов
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    })

    this.towers = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    })

    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    })

    // Настраиваем коллизии
    this.physics.add.collider(this.enemies, this.base, (enemyObj, baseObj) => {
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      const base = baseObj as Phaser.GameObjects.Rectangle
      this.onEnemyReachedBase(enemy, base)
    }, undefined, this)
    this.physics.add.overlap(this.projectiles, this.enemies, (projectileObj, enemyObj) => {
      const projectile = projectileObj as Phaser.Physics.Arcade.Sprite
      const enemy = enemyObj as Phaser.Physics.Arcade.Sprite
      this.onProjectileHit(projectile, enemy)
    }, undefined, this)
  }

  private setupUI() {
    // Создаем UI контейнер
    const uiContainer = this.add.container(0, 0)
    uiContainer.setDepth(100)

    // Фон UI панели
    const uiBg = this.add.graphics()
    uiBg.fillStyle(0x000000, 0.8)
    uiBg.fillRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, 100)
    uiBg.lineStyle(2, 0x00ff88)
    uiBg.strokeRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, 100)
    uiContainer.add(uiBg)

    // Тексты состояния игры
    this.healthText = this.add.text(20, 20, `Base Health: ${this.baseHealth}`, {
      fontSize: '20px',
      color: '#ff4444',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    })
    uiContainer.add(this.healthText)

    this.moneyText = this.add.text(20, 45, `Money: $${this.money}`, {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    })
    uiContainer.add(this.moneyText)

    this.waveText = this.add.text(20, 70, 'Wave: 0 / 5', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    uiContainer.add(this.waveText)

    this.gameStateText = this.add.text(TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2, 50, 'Press SPACE to Start', {
      fontSize: '24px',
      color: '#00ff88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)
    uiContainer.add(this.gameStateText)

    // Создаем кнопки башен
    this.createTowerButtons(uiContainer)

    // Создаем кнопку старта волны
    this.createStartWaveButton(uiContainer)
  }

  private createTowerButtons(container: Phaser.GameObjects.Container) {
    const buttonY = TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - 60
    let buttonX = 200

    Object.values(TowerType).forEach((towerType, index) => {
      const button = this.createButton(buttonX, buttonY, towerType)
      container.add(button)
      this.towerButtons.push(button)
      buttonX += 120
    })
  }

  private createButton(x: number, y: number, towerType: TowerType) {
    const container = this.add.container(x, y)

    // Фон кнопки
    const bg = this.add.rectangle(0, 0, 80, 40, 0x444444)
    bg.setStrokeStyle(2, 0x666666)
    container.add(bg)

    // Иконка башни
    const icon = this.add.rectangle(0, 0, 20, 20, 0x00ff00)
    container.add(icon)

    // Текст стоимости
    const costText = this.add.text(0, 20, '$50', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5)
    container.add(costText)

    // Интерактивность
    bg.setInteractive()
    bg.on('pointerover', () => {
      bg.setFillStyle(0x666666)
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(0x444444)
    })
    bg.on('pointerdown', () => {
      this.selectedTowerType = towerType
      this.showMessage(`Selected ${towerType} Tower`)
    })

    return container
  }

  private createStartWaveButton(container: Phaser.GameObjects.Container) {
    const button = this.add.container(TOWER_DEFENSE_CONFIG.SCREEN_WIDTH - 150, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT - 60)

    const bg = this.add.rectangle(0, 0, 120, 40, 0x0088ff)
    bg.setStrokeStyle(2, 0x00aaff)
    button.add(bg)

    const text = this.add.text(0, 0, 'Start Wave', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5)
    button.add(text)

    bg.setInteractive()
    bg.on('pointerover', () => bg.setFillStyle(0x00aaff))
    bg.on('pointerout', () => bg.setFillStyle(0x0088ff))
    bg.on('pointerdown', () => this.startNextWave())

    this.startWaveButton = button
    container.add(button)
  }

  private setupEventListeners() {
    // Клавиши управления
    const spaceKey = this.input.keyboard!.addKey('SPACE')
    const rKey = this.input.keyboard!.addKey('R')

    spaceKey.on('down', () => {
      if (this.gameState === GAME_STATES.MENU) {
        this.startGame()
      }
    })

    rKey.on('down', () => {
      this.restartGame()
    })

    // Клик мыши для размещения башен
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameState !== GAME_STATES.PLAYING) return
      if (this.selectedTowerType) {
        this.tryPlaceTower(pointer.x, pointer.y)
      }
    })
  }

  private showMainMenu() {
    const container = this.add.container(0, 0)
    container.setDepth(200)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.fillRect(0, 0, TOWER_DEFENSE_CONFIG.SCREEN_WIDTH, TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT)
    container.add(bg)

    const title = this.add.text(
      TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
      200,
      'TOWER DEFENSE',
      {
        fontSize: '48px',
        color: '#00ff88',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5)
    container.add(title)

    const subtitle = this.add.text(
      TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
      280,
      'Defend your base from waves of enemies!',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5)
    container.add(subtitle)

    const instructions = this.add.text(
      TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
      350,
      'Click tower buttons to select\nClick on the field to place towers\nPress SPACE to start',
      {
        fontSize: '16px',
        color: '#cccccc',
        fontFamily: 'monospace',
        align: 'center'
      }
    ).setOrigin(0.5)
    container.add(instructions)
  }

  private startGame() {
    this.gameState = GAME_STATES.PLAYING
    this.showMessage('Game Started! Place your towers and start the first wave')
  }

  private restartGame() {
    this.scene.restart()
  }

  private tryPlaceTower(x: number, y: number) {
    if (!this.selectedTowerType) return

    const towerCost = 50 // TODO: Get from config
    if (this.money < towerCost) {
      this.showMessage('Not enough money!')
      return
    }

    // Проверяем, что место свободно
    if (this.isValidTowerPosition(x, y)) {
      this.placeTower(x, y, this.selectedTowerType)
      this.money -= towerCost
      this.updateMoneyDisplay()
      this.selectedTowerType = null
      this.showMessage('Tower placed!')
    } else {
      this.showMessage('Cannot place tower here!')
    }
  }

  private isValidTowerPosition(x: number, y: number): boolean {
    // Простая проверка - не слишком близко к пути
    const path = TOWER_DEFENSE_CONFIG.PATH
    for (const point of path) {
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y)
      if (distance < 50) {
        return false
      }
    }

    // Не слишком близко к базе
    const baseX = this.base.x
    const baseY = this.base.y
    const distance = Phaser.Math.Distance.Between(x, y, baseX, baseY)
    if (distance < 80) {
      return false
    }

    return true
  }

  private placeTower(x: number, y: number, towerType: TowerType) {
    const tower = this.add.rectangle(x, y, 30, 30, 0x00ff00)
    tower.setStrokeStyle(2, 0xffffff)
    this.physics.add.existing(tower, true)
    this.towers.add(tower)

    // Добавляем логику стрельбы
    const shootTimer = this.time.addEvent({
      delay: 1000,
      callback: () => this.towerShoot(tower),
      loop: true
    })

    tower.setData('towerType', towerType)
    tower.setData('shootTimer', shootTimer)
  }

  private towerShoot(tower: Phaser.GameObjects.GameObject) {
    if (this.gameState !== GAME_STATES.PLAYING) return

    const towerRect = tower as Phaser.GameObjects.Rectangle

    // Находим ближайшего врага в радиусе
    const enemies = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null
    let nearestDistance = Infinity

    enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(towerRect.x, towerRect.y, enemy.x, enemy.y)
      if (distance < 120 && distance < nearestDistance) { // TODO: Get range from config
        nearestEnemy = enemy
        nearestDistance = distance
      }
    })

    if (nearestEnemy) {
      this.shootProjectile(towerRect.x, towerRect.y, (nearestEnemy as any).x, (nearestEnemy as any).y)
    }
  }

  private shootProjectile(fromX: number, fromY: number, toX: number, toY: number) {
    const projectile = this.add.circle(fromX, fromY, 4, 0xffff00)
    this.physics.add.existing(projectile)

    // Направляем снаряд к цели
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY)
    const velocityX = Math.cos(angle) * 300
    const velocityY = Math.sin(angle) * 300

    const body = projectile.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocityX, velocityY)

    this.projectiles.add(projectile)
  }

  private startNextWave() {
    if (this.gameState !== GAME_STATES.PLAYING) return
    if (this.currentWave >= WAVE_CONFIGS.length) {
      this.showMessage('All waves completed! You win!')
      return
    }

    this.currentWave++
    this.enemiesRemaining = 0

    const waveConfig = WAVE_CONFIGS[this.currentWave - 1]
    waveConfig.enemies.forEach((enemyConfig) => {
      this.enemiesRemaining += enemyConfig.count
    })

    this.waveText.setText(`Wave: ${this.currentWave} / ${WAVE_CONFIGS.length}`)
    this.showMessage(`Wave ${this.currentWave} starting!`)

    // Запускаем спавн врагов
    this.spawnWaveEnemies(waveConfig)
  }

  private spawnWaveEnemies(waveConfig: any) {
    let enemyIndex = 0

    this.enemySpawnTimer = this.time.addEvent({
      delay: TOWER_DEFENSE_CONFIG.WAVE_SPAWN_DELAY,
      callback: () => {
        if (enemyIndex >= waveConfig.enemies.length) return

        const enemyConfig = waveConfig.enemies[enemyIndex]
        for (let i = 0; i < enemyConfig.count; i++) {
          this.spawnEnemy(enemyConfig.type)
        }
        enemyIndex++
      },
      repeat: waveConfig.enemies.length - 1
    })
  }

  private spawnEnemy(enemyType: EnemyType) {
    const startPoint = TOWER_DEFENSE_CONFIG.PATH[0]
    const enemy = this.add.circle(startPoint.x, startPoint.y, 10, 0xff0000)
    this.physics.add.existing(enemy)

    const body = enemy.body as Phaser.Physics.Arcade.Body
    body.setVelocity(50, 0) // Начальное движение вправо

    this.enemies.add(enemy)
    enemy.setData('enemyType', enemyType)
    enemy.setData('health', 50) // TODO: Get from config
  }

  private onEnemyReachedBase(enemy: Phaser.GameObjects.GameObject, base: Phaser.GameObjects.GameObject) {
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
    this.baseHealth--
    this.updateHealthDisplay()

    enemySprite.destroy()

    if (this.baseHealth <= 0) {
      this.gameOver()
    }
  }

  private onProjectileHit(projectile: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
    projectile.destroy()

    const currentHealth = enemy.getData('health') || 50
    const newHealth = currentHealth - 25 // TODO: Get damage from config

    if (newHealth <= 0) {
      enemy.destroy()
      this.money += 15 // TODO: Get reward from config
      this.updateMoneyDisplay()
      this.enemiesRemaining--
      this.checkWaveComplete()
    } else {
      enemy.setData('health', newHealth)
    }
  }

  private checkWaveComplete() {
    if (this.enemiesRemaining <= 0 && this.enemies.getLength() === 0) {
      this.showMessage(`Wave ${this.currentWave} complete!`)
    }
  }

  private gameOver() {
    this.gameState = GAME_STATES.GAME_OVER
    this.showMessage('Game Over! Press R to restart')

    // Останавливаем все таймеры
    if (this.waveTimer) this.waveTimer.destroy()
    if (this.enemySpawnTimer) this.enemySpawnTimer.destroy()
  }

  private updateHealthDisplay() {
    this.healthText.setText(`Base Health: ${this.baseHealth}`)
    if (this.baseHealth <= 5) {
      this.healthText.setColor('#ff0000')
    } else {
      this.healthText.setColor('#ff4444')
    }
  }

  private updateMoneyDisplay() {
    this.moneyText.setText(`Money: $${this.money}`)
  }

  private showMessage(message: string) {
    if (this.gameStateText) {
      this.gameStateText.destroy()
    }

    this.gameStateText = this.add.text(
      TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
      50,
      message,
      {
        fontSize: '20px',
        color: '#00ff88',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5)

    // Автоматически скрываем сообщение через 3 секунды
    this.time.delayedCall(3000, () => {
      if (this.gameStateText) {
        this.gameStateText.destroy()
        this.gameStateText = this.add.text(
          TOWER_DEFENSE_CONFIG.SCREEN_WIDTH / 2,
          50,
          this.gameState === GAME_STATES.PLAYING ? 'Place towers and start wave' : 'Press SPACE to Start',
          {
            fontSize: '24px',
            color: '#00ff88',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2
          }
        ).setOrigin(0.5)
      }
    })
  }

  update() {
    // Обновляем движение врагов по пути
    this.enemies.getChildren().forEach((enemy) => {
      this.updateEnemyMovement(enemy as Phaser.Physics.Arcade.Sprite)
    })

    // Удаляем снаряды, вышедшие за пределы экрана
    this.projectiles.getChildren().forEach((projectile) => {
      const proj = projectile as Phaser.Physics.Arcade.Sprite
      if (proj.x < 0 || proj.x > TOWER_DEFENSE_CONFIG.SCREEN_WIDTH ||
          proj.y < 0 || proj.y > TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT) {
        proj.destroy()
      }
    })
  }

  private updateEnemyMovement(enemy: Phaser.GameObjects.GameObject) {
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite
    // Простая система следования по пути
    const path = TOWER_DEFENSE_CONFIG.PATH
    const currentTarget = path[0] // TODO: Implement proper path following

    const angle = Phaser.Math.Angle.Between(enemySprite.x, enemySprite.y, currentTarget.x, currentTarget.y)
    const body = enemySprite.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.setVelocity(Math.cos(angle) * 50, Math.sin(angle) * 50)
    }
  }
}
