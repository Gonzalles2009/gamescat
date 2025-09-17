export const GAME_CONFIG = {
  SCREEN_WIDTH: 1200,
  SCREEN_HEIGHT: 800,
  GRAVITY: 750, // Increased gravity for more dynamic jumps
  GROUND_Y: 550,
  
  // Player settings
  PLAYER_SPEED: 180,
  JUMP_VELOCITY: -500,
  PLAYER_SCALE: 3,
  
  // Combat settings
  ATTACK_RANGE: 60,
  ATTACK_DAMAGE: 10,
  MAX_HEALTH: 100,
  COMBO_WINDOW: 800, // milliseconds
  
  // Input mappings
  PLAYER1_CONTROLS: {
    left: 'LEFT',
    right: 'RIGHT',
    up: 'UP',
    down: 'DOWN',
    lightPunch: 'J',
    block: 'K', // заменил heavyPunch на block
    kick: 'L'
  },

  PLAYER2_CONTROLS: {
    left: 'A',
    right: 'D',
    up: 'W',
    down: 'S',
    lightPunch: 'U',
    block: 'I', // заменил heavyPunch на block  
    kick: 'O'
  }
} as const

export const ANIMATION_CONFIGS = {
  IDLE: { frameRate: 6, repeat: -1 },
  WALK: { frameRate: 8, repeat: -1 },
  JUMP: { frameRate: 10, repeat: 0 },
  CROUCH: { frameRate: 4, repeat: 0 },
  
  // Basic Attacks
  LIGHT_PUNCH: { frameRate: 20, repeat: 0, damage: 8, cooldown: 300 },
  BLOCK: { frameRate: 12, repeat: 0, damage: 0, cooldown: 400 }, // заменил HEAVY_PUNCH
  KICK: { frameRate: 16, repeat: 0, damage: 12, cooldown: 500 },
  
  // Special Attacks  
  UPPERCUT: { frameRate: 18, repeat: 0, damage: 20, cooldown: 800 },
  SPINNING_KICK: { frameRate: 24, repeat: 0, damage: 18, cooldown: 1000 },
  POWER_PUNCH: { frameRate: 10, repeat: 0, damage: 25, cooldown: 1200 },
  
  // Combo Attacks
  JAB_CROSS: { frameRate: 22, repeat: 0, damage: 16, cooldown: 700 },
  LOW_HIGH_KICK: { frameRate: 20, repeat: 0, damage: 22, cooldown: 900 },
  
  // Defensive
  HIT: { frameRate: 12, repeat: 0 }
} as const

export const ATTACK_TYPES = {
  LIGHT_PUNCH: 'LIGHT_PUNCH',
  BLOCK: 'BLOCK', // заменил HEAVY_PUNCH на BLOCK
  KICK: 'KICK',
  UPPERCUT: 'UPPERCUT',
  SPINNING_KICK: 'SPINNING_KICK',
  POWER_PUNCH: 'POWER_PUNCH',
  JAB_CROSS: 'JAB_CROSS',
  LOW_HIGH_KICK: 'LOW_HIGH_KICK'
} as const
