import * as Phaser from 'phaser'
import { TowerDefensePreloadScene } from './scenes/PreloadScene'
import { TowerDefenseGameScene } from './scenes/GameScene'
import { TOWER_DEFENSE_CONFIG } from './config/TowerDefenseConfig'

export async function initializeTowerDefenseGame(parent: HTMLElement): Promise<Phaser.Game> {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: TOWER_DEFENSE_CONFIG.SCREEN_WIDTH,
    height: TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT,
    parent: parent,
    backgroundColor: '#1a202c',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // No gravity for tower defense
        debug: false
      }
    },
    scene: [TowerDefensePreloadScene, TowerDefenseGameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: TOWER_DEFENSE_CONFIG.SCREEN_WIDTH,
      height: TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT
    },
    render: {
      pixelArt: false, // Smooth graphics for tower defense
      antialias: true
    }
  }

  return new Phaser.Game(config)
}

