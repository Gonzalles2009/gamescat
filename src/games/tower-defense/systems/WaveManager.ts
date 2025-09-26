import * as Phaser from 'phaser'
import { EnemyType, WAVE_CONFIGS, TOWER_DEFENSE_CONFIG } from '../config/TowerDefenseConfig'
import { Enemy } from '../entities/Enemy'

export interface WaveEnemyConfig {
  type: EnemyType
  count: number
}

export interface WaveConfig {
  enemies: WaveEnemyConfig[]
}

export class WaveManager {
  private scene: Phaser.Scene
  private currentWave: number = 0
  private enemiesRemaining: number = 0
  private enemySpawnTimer?: Phaser.Time.TimerEvent
  private onEnemySpawned?: (enemy: Enemy) => void
  private onWaveComplete?: (waveNumber: number) => void
  private onAllWavesComplete?: () => void

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  setCallbacks(
    onEnemySpawned?: (enemy: Enemy) => void,
    onWaveComplete?: (waveNumber: number) => void,
    onAllWavesComplete?: () => void
  ) {
    this.onEnemySpawned = onEnemySpawned
    this.onWaveComplete = onWaveComplete
    this.onAllWavesComplete = onAllWavesComplete
  }

  startNextWave(): boolean {
    if (this.currentWave >= WAVE_CONFIGS.length) {
      this.onAllWavesComplete?.()
      return false
    }

    this.currentWave++
    this.enemiesRemaining = 0

    const waveConfig = WAVE_CONFIGS[this.currentWave - 1]
    waveConfig.enemies.forEach((enemyConfig) => {
      this.enemiesRemaining += enemyConfig.count
    })

    this.spawnWaveEnemies(waveConfig)
    return true
  }

  private spawnWaveEnemies(waveConfig: WaveConfig) {
    let enemyIndex = 0
    let enemiesSpawned = 0

    this.enemySpawnTimer = this.scene.time.addEvent({
      delay: TOWER_DEFENSE_CONFIG.WAVE_SPAWN_DELAY,
      callback: () => {
        if (enemyIndex >= waveConfig.enemies.length) return

        const enemyConfig = waveConfig.enemies[enemyIndex]
        this.spawnEnemy(enemyConfig.type)
        enemiesSpawned++

        if (enemiesSpawned >= enemyConfig.count) {
          enemyIndex++
          enemiesSpawned = 0
        }
      },
      repeat: this.enemiesRemaining - 1
    })
  }

  private spawnEnemy(enemyType: EnemyType): Enemy {
    const startPoint = TOWER_DEFENSE_CONFIG.PATH[0]
    const enemy = new Enemy(this.scene, startPoint.x, startPoint.y, enemyType)

    // Уведомляем о спавне врага
    this.onEnemySpawned?.(enemy)

    return enemy
  }

  getCurrentWave(): number {
    return this.currentWave
  }

  getTotalWaves(): number {
    return WAVE_CONFIGS.length
  }

  getEnemiesRemaining(): number {
    return this.enemiesRemaining
  }

  isWaveActive(): boolean {
    return this.enemiesRemaining > 0 || (this.enemySpawnTimer?.getProgress() ?? 0) > 0
  }

  stop() {
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.destroy()
      this.enemySpawnTimer = undefined
    }
  }

  reset() {
    this.stop()
    this.currentWave = 0
    this.enemiesRemaining = 0
  }
}
