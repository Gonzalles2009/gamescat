export const TOWER_DEFENSE_CONFIG = {
  // Screen settings
  SCREEN_WIDTH: 1200,
  SCREEN_HEIGHT: 800,
  
  // Game settings
  INITIAL_HEALTH: 20,
  INITIAL_MONEY: 100,
  
  // Grid settings
  GRID_SIZE: 40,
  PATH_WIDTH: 40,
  
  // Tower settings
  TOWER_TYPES: {
    BASIC: {
      name: 'Basic Tower',
      cost: 20,
      damage: 10,
      range: 100,
      fireRate: 1000, // milliseconds
      color: 0x00ff00,
      projectileSpeed: 200
    },
    CANNON: {
      name: 'Cannon Tower',
      cost: 50,
      damage: 25,
      range: 120,
      fireRate: 1500,
      color: 0xff0000,
      projectileSpeed: 150
    },
    LASER: {
      name: 'Laser Tower',
      cost: 80,
      damage: 15,
      range: 150,
      fireRate: 500,
      color: 0x0000ff,
      projectileSpeed: 400
    }
  },
  
  // Enemy settings
  ENEMY_TYPES: {
    BASIC: {
      name: 'Basic Enemy',
      health: 30,
      speed: 50,
      reward: 10,
      color: 0xff6666,
      size: 15
    },
    FAST: {
      name: 'Fast Enemy',
      health: 20,
      speed: 80,
      reward: 15,
      color: 0xffff66,
      size: 12
    },
    TANK: {
      name: 'Tank Enemy',
      health: 80,
      speed: 30,
      reward: 25,
      color: 0x666666,
      size: 20
    }
  },
  
  // Wave settings
  WAVE_CONFIG: {
    BASE_ENEMIES: 5,
    ENEMY_INCREMENT: 2,
    WAVE_DELAY: 3000, // milliseconds between waves
    ENEMY_SPAWN_DELAY: 800, // milliseconds between enemy spawns
    PREPARATION_TIME: 10000 // time to prepare before first wave
  },
  
  // Path points (aligned to grid centers - GRID_SIZE = 40, centers at 20, 60, 100, 140, etc.)
  PATH_POINTS: [
    { x: 0, y: 460 },      // Start (left side) - y=460 (11.5 * 40 = 460)
    { x: 300, y: 460 },    // Point 1 - x=300 (7.5 * 40), y=460
    { x: 300, y: 260 },    // Point 2 (up) - x=300, y=260 (6.5 * 40)
    { x: 580, y: 260 },    // Point 3 (right) - x=580 (14.5 * 40), y=260
    { x: 580, y: 580 },    // Point 4 (down) - x=580, y=580 (14.5 * 40)
    { x: 900, y: 580 },    // Point 5 (right) - x=900 (22.5 * 40), y=580
    { x: 900, y: 460 },    // Point 6 (up) - x=900, y=460
    { x: 1200, y: 460 }    // End (right side) - x=1200 (30 * 40), y=460
  ],
  
  // UI settings
  UI: {
    TOP_PANEL_HEIGHT: 80,     // Верхняя панель с кнопками и информацией
    BOTTOM_PANEL_HEIGHT: 100, // Нижняя панель с башнями
    BUTTON_WIDTH: 80,
    BUTTON_HEIGHT: 60,
    TOWER_PANEL_Y: 720,
    GAME_AREA_Y: 80          // Игровое поле начинается после верхней панели
  }
} as const

export const ANIMATIONS = {
  TOWER_SHOOT: { frameRate: 10, repeat: 0 },
  ENEMY_WALK: { frameRate: 8, repeat: -1 },
  ENEMY_DIE: { frameRate: 12, repeat: 0 },
  EXPLOSION: { frameRate: 15, repeat: 0 }
} as const

export type TowerType = keyof typeof TOWER_DEFENSE_CONFIG.TOWER_TYPES
export type EnemyType = keyof typeof TOWER_DEFENSE_CONFIG.ENEMY_TYPES
