import * as Phaser from 'phaser'
import { TOWER_DEFENSE_CONFIG, EnemyType } from '../config/TowerDefenseConfig'
import { Enemy } from './Enemy'

interface WaveDefinition {
  enemyType: EnemyType
  count: number
  spawnDelay: number
}

export class WaveManager {
  private scene: Phaser.Scene
  private currentWave: number = 0
  private readonly maxWaves: number = 10
  private isSpawning: boolean = false
  private enemies: Enemy[] = []
  private waveInProgress: boolean = false
  private nextWaveTimer?: Phaser.Time.TimerEvent
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  public reset(): void {
    // Reset wave state
    this.currentWave = 0
    this.isSpawning = false
    this.waveInProgress = false
    
    // Clear enemies
    this.enemies.forEach(enemy => enemy.destroy())
    this.enemies = []
    
    // Clear any active timers
    if (this.nextWaveTimer) {
      this.nextWaveTimer.destroy()
      this.nextWaveTimer = undefined
    }
    
    console.log('WaveManager reset')
  }

  public startNextWave(): void {
    if (this.isSpawning || this.waveInProgress) {
      console.log(`Cannot start wave: isSpawning=${this.isSpawning}, waveInProgress=${this.waveInProgress}`)
      return
    }

    // Stop if we've reached the maximum number of waves
    if (this.currentWave >= this.maxWaves) {
      console.log('All waves completed!')
      this.scene.events.emit('all-waves-completed', this.currentWave)
      return
    }

    this.currentWave++
    this.waveInProgress = true

    console.log(`Starting wave ${this.currentWave}`)

    // Generate wave definition
    const waveDefinition = this.generateWaveDefinition(this.currentWave)
    console.log('Wave definition:', waveDefinition)

    // Emit wave start event
    this.scene.events.emit('wave-started', this.currentWave, waveDefinition)

    // Start spawning enemies
    this.spawnWave(waveDefinition)
  }

  private generateWaveDefinition(waveNumber: number): WaveDefinition[] {
    const wave: WaveDefinition[] = []
    // Difficulty multipliers from scene
    const difficulty = (this.scene as any)?.difficulty as ('EASY'|'NORMAL'|'HARD'|undefined) || 'EASY'
    // Make curves much steeper
    const countMul = difficulty === 'EASY' ? 1.0 : difficulty === 'NORMAL' ? 1.6 : 2.2
    const speedMul = difficulty === 'EASY' ? 1.0 : difficulty === 'NORMAL' ? 0.7 : 0.5 // lower -> faster spawn
    const baseEnemies = TOWER_DEFENSE_CONFIG.WAVE_CONFIG.BASE_ENEMIES
    const increment = TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_INCREMENT
    
    // Calculate total enemies for this wave
    // Progressive difficulty: enemies count grows, and spawn gets slightly faster
    const totalEnemies = Math.floor((baseEnemies + (waveNumber - 1) * increment) * countMul)
    const spawnScale = Math.max(0.35, 1 - (waveNumber - 1) * 0.08) * speedMul // can go to 35%
    
    // Distribute enemy types based on wave number
    if (waveNumber === 1) {
      // First wave - only basic enemies
      wave.push({
        enemyType: 'BASIC',
        count: totalEnemies,
        spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY * spawnScale
      })
    } else if (waveNumber <= 3) {
      // Waves 2-3 - basic and some fast
      const fastCount = Math.floor(totalEnemies * 0.3)
      const basicCount = totalEnemies - fastCount
      
      wave.push({
        enemyType: 'BASIC',
        count: basicCount,
        spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY
      })
      
      if (fastCount > 0) {
        wave.push({
          enemyType: 'FAST',
          count: fastCount,
        spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY * 0.7 * spawnScale
        })
      }
    } else {
      // Wave 4+ - mix of all types
      const tankCount = Math.floor(totalEnemies * 0.2)
      const fastCount = Math.floor(totalEnemies * 0.4)
      const basicCount = totalEnemies - tankCount - fastCount
      
      if (basicCount > 0) {
        wave.push({
          enemyType: 'BASIC',
          count: basicCount,
          spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY * spawnScale
        })
      }
      
      if (fastCount > 0) {
        wave.push({
          enemyType: 'FAST',
          count: fastCount,
          spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY * 0.6 * spawnScale
        })
      }
      
      if (tankCount > 0) {
        wave.push({
          enemyType: 'TANK',
          count: tankCount,
          spawnDelay: TOWER_DEFENSE_CONFIG.WAVE_CONFIG.ENEMY_SPAWN_DELAY * 1.5 * spawnScale
        })
      }
    }
    
    return wave
  }

