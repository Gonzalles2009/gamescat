import * as Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { GameScene } from './scenes/GameScene'
import { GAME_CONFIG } from './config/GameConfig'

export async function initializeFighterGame(parent: HTMLElement): Promise<Phaser.Game> {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.SCREEN_WIDTH,
    height: GAME_CONFIG.SCREEN_HEIGHT,
    parent: parent,
    backgroundColor: '#1a1a1a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: GAME_CONFIG.GRAVITY },
        debug: false // Disabled debug mode for cleaner look
      }
    },
    scene: [PreloadScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_CONFIG.SCREEN_WIDTH,
      height: GAME_CONFIG.SCREEN_HEIGHT
    },
    render: {
      pixelArt: true,
      antialias: false
    }
  }

  return new Phaser.Game(config)
}




