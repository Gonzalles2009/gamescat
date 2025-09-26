export const TOWER_DEFENSE_CONFIG = {
  // Размеры игрового поля
  SCREEN_WIDTH: 1400,
  SCREEN_HEIGHT: 800,
  GROUND_Y: 700,

  // Настройки игры
  BASE_HEALTH: 20,
  STARTING_MONEY: 100,
  MONEY_PER_KILL: 10,

  // Настройки врагов
  ENEMY_BASE_SPEED: 50,
  ENEMY_BASE_HEALTH: 50,
  ENEMY_BASE_REWARD: 15,

  // Настройки башен
  TOWER_BASE_DAMAGE: 25,
  TOWER_BASE_RANGE: 120,
  TOWER_BASE_FIRE_RATE: 1000, // ms between shots

  // Настройки волн
  WAVE_SPAWN_DELAY: 500, // ms between enemy spawns
  WAVE_START_DELAY: 3000, // ms before wave starts

  // Путь врагов (простой прямой путь для начала)
  PATH: [
    { x: 0, y: 500 },      // Старт слева
    { x: 300, y: 500 },    // Прямо
    { x: 300, y: 300 },    // Вверх
    { x: 800, y: 300 },    // Прямо
    { x: 800, y: 600 },    // Вниз
    { x: 1200, y: 600 },   // Прямо
    { x: 1400, y: 600 }    // Финиш
  ]
} as const

// Типы врагов
export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  TANK = 'TANK',
  FLYING = 'FLYING'
}

export const ENEMY_CONFIGS = {
  [EnemyType.BASIC]: {
    name: 'Basic Enemy',
    health: 50,
    speed: 50,
    reward: 15,
    color: 0xff0000,
    scale: 1.0
  },
  [EnemyType.FAST]: {
    name: 'Fast Enemy',
    health: 30,
    speed: 80,
    reward: 20,
    color: 0x00ff00,
    scale: 0.8
  },
  [EnemyType.TANK]: {
    name: 'Tank Enemy',
    health: 150,
    speed: 25,
    reward: 40,
    color: 0x666666,
    scale: 1.5
  },
  [EnemyType.FLYING]: {
    name: 'Flying Enemy',
    health: 40,
    speed: 60,
    reward: 25,
    color: 0xff00ff,
    scale: 1.2
  }
} as const

// Типы башен
export enum TowerType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  CANNON = 'CANNON',
  FROST = 'FROST'
}

export const TOWER_CONFIGS = {
  [TowerType.BASIC]: {
    name: 'Basic Tower',
    damage: 25,
    range: 120,
    fireRate: 1000,
    cost: 50,
    color: 0x00ff00,
    projectileType: 'basic'
  },
  [TowerType.SNIPER]: {
    name: 'Sniper Tower',
    damage: 50,
    range: 200,
    fireRate: 2000,
    cost: 100,
    color: 0xffaa00,
    projectileType: 'sniper'
  },
  [TowerType.CANNON]: {
    name: 'Cannon Tower',
    damage: 75,
    range: 100,
    fireRate: 1500,
    cost: 150,
    color: 0x666666,
    projectileType: 'cannon'
  },
  [TowerType.FROST]: {
    name: 'Frost Tower',
    damage: 15,
    range: 100,
    fireRate: 800,
    cost: 80,
    color: 0x0088ff,
    projectileType: 'frost'
  }
} as const

// Типы снарядов
export enum ProjectileType {
  BASIC = 'BASIC',
  SNIPER = 'SNIPER',
  CANNON = 'CANNON',
  FROST = 'FROST'
}

export const PROJECTILE_CONFIGS = {
  [ProjectileType.BASIC]: {
    speed: 300,
    color: 0xffff00,
    size: 4
  },
  [ProjectileType.SNIPER]: {
    speed: 500,
    color: 0xff6600,
    size: 3
  },
  [ProjectileType.CANNON]: {
    speed: 200,
    color: 0x333333,
    size: 8
  },
  [ProjectileType.FROST]: {
    speed: 250,
    color: 0x88ddff,
    size: 5
  }
} as const

// Конфигурация волн
export const WAVE_CONFIGS = [
  // Wave 1
  {
    enemies: [
      { type: EnemyType.BASIC, count: 5 },
    ]
  },
  // Wave 2
  {
    enemies: [
      { type: EnemyType.BASIC, count: 8 },
      { type: EnemyType.FAST, count: 2 },
    ]
  },
  // Wave 3
  {
    enemies: [
      { type: EnemyType.BASIC, count: 10 },
      { type: EnemyType.FAST, count: 5 },
    ]
  },
  // Wave 4
  {
    enemies: [
      { type: EnemyType.BASIC, count: 8 },
      { type: EnemyType.TANK, count: 2 },
    ]
  },
  // Wave 5
  {
    enemies: [
      { type: EnemyType.BASIC, count: 15 },
      { type: EnemyType.FAST, count: 8 },
      { type: EnemyType.TANK, count: 3 },
    ]
  }
] as const

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  WAVE_COMPLETE: 'WAVE_COMPLETE'
} as const

export type GameState = typeof GAME_STATES[keyof typeof GAME_STATES]