  private async spawnWave(waveDefinition: WaveDefinition[]): Promise<void> {
    console.log(`Spawning wave with ${waveDefinition.length} enemy groups`)
    this.isSpawning = true

    // Spawn each enemy group in the wave definition
    for (const group of waveDefinition) {
      console.log(`Spawning enemy group: ${group.count} ${group.enemyType} enemies`)
      await this.spawnEnemyGroup(group)
    }

    console.log('Finished spawning all enemy groups')
    this.isSpawning = false

    // Check if wave is complete (no more enemies alive)
    this.checkWaveComplete()
  }

  private spawnEnemyGroup(group: WaveDefinition): Promise<void> {
    return new Promise((resolve) => {
      console.log(`Starting to spawn ${group.count} ${group.enemyType} enemies`)
      let spawnedCount = 0

      const spawnTimer = this.scene.time.addEvent({
        delay: group.spawnDelay,
        callback: () => {
          // Spawn enemy
          const enemy = new Enemy(
            this.scene,
            TOWER_DEFENSE_CONFIG.PATH_POINTS[0].x,
            TOWER_DEFENSE_CONFIG.PATH_POINTS[0].y,
            group.enemyType
          )

          this.enemies.push(enemy)
          this.scene.events.emit('enemy-spawned', enemy)

          spawnedCount++
          console.log(`Spawned enemy ${spawnedCount}/${group.count} of type ${group.enemyType}`)

          if (spawnedCount >= group.count) {
            console.log(`Finished spawning all ${group.count} ${group.enemyType} enemies`)
            spawnTimer.destroy()
            resolve()
          }
        },
        repeat: group.count - 1
      })
    })
  }

  public update(delta?: number): void {
    // Use provided delta or default to scene delta
    const actualDelta = delta !== undefined ? delta : this.scene.game.loop.delta
    
    // Update all enemies
    this.enemies = this.enemies.filter(enemy => {
      if (enemy.active) {
        enemy.update(actualDelta)
        return true
      } else {
        return false // Remove inactive enemies
      }
    })
    
    // Check if wave is complete
    if (this.waveInProgress && !this.isSpawning && this.enemies.length === 0) {
      this.onWaveComplete()
    }
  }

  private checkWaveComplete(): void {
    // This will be called by update() when all enemies are gone
  }

  private onWaveComplete(): void {
    if (!this.waveInProgress) return
    
    this.waveInProgress = false
    
    console.log(`Wave ${this.currentWave} completed!`)
    
    // Emit wave complete event
    this.scene.events.emit('wave-completed', this.currentWave)
    
    // Start timer for next wave
    this.startNextWaveTimer()
  }

  private startNextWaveTimer(): void {
    if (this.nextWaveTimer) {
      this.nextWaveTimer.destroy()
    }
    
    // Emit preparation phase event
    this.scene.events.emit('wave-preparation', TOWER_DEFENSE_CONFIG.WAVE_CONFIG.WAVE_DELAY)
    
    this.nextWaveTimer = this.scene.time.delayedCall(
      TOWER_DEFENSE_CONFIG.WAVE_CONFIG.WAVE_DELAY,
      () => {
        this.scene.events.emit('wave-ready')
      }
    )
  }

  public forceStartNextWave(): void {
    if (this.nextWaveTimer) {
      this.nextWaveTimer.destroy()
      this.nextWaveTimer = undefined
    }
    
    this.startNextWave()
  }

  public getCurrentWave(): number {
    return this.currentWave
  }

  public getEnemies(): Enemy[] {
    return this.enemies.filter(enemy => enemy.active)
  }

  public isWaveActive(): boolean {
    return this.waveInProgress || this.isSpawning
  }

  public getWaveProgress(): { current: number; total: number } {
    // For now, just return basic info
    return {
      current: this.currentWave,
      total: -1 // Infinite waves
    }
  }

  public destroy(): void {
    if (this.nextWaveTimer) {
      this.nextWaveTimer.destroy()
    }
    
    this.enemies.forEach(enemy => enemy.destroy())
    this.enemies = []
  }
}

