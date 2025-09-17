import * as Phaser from 'phaser'
import { GAME_CONFIG, ANIMATION_CONFIGS, ATTACK_TYPES } from '../config/GameConfig'

export enum FighterState {
  IDLE = 'idle',
  WALKING = 'walking',
  JUMPING = 'jumping',
  CROUCHING = 'crouching',
  ATTACKING = 'attacking',
  HIT = 'hit',
  BLOCKING = 'blocking'
}

export class Fighter extends Phaser.Physics.Arcade.Sprite {
  public health: number = GAME_CONFIG.MAX_HEALTH
  public maxHealth: number = GAME_CONFIG.MAX_HEALTH
  public playerId: number
  public state: FighterState = FighterState.IDLE
  public healthBar?: Phaser.GameObjects.Graphics
  public healthBarBg?: Phaser.GameObjects.Graphics
  public healthBarBorder?: Phaser.GameObjects.Rectangle
  public portrait?: Phaser.GameObjects.Graphics
  public comboText?: Phaser.GameObjects.Text
  public roundWins: number = 0
  public currentCombo: number = 0
  public opponent?: Fighter
  
  private attackCooldown: number = 0
  private hitStun: number = 0
  private comboCount: number = 0
  private lastAttackTime: number = 0
  public facingRight: boolean = true
  private isAttacking: boolean = false
  public isBlocking: boolean = false // Simple boolean instead of state - made public for access
  private attackBox?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc
  private shieldBox?: Phaser.GameObjects.Rectangle
  private color: number

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    texture: string, 
    playerId: number,
    color: number
  ) {
    super(scene, x, y, texture)
    
    console.log(`Creating Fighter ${playerId} at (${x}, ${y}) with texture: ${texture}`)
    
    this.playerId = playerId
    this.color = color
    this.facingRight = playerId === 2 // Player2 (left) faces right, Player1 (right) faces left
    
    // Add to scene
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    // Set up physics body - убираем все offset'ы
    const body = this.body as Phaser.Physics.Arcade.Body
    // Оригинальный спрайт 32x48, с scale=3 becomes ~96x144
    body.setSize(32, 48) // Точно по размеру оригинального спрайта
    // Убираем setOffset полностью - пусть физическое тело точно совпадает со спрайтом
    body.setCollideWorldBounds(true)
    this.setScale(GAME_CONFIG.PLAYER_SCALE)
    this.setTint(color)
    
    // Debug: make sure sprite is visible
    this.setVisible(true)
    this.setActive(true)
    this.setAlpha(1.0)
    
    // Set initial facing direction  
    if (this.facingRight) {
      this.setFlipX(true) // Flip to face right (sprite defaults to left)
    }
    
    
    
    // Render above ground and align feet to ground line
    this.setOrigin(0.5, 1)
    this.setDepth(10)

    // Start inactive, will be activated when game starts
    this.setActive(false)

    // Play idle animation
    const fighterKey = playerId === 1 ? 'fighter1' : 'fighter2'
    const idleAnimKey = `${fighterKey}-idle`
    if (this.scene.anims.exists(idleAnimKey)) {
      this.play(idleAnimKey)
    }
    
  }

  public setOpponent(opponent: Fighter) {
    this.opponent = opponent
  }

  public resetFighter(x: number, y: number) {
    this.setPosition(x, y)
    this.health = this.maxHealth
    this.state = FighterState.IDLE
    this.attackCooldown = 0
    this.hitStun = 0
    this.comboCount = 0
    this.currentCombo = 0
    this.isAttacking = false
    this.isBlocking = false // Reset blocking flag
    this.setVelocity(0, 0)
    this.setTint(this.color)
    this.setActive(false)
    
    if (this.attackBox) { this.attackBox.destroy(); this.attackBox = undefined }
    if (this.shieldBox) { this.shieldBox.destroy(); this.shieldBox = undefined }
    
    if (this.comboText) {
      this.comboText.setVisible(false)
    }
  }

  public canMove(): boolean {
    return this.hitStun <= 0 && !this.isAttacking && !this.isBlocking
  }

  public moveLeft() {
    if (!this.canMove()) return
    
    this.setVelocityX(-GAME_CONFIG.PLAYER_SPEED)
    this.state = FighterState.WALKING
    this.facingRight = false
    this.setFlipX(false) // No flip = face left (default)
    
    // Play walk animation
    this.playStateAnimation()
  }

  public moveRight() {
    if (!this.canMove()) return
    
    this.setVelocityX(GAME_CONFIG.PLAYER_SPEED)
    this.state = FighterState.WALKING
    this.facingRight = true
    this.setFlipX(true) // Flip to face right
    
    // Play walk animation
    this.playStateAnimation()
  }

  public stopMoving() {
    if (!this.canMove()) return
    
    // Forcefully stop horizontal movement
    this.setVelocityX(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body) {
      body.velocity.x = 0 // Extra safety to ensure full stop
    }
    
    if (body && body.touching.down) {
      this.state = FighterState.IDLE
      // Return to idle animation
      this.playStateAnimation()
    }
  }

  public jump() {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!this.canMove() || !body || !body.touching.down) return
    
    this.setVelocityY(GAME_CONFIG.JUMP_VELOCITY)
    this.state = FighterState.JUMPING
  }

  public crouch() {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!this.canMove() || !body || !body.touching.down) return
    
    this.state = FighterState.CROUCHING
    this.setVelocityX(0)
  }

  public lightPunch() {
    if (!this.canAttack()) return
    this.performAnimatedAttack(ATTACK_TYPES.LIGHT_PUNCH)
  }

  public startBlocking() {
    if (this.hitStun > 0 || this.isAttacking) return
    
    if (!this.isBlocking) {
      this.isBlocking = true
      this.setVelocityX(0)

      // Play static block animation (does not loop spam)
      const fighterKey = this.playerId === 1 ? 'fighter1' : 'fighter2'
      const blockAnimKey = `${fighterKey}-block`
      if (this.scene.anims.exists(blockAnimKey)) {
        this.play(blockAnimKey)
      }

      // Create visual shield
      this.createBlockShield()
    }
  }

  public stopBlocking() {
    if (this.isBlocking) {
      this.isBlocking = false

      // Remove block shield
      if (this.shieldBox) { this.shieldBox.destroy(); this.shieldBox = undefined }

      // Return to idle animation
      const fighterKey = this.playerId === 1 ? 'fighter1' : 'fighter2'
      const idleKey = `${fighterKey}-idle`
      if (this.scene.anims.exists(idleKey)) {
        this.play(idleKey)
      }
    }
  }

  private createBlockShield() {
    // Remove existing shield
    if (this.shieldBox) { this.shieldBox.destroy(); this.shieldBox = undefined }

    const forwardAnchorX = this.x + (this.facingRight ? this.width / 2 : -this.width / 2)
    const direction = this.facingRight ? 1 : -1

    const posX = forwardAnchorX + direction * 10
    const posY = this.y - 35

    // Green translucent rectangle as shield
    this.shieldBox = this.scene.add.rectangle(posX, posY, 80, 70, 0x00FF88, 0.7)
  }

  public kick() {
    if (!this.canAttack()) return
    this.performAnimatedAttack(ATTACK_TYPES.KICK)
  }

  // NEW SPECIAL ATTACKS
  public uppercut() {
    if (!this.canAttack()) return
    this.performAnimatedAttack(ATTACK_TYPES.UPPERCUT)
  }

  public spinningKick() {
    if (!this.canAttack()) return
    this.performAnimatedAttack(ATTACK_TYPES.SPINNING_KICK)
  }

  public powerPunch() {
    if (!this.canAttack()) return
    this.performAnimatedAttack(ATTACK_TYPES.POWER_PUNCH)
  }

  private canAttack(): boolean {
    return this.attackCooldown <= 0 && this.hitStun <= 0 && !this.isAttacking
  }

  private performAnimatedAttack(attackType: keyof typeof ATTACK_TYPES) {
    const config = ANIMATION_CONFIGS[attackType]
    if (!config) return

    this.isAttacking = true
    this.state = FighterState.ATTACKING
    this.attackCooldown = (config as any).cooldown || 300
    this.setVelocityX(0)

    // Get animation key
    const fighterKey = this.playerId === 1 ? 'fighter1' : 'fighter2'
    const animKey = `${fighterKey}-${attackType.toLowerCase().replace('_', '-')}`
    
    // Play attack animation
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey)
      
      // Listen for animation complete
      this.once('animationcomplete', () => {
        this.isAttacking = false
        this.returnToIdle()
        
        // Clean up attack box
        if (this.attackBox) {
          this.attackBox.destroy()
          this.attackBox = undefined
        }
      })
    }

    // Create attack hitbox at the right moment
    const strikeDelay = attackType === ATTACK_TYPES.POWER_PUNCH ? 400 :
                        attackType === ATTACK_TYPES.BLOCK ? 0 : 100
    
    this.scene.time.delayedCall(strikeDelay, () => {
      if (this.isAttacking) { // Only if attack wasn't cancelled
        this.createAttackBox(attackType, (config as any).damage || 10)
        
        // Remove hitbox after brief period
        this.scene.time.delayedCall(100, () => {
          if (this.attackBox) {
            this.attackBox.destroy()
            this.attackBox = undefined
          }
        })
      }
    })

    // Special effects for different attacks
    this.addAttackEffects(attackType)
  }

  private addAttackEffects(attackType: keyof typeof ATTACK_TYPES) {
    switch (attackType) {
      case ATTACK_TYPES.POWER_PUNCH:
        // Screen shake for power punch
        this.scene.cameras.main.shake(300, 0.02)
        break
      
      case ATTACK_TYPES.UPPERCUT:
        // Small screen shake + upward particle effect
        this.scene.cameras.main.shake(150, 0.015)
        break
        
      case ATTACK_TYPES.SPINNING_KICK:
        // Rotation effect
        this.scene.tweens.add({
          targets: this,
          angle: this.facingRight ? 360 : -360,
          duration: 300,
          onComplete: () => { this.angle = 0 }
        })
        break
    }
  }

  private playStateAnimation() {
    // Don't interrupt attack animations
    if (this.isAttacking) return

    const fighterKey = this.playerId === 1 ? 'fighter1' : 'fighter2'
    let animKey = ''

    // Determine animation based on current state
    switch (this.state) {
      case FighterState.IDLE:
        animKey = `${fighterKey}-idle`
        break
      case FighterState.WALKING:
        animKey = `${fighterKey}-walk`
        break
      case FighterState.JUMPING:
        animKey = `${fighterKey}-idle` // Use idle for jumping (or add jump anim later)
        break
      case FighterState.CROUCHING:
        animKey = `${fighterKey}-idle` // Use idle for crouching (or add crouch anim later)
        break
      case FighterState.HIT:
        animKey = `${fighterKey}-hit`
        break
      case FighterState.BLOCKING:
        animKey = `${fighterKey}-block`
        break
      default:
        animKey = `${fighterKey}-idle`
        break
    }

    // Always ensure correct animation is playing for current state
    if (this.scene.anims.exists(animKey)) {
      const currentAnimKey = this.anims.currentAnim?.key
      
      if (currentAnimKey !== animKey) {
        const body = this.body as Phaser.Physics.Arcade.Body
        // console.log(`Player ${this.playerId}: State=${this.state}, VelX=${body?.velocity.x.toFixed(1)}, Switching: ${currentAnimKey} → ${animKey}`)
        
        // FORCE stop current animation and start new one
        this.anims.stop()
        this.play(animKey, true) // true = restart if already playing
      }
    }
  }

  private returnToIdle() {
    if (this.health > 0) {
      this.state = FighterState.IDLE
      this.playStateAnimation()
    }
  }

  private createAttackBox(attackType: keyof typeof ATTACK_TYPES, damage: number) {
    let boxWidth, boxHeight, color, alpha = 0.4

    // Base forward anchor at the front edge of the sprite (origin 0.5,1)
    const forwardAnchorX = this.x + (this.facingRight ? this.width / 2 : -this.width / 2)
    const direction = this.facingRight ? 1 : -1

    // Different visuals for each attack type
    switch (attackType) {
      case ATTACK_TYPES.LIGHT_PUNCH:
        boxWidth = 30; boxHeight = 30; color = 0xFFD700; alpha = 0.6
        break
      case ATTACK_TYPES.KICK:
        boxWidth = GAME_CONFIG.ATTACK_RANGE; boxHeight = 60; color = 0x00AAFF; alpha = 0.5
        break
      case ATTACK_TYPES.BLOCK:
        boxWidth = 80; boxHeight = 70; color = 0x00FF88; alpha = 0.7
        break
      case ATTACK_TYPES.UPPERCUT:
        boxWidth = 50; boxHeight = 80; color = 0xFF8800; alpha = 0.6
        break
      case ATTACK_TYPES.SPINNING_KICK:
        boxWidth = 90; boxHeight = 90; color = 0xFF00FF; alpha = 0.5
        break
      case ATTACK_TYPES.POWER_PUNCH:
        boxWidth = GAME_CONFIG.ATTACK_RANGE * 1.5; boxHeight = 50; color = 0xFF0000; alpha = 0.8
        break
      default:
        boxWidth = GAME_CONFIG.ATTACK_RANGE; boxHeight = 40; color = 0xFF0000
        break
    }

    // Symmetric offsets relative to forward anchor
    let dx = 0
    let dy = 0
    switch (attackType) {
      case ATTACK_TYPES.LIGHT_PUNCH: dx = 20; dy = -35; break
      case ATTACK_TYPES.KICK: dx = 15; dy = -15; break
      case ATTACK_TYPES.BLOCK: dx = 10; dy = -35; break
      case ATTACK_TYPES.UPPERCUT: dx = 10; dy = -50; break
      case ATTACK_TYPES.SPINNING_KICK: dx = 0; dy = -20; break
      case ATTACK_TYPES.POWER_PUNCH: dx = 30; dy = -30; break
      default: dx = 15; dy = -20; break
    }

    const posX = forwardAnchorX + direction * dx
    const posY = this.y + dy

    if (attackType === ATTACK_TYPES.SPINNING_KICK) {
      this.attackBox = this.scene.add.circle(
        posX,
        posY,
        boxWidth / 2,
        color,
        alpha
      )
    } else {
      this.attackBox = this.scene.add.rectangle(
        posX,
        posY,
        boxWidth,
        boxHeight,
        color,
        alpha
      )
    }
    
    // Only deal damage if it's not a block
    if (attackType !== ATTACK_TYPES.BLOCK && this.opponent && this.isHitting(this.opponent)) {
      this.opponent.takeDamage(damage)
      this.onSuccessfulHit()
    }
  }

  private isHitting(target: Fighter): boolean {
    if (!this.attackBox) return false
    
    const attackBounds = (this.attackBox as any).getBounds() // Safe cast for both Rectangle and Arc
    const targetBounds = target.getBounds()
    
    return Phaser.Geom.Rectangle.Overlaps(attackBounds, targetBounds)
  }

  private onSuccessfulHit() {
    // Combo system
    const currentTime = this.scene.time.now
    if (currentTime - this.lastAttackTime < GAME_CONFIG.COMBO_WINDOW) {
      this.comboCount++
      this.currentCombo = this.comboCount
    } else {
      this.comboCount = 1
      this.currentCombo = 1
    }
    this.lastAttackTime = currentTime
    
    // Screen shake on hit
    this.scene.cameras.main.shake(100, 0.01)
    
    // Reset combo after delay if no more hits
    this.scene.time.delayedCall(GAME_CONFIG.COMBO_WINDOW, () => {
      this.currentCombo = 0
    })
  }

  public takeDamage(damage: number) {
    if (this.hitStun > 0) return // Already in hit stun
    
    // Fully block damage when blocking
    if (this.isBlocking) {
      // Visual feedback for successful block
      this.setTint(0x00FF88) // Flash green
      this.scene.time.delayedCall(150, () => {
        this.setTint(this.color)
      })
      
      // Minor pushback but no hit stun when blocking
      const knockbackForce = (this.opponent?.facingRight ? 30 : -30)
      this.setVelocityX(knockbackForce)
      
      // Screen shake for blocked hit
      this.scene.cameras.main.shake(50, 0.005)
      
      return // Exit early, no health reduction or hit stun when blocking
    }
    
    this.health = Math.max(0, this.health - damage)
    this.hitStun = 300 // 300ms of hit stun
    this.state = FighterState.HIT
    
    // Play hit animation
    this.playStateAnimation()
    
    // Knockback
    const knockbackForce = this.opponent?.facingRight ? 100 : -100
    this.setVelocityX(knockbackForce)
    
    // Visual feedback
    this.setTint(0xff0000) // Flash red
    this.scene.time.delayedCall(100, () => {
      this.setTint(this.color)
    })
    
    // Check for KO
    if (this.health <= 0) {
      this.onKO()
    }
  }

  private onKO() {
    this.state = FighterState.HIT
    this.setVelocity(0, 0)
    this.setTint(0x666666) // Gray out
    
    // Notify scene about KO (opponent wins the round)
    if (this.scene && this.opponent) {
      this.scene.events.emit('round-ko', this.opponent.playerId)
    }
    
    // Deactivate fighters briefly
    this.setActive(false)
    if (this.opponent) this.opponent.setActive(false)
  }

  update(time: number, delta: number) {
    // Update timers
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta)
    }
    
    if (this.hitStun > 0) {
      this.hitStun = Math.max(0, this.hitStun - delta)
      if (this.hitStun === 0 && this.health > 0) {
        this.state = FighterState.IDLE
        this.playStateAnimation()
      }
    }
    
    const body = this.body as Phaser.Physics.Arcade.Body
    if (this.opponent && !this.isAttacking && this.canMove()) {
      if (this.opponent.x > this.x && !this.facingRight) {
        this.facingRight = true
        this.setFlipX(true)
      } else if (this.opponent.x < this.x && this.facingRight) {
        this.facingRight = false
        this.setFlipX(false)
      }
    }
    
    if (!this.isAttacking && this.hitStun === 0) {
      const prevState = this.state
      
      if (body && Math.abs(body.velocity.y) > 1) {
        this.state = FighterState.JUMPING
      } else if (body && body.touching.down) {
        if (Math.abs(body.velocity.x) < 5) {
          this.state = FighterState.IDLE
        } else {
          this.state = FighterState.WALKING
        }
      }
      
      if (prevState !== this.state) {
        this.playStateAnimation()
      }
    }

    // Update shield position while blocking (track fighter) - symmetric
    if (this.isBlocking && this.shieldBox) {
      const forwardAnchorX = this.x + (this.facingRight ? this.width / 2 : -this.width / 2)
      const direction = this.facingRight ? 1 : -1
      const posX = forwardAnchorX + direction * 10
      const posY = this.y - 35
      this.shieldBox.setPosition(posX, posY)
    } else if (!this.isBlocking && this.shieldBox) {
      // Safety: ensure shield does not linger
      this.shieldBox.destroy(); this.shieldBox = undefined
    }
  }
}




