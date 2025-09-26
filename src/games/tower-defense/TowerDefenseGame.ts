import * as Phaser from 'phaser'
import { TowerDefensePreloadScene } from './scenes/PreloadScene'
import { TowerDefenseScene } from './scenes/GameScene'
import { TOWER_DEFENSE_CONFIG } from './config/TowerDefenseConfig'

export async function initializeTowerDefenseGame(parent: HTMLElement): Promise<Phaser.Game> {
  console.log('Initializing Tower Defense game...')

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: TOWER_DEFENSE_CONFIG.SCREEN_WIDTH,
    height: TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT,
    parent: parent,
    backgroundColor: '#001122',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // Нет гравитации для Tower Defense
        debug: false
      }
    },
    scene: [TowerDefensePreloadScene, TowerDefenseScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: TOWER_DEFENSE_CONFIG.SCREEN_WIDTH,
      height: TOWER_DEFENSE_CONFIG.SCREEN_HEIGHT
    },
    render: {
      pixelArt: false,
      antialias: true
    }
  }

  console.log('Creating Phaser game with config:', config)
  const game = new Phaser.Game(config)
  console.log('Phaser game created:', game)

  return game
}
