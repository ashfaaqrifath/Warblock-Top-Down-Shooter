import { AudioManager } from './audio.js';
import { UIManager } from './uiManager.js';
import { Shop } from './shop.js';
import { Player } from './player.js';
import { WaveManager } from './WaveManager.js';
import { CollisionManager } from './CollisionManager.js';

export { GameConfig, Vector2, Bullet, openPuzzleModal };



// ===========================
// EVENT EMITTER 
// ===========================
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(callback => callback(data));
    }
}

// ============================================================
// CONFIGURATION - Centralized game constants
// ============================================================
const GameConfig = {
    CANVAS: { WIDTH: 800, HEIGHT: 600, GRID_SIZE: 40 },
    PLAYER: {
        SPAWN_X: 400,
        SPAWN_Y: 300,
        SIZE: 12,
        MAX_HEALTH: 100,
        SPEED: 80,
        MAGAZINE_BASE: 30,
        FIRE_RATE: 0.2,
        RELOAD_TIME: 2.0,
        DAMAGE_BASE: 25
    },
    ENEMY: {
        SIZE: 15,
        MAX_HEALTH: 50,
        SPEED: 80,
        CONTACT_DAMAGE: 20,
        SPAWN_OFFSET: 20
    },
    BULLET: { SPEED: 600, SIZE: 4, TRAIL_SIZE: 10 },
    PARTICLE: { DEFAULT_SIZE: 2, FRICTION: 0.98 },
    WAVE: {
        BASE_ENEMIES: 5,
        GROWTH_RATE: 1.3,
        SPAWN_INTERVAL: 1.0,
        REWARD_BASE: 5,
        REWARD_GROWTH: 1
    },
    UPGRADES: {
        extendedMag: { cost: 25, maxPurchases: 10, costGrowth: 1.5 },
        highCaliber: { cost: 50, maxPurchases: 5, costGrowth: 1.5 },
        temporalField: { cost: 80, maxPurchases: 1, costGrowth: 1.5 },
        siphonRounds: { cost: 75, maxPurchases: 1, costGrowth: 1.5 },
        damageImmunity: { cost: 5, maxPurchases: 1, costGrowth: 1.5 },
        empBlast: { cost: 5, maxPurchases: 1, costGrowth: 1.5 }
    },
    COLORS: {
        PLAYER: '#0099ff',
        PLAYER_TEMPORAL: '#00ff84',
        TEMPORAL_BG: '#224488',
        ENEMY: '#ff0000',
        HEALTH_BAR_BG: '#333',
        HEALTH_BAR_FILL: '#4a8a4a',
        BULLET: '#ffff00',
        PARTICLE_HIT: '#ff8888',
        PARTICLE_DEATH: '#ff4444',
        TEMPORAL_EFFECT: '#88cbffa5',
        BACKGROUND: '#0a0a0a',
        GRID: '#1a1a1a'
    },
    TEMPORAL_FIELD: {
        RADIUS: 180,
        DURATION: 5.0,
        COOLDOWN: 10.0,
        SLOW_FACTOR: 0.8  // slowness
    }
};







// Game classes
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        return mag > 0 ? new Vector2(this.x / mag, this.y / mag) : new Vector2(0, 0);
    }

    distance(other) {
        return this.subtract(other).magnitude();
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life, size = GameConfig.PARTICLE.DEFAULT_SIZE) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(vx, vy);
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.life -= deltaTime;
        this.velocity = this.velocity.multiply(GameConfig.PARTICLE.FRICTION);

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, direction, damage = GameConfig.PLAYER.DAMAGE_BASE) {
        this.position = new Vector2(x, y);
        this.velocity = direction.multiply(GameConfig.BULLET.SPEED);
        this.damage = damage;
        this.active = true;
        this.trail = [];
    }

    update(deltaTime) {
        if (!this.active) return;

        // Add trail point
        this.trail.push({ x: this.position.x, y: this.position.y, life: 0.2 });
        if (this.trail.length > GameConfig.BULLET.TRAIL_SIZE) this.trail.shift();

        // Update trail
        this.trail.forEach(point => {
            point.life -= deltaTime;
        });
        this.trail = this.trail.filter(point => point.life > 0);

        this.position = this.position.add(this.velocity.multiply(deltaTime));

        // Check bounds
        if (this.position.x < 0 || this.position.x > GameConfig.CANVAS.WIDTH || 
            this.position.y < 0 || this.position.y > GameConfig.CANVAS.HEIGHT) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        // Draw trail
        this.trail.forEach((point, index) => {
            const alpha = point.life / 0.2;
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = GameConfig.COLORS.BULLET;
            const size = 2 * alpha;
            ctx.fillRect(point.x - size/2, point.y - size/2, size, size);
            ctx.restore();
        });

        // Draw bullet
        ctx.fillStyle = GameConfig.COLORS.BULLET;
        ctx.fillRect(this.position.x - 2, this.position.y - 2, GameConfig.BULLET.SIZE, GameConfig.BULLET.SIZE);
    }
}





class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Event emitter for loose coupling
        this.eventEmitter = new EventEmitter();
        
        // Manager initialization
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager(this.eventEmitter);
        this.collisionManager = new CollisionManager(this.audioManager, this.eventEmitter);
        
        // Game objects
        this.player = new Player(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        this.player.currentAmmo = this.player.magazine;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.waveManager = new WaveManager();
        this.shop = new Shop(this.eventEmitter);
        this.credits = 0;
        this.mousePos = new Vector2(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        this.keys = {};
        this.gameState = 'playing'; // 'playing', 'shop', 'gameOver'

        this.temporalFieldActive = false;
        this.temporalFieldTimer = 0;
        this.temporalFieldCooldown = 0;
        
        this.empBlastCooldown = 0;
        
        this.setupGameEventListeners();
        this.setupCanvasEventListeners();
        this.uiManager.updateHUD(this.player, this.waveManager, this.shop, this.credits);
        this.waveManager.startWave();
    }

    setupGameEventListeners() {
        // Handle upgrade purchase requests from UI
        this.eventEmitter.on('upgrade-purchased', (data) => {
            const result = this.shop.purchaseUpgrade(data.upgradeType, this.credits);
            if (result) {
                this.credits -= result.cost;
                this.applyUpgradeEffect(result.effect);
                this.audioManager.play('purchase');
                this.eventEmitter.emit('shop-updated', {
                    player: this.player,
                    waveManager: this.waveManager,
                    shop: this.shop,
                    credits: this.credits
                });
            }
        });

        // Handle next wave requests from UI
        this.eventEmitter.on('next-wave-clicked', () => {
            // Refill ammo
            this.player.currentAmmo = this.player.magazine;
            // Revive player if dead
            if (this.player.health <= 0) {
                this.player.health = this.player.maxHealth;
            }
            // Cancel any reload
            this.player.isReloading = false;
            this.uiManager.hideReloadBar();

            this.empBlastUsedThisWave = false;

            this.gameState = 'playing';
            this.waveManager.startWave();
        });
    }

    applyUpgradeEffect(effect) {
        switch (effect.type) {
            case 'magazine':
                this.player.magazine += effect.value;
                break;
            case 'damage':
                this.player.damage = Math.floor(this.player.damage * effect.value);
                break;
            case 'fireRate':
                this.player.fireRate *= effect.value;
                break;
            case 'immunity':
                this.player.damageImmunityTimer = effect.value;
                break;
        }
    }

    setupCanvasEventListeners() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = new Vector2(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        });
        

        // Mouse click for shooting
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.gameState === 'playing') {
                const bullet = this.player.shoot(this.mousePos);
                if (bullet) {
                    this.bullets.push(bullet);
                    this.createMuzzleFlash(3);
                    this.audioManager.play('shoot');
                }
            }
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            // Handle restart on Enter when game over
            if (this.gameState === 'gameOver' && e.key === 'Enter') {
                e.preventDefault();
                // Completely reset the game
                game = new Game();
                lastTime = performance.now(); // Reset timing to avoid large delta
                return;
            }

            // Toggle pause/resume with Space when in play/paused states
            if (e.code === 'Space' && (this.gameState === 'playing' || this.gameState === 'paused')) {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                } else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                    // reset timing to avoid large deltaTime after pause
                    if (typeof lastTime !== 'undefined') lastTime = performance.now();
                }
                return;
            }

            this.keys[e.key.toLowerCase()] = true;

            if (e.key.toLowerCase() === 'r' && this.gameState === 'playing') {
                this.player.reload();
                if (this.player.isReloading) {
                    this.uiManager.showReloadBar();
                    this.audioManager.play('reload');
                }
            }

            if (e.key.toLowerCase() === 'i' && this.gameState === 'playing') {
                if (this.shop.hasUpgrade('damageImmunity') && this.player.damageImmunityTimer <= 0) {
                    this.player.damageImmunityTimer = 5;
                }
            }

            if (e.key.toLowerCase() === 'e' && this.gameState === 'playing') {
                if (this.shop.hasUpgrade('empBlast') && this.empBlastCooldown <= 0) {
                    this.activateEmpBlast();
                }
            }

        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    activateTemporalField() {
        if (this.temporalFieldActive || this.temporalFieldCooldown > 0) return;
        this.temporalFieldActive = true;
        this.temporalFieldTimer = GameConfig.TEMPORAL_FIELD.DURATION;
        this.temporalFieldCooldown = GameConfig.TEMPORAL_FIELD.COOLDOWN;
    }

    activateEmpBlast() {
        // Can only be used once per wave, and must own the upgrade
        if (!this.shop.hasUpgrade('empBlast') || this.empBlastUsedThisWave) return;
        this.empBlastUsedThisWave = true;

        const blastRadius = 180;
        const enemiesToRemove = [];

        // Find and kill all enemies within radius
        this.enemies.forEach(enemy => {
            const distance = enemy.position.distance(this.player.position);
            if (distance < blastRadius) {
                enemy.active = false;
                enemiesToRemove.push(enemy);
                this.credits += this.waveManager.getWaveReward(); // give reward
            }
        });

        // ===== Enhanced explosion effect =====
        const centerX = this.player.position.x;
        const centerY = this.player.position.y;

        // Main explosion burst – many particles in red/orange/yellow shades
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            const size = 4 + Math.random() * 6;
            // Random warm color
            const r = 255;
            const g = 100 + Math.floor(Math.random() * 155);
            const b = 0;
            const color = `rgb(${r}, ${g}, ${b})`;

            this.particles.push(new Particle(
                centerX,
                centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                0.8,
                size
            ));
        }

        // Additional shockwave ring (larger, slower particles)
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 150;
            const size = 8;
            this.particles.push(new Particle(
                centerX,
                centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff0000',
                0.6,
                size
            ));
        }

        // Play death sound (already there)
        this.audioManager.play('death');
    }

    createMuzzleFlash(flashSize) {
        for (let i = 0; i < 8; i++) {
            const angle = this.player.rotation + (Math.random() - 0.5) * 0.5;
            const speed = 100 + Math.random() * 150;
            this.particles.push(new Particle(
                this.player.position.x + Math.cos(this.player.rotation) * 15,
                this.player.position.y + Math.sin(this.player.rotation) * 15,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                GameConfig.COLORS.BULLET,
                0.2,
                flashSize
            ));
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        // Handle player movement input
        const moveDirection = new Vector2(0, 0);
        if (this.keys['w']) moveDirection.y -= 1;
        if (this.keys['s']) moveDirection.y += 1;
        if (this.keys['a']) moveDirection.x -= 1;
        if (this.keys['d']) moveDirection.x += 1;

        if (moveDirection.magnitude() > 0) {
            this.player.move(moveDirection.normalize());
        }

        // Handle Temporal Field activation (T key)
        if (this.keys['t'] && this.shop.hasUpgrade('temporalField')) {
            this.activateTemporalField();
            this.keys['t'] = false; // Consume the key press
        }

        // Update game objects
        this.player.update(deltaTime, this.mousePos);
        this.waveManager.update(deltaTime, this.enemies);

        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player.position);
        });
        this.enemies = this.enemies.filter(enemy => enemy.active);

        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
        });
        this.bullets = this.bullets.filter(bullet => bullet.active);

        this.particles.forEach(particle => {
            particle.update(deltaTime);
        });
        this.particles = this.particles.filter(particle => particle.active);

        // Update reload bar UI
        if (this.player.isReloading) {
            const progress = (this.player.reloadProgress / this.player.reloadTime) * 100;
            this.uiManager.updateReloadBar(progress);
        } else {
            this.uiManager.hideReloadBar();
        }

        // ========== NEW: Temporal Field Logic ==========
        // Update timers
        if (this.temporalFieldActive) {
            this.temporalFieldTimer -= deltaTime;
            if (this.temporalFieldTimer <= 0) {
                this.temporalFieldActive = false;
            }
        }
        if (this.temporalFieldCooldown > 0) {
            this.temporalFieldCooldown -= deltaTime;
        }

        // Update EMP Blast cooldown
        if (this.empBlastCooldown > 0) {
            this.empBlastCooldown -= deltaTime;
        }
        // ========== END EMP Blast ==========

        // Apply slow to enemies inside the field
        if (this.temporalFieldActive) {
            const fieldRadius = GameConfig.TEMPORAL_FIELD.RADIUS;
            const slowFactor = GameConfig.TEMPORAL_FIELD.SLOW_FACTOR;
            this.enemies.forEach(enemy => {
                const distance = enemy.position.distance(this.player.position);
                if (distance < fieldRadius) {
                    // Set slow effect – will be reapplied each frame while inside
                    enemy.slowEffect = slowFactor;
                    enemy.slowDuration = 0.1; // short duration so it's continuously reapplied
                }
            });
        }
        // ========== END Temporal Field ==========

        // Reflect temporal field state on player for visuals
        if (this.player) this.player.isTemporalActive = this.temporalFieldActive;

        
        // Collision detection with callback for decoupling
        const upgrades = {
            hasSiphonRounds: this.shop.hasUpgrade('siphonRounds'),
            hasTemporal: this.shop.hasUpgrade('temporalField')
        };

        // Bullet vs enemies
        this.collisionManager.checkBulletEnemyCollisions(
            this.bullets,
            this.enemies,
            this.player.damage,
            upgrades,
            (type, data) => this.handleCollisionEvent(type, data)
        );

        // Enemy vs player (with callback for effects)
        this.collisionManager.checkEnemyPlayerCollisions(
            this.enemies,
            this.player,
            (type, data) => this.handleCollisionEvent(type, data)
        );

        this.collisionManager.checkEnemyPlayerCollisions(
            this.enemies,
            this.player,
            (type, data) => this.handleCollisionEvent(type, data)
        );

        // Check wave completion
        if (this.waveManager.isWaveComplete() && this.enemies.length === 0) {
            this.waveManager.completeWave();
            this.startShop();
        }

        // Check game over
        if (this.player.health <= 0 && this.gameState !== 'gameOver') {
            this.gameState = 'gameOver';
            this.uiManager.hideShop(); // Hide shop if it was open
            
            // Save waves to database
            const wavesReached = this.waveManager.currentWave - 1;
            saveWavesToDatabase(wavesReached);
        }

        this.eventEmitter.emit('hud-updated', {
            player: this.player,
            waveManager: this.waveManager,
            shop: this.shop,
            credits: this.credits
        });
    }

    handleCollisionEvent(type, data) {
        if (type === 'particle') {
            this.particles.push(new Particle(
                data.x, data.y,
                data.vx, data.vy,
                data.color,
                data.life,
                data.size
            ));
        } else if (type === 'enemy-death') {
            this.credits += this.waveManager.getWaveReward();
            if (data.shouldHeal) {
                this.player.heal(5);
            }
        } else if (type === 'enemy-contact') {
            // Enemy died from touching the player – spawn death particles and play sound
            const enemy = data.enemy;
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 200;
                this.particles.push(new Particle(
                    enemy.position.x,
                    enemy.position.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    GameConfig.COLORS.PARTICLE_DEATH,
                    0.5,
                    4
                ));
            }
            this.audioManager.play('death');
            // No credits reward for contact kills
        }
    }

    draw() {
        // Clear canvas with normal background
        this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // If temporal field active, paint a pulsing radial gradient (background only)
        if (this.temporalFieldActive) {
            this.ctx.save();

            const t = (this.player && this.player.pulseTimer) ? this.player.pulseTimer : 0;
            const freq = 3.0; // pulse frequency
            const pulse = (Math.sin(t * freq) + 1) / 2; // 0..1

            // alpha values modulated by pulse
            const alphaInner = 0.45 + pulse * 0.25; // inner brightness
            const alphaOuter = 0.05 + pulse * 0.1;  // outer fade

            // use temporal effect (light blue) for inner color and temporal bg for outer
            const hexInner = GameConfig.COLORS.TEMPORAL_EFFECT.replace('#','');
            const numInner = parseInt(hexInner, 16);
            const ri = (numInner >> 16) & 255;
            const gi = (numInner >> 8) & 255;
            const bi = numInner & 255;

            const hexOuter = GameConfig.COLORS.TEMPORAL_BG.replace('#','');
            const numOuter = parseInt(hexOuter, 16);
            const ro = (numOuter >> 16) & 255;
            const go = (numOuter >> 8) & 255;
            const bo = numOuter & 255;

            const grd = this.ctx.createRadialGradient(
                this.player.position.x, this.player.position.y, 0,
                this.player.position.x, this.player.position.y, GameConfig.TEMPORAL_FIELD.RADIUS
            );
            grd.addColorStop(0, `rgba(${ri},${gi},${bi},${alphaInner})`);
            grd.addColorStop(1, `rgba(${ro},${go},${bo},${alphaOuter})`);

            this.ctx.fillStyle = grd;
            this.ctx.beginPath();
            this.ctx.arc(this.player.position.x, this.player.position.y, GameConfig.TEMPORAL_FIELD.RADIUS, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw grid
        this.ctx.strokeStyle = GameConfig.COLORS.GRID;
        this.ctx.lineWidth = 1;
        const gridSize = GameConfig.CANVAS.GRID_SIZE;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw game objects
        this.particles.forEach(particle => particle.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.player.draw(this.ctx);

        // Draw paused overlay
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Chakra Petch';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

            this.ctx.font = '18px Chakra Petch';
            this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }

        // Draw game over screen
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Chakra Petch';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

            this.ctx.font = '24px Chakra Petch';
            this.ctx.fillText(`Wave Reached: ${this.waveManager.currentWave - 1}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            this.ctx.fillText('Press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 100);  // <-- changed
        }

        // Draw temporal field if active
        if (this.temporalFieldActive) {
            this.ctx.save();
            this.ctx.strokeStyle = '#88ccff'; 
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]); // dashed line for distinction
            this.ctx.beginPath();
            this.ctx.arc(this.player.position.x, this.player.position.y, GameConfig.TEMPORAL_FIELD.RADIUS, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // reset
            this.ctx.restore();
        }
    }

    startShop() {
        this.gameState = 'shop';
        this.uiManager.showShop(this.shop, this.credits);
    }

    startNextWave() {
        this.gameState = 'playing';
        this.waveManager.startWave();
    }
}

// Initialize and start the game
let game;
let lastTime = 0;

function gameLoop(currentTime) {
    if (!game) {
        game = new Game();
    }
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    game.update(deltaTime);
    game.draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ----------------------
// Puzzle modal (in-page)
// ----------------------
let _puzzleModalSolution = null;

async function loadPuzzleModal() {
    const resultEl = document.getElementById('puzzleResult');
    const imgEl = document.getElementById('puzzleImageModal');
    try {
        resultEl.innerHTML = 'Loading...';
        imgEl.src = '';

        const response = await fetch('https://marcconrad.com/uob/heart/api.php?out=json&base64=yes');
        if (!response.ok) throw new Error('Network error ' + response.status);
        const data = await response.json();
        if (!data || !data.question) throw new Error('Invalid puzzle data');

        imgEl.src = 'data:image/png;base64,' + data.question;
        _puzzleModalSolution = data.solution;
        resultEl.innerHTML = '';
    } catch (err) {
        console.error('Puzzle load failed:', err);
        resultEl.innerHTML = '<span class="error">Failed to load API. Try again.</span>';
    }
}

function openPuzzleModal() {
    const modal = document.getElementById('puzzleModal');
    const ans = document.getElementById('answerInputModal');
    const resultEl = document.getElementById('puzzleResult');
    modal.style.display = 'flex';
    ans.value = '';
    resultEl.innerHTML = '';
    loadPuzzleModal();
}

function renderLeaderboard(list) {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    container.innerHTML = '';
    list.sort((a,b) => b.waves - a.waves).forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'leader-item';
        const posEl = document.createElement('span');
        posEl.className = 'pos';
        posEl.textContent = (i+1) + '.';
        const nameEl = document.createElement('span');
        nameEl.className = 'name';
        nameEl.textContent = p.username;
        const wavesEl = document.createElement('span');
        wavesEl.className = 'waves';
        wavesEl.textContent = p.waves;
        item.appendChild(posEl);
        item.appendChild(nameEl);
        item.appendChild(wavesEl);
        container.appendChild(item);
    });
}



function closePuzzleModal() {
    const modal = document.getElementById('puzzleModal');
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('submitBtnModal');
    const closeBtn = document.getElementById('closePuzzleBtn');
    const answerInput = document.getElementById('answerInputModal');

    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            const resultEl = document.getElementById('puzzleResult');
            const val = parseInt(answerInput.value);
            if (isNaN(val)) {
                resultEl.innerHTML = '<span class="error">Please enter a number.</span>';
                return;
            }
            if (val === _puzzleModalSolution) {
                resultEl.innerHTML = '<span class="success">✅ Correct!<br>10 credits + 10 HP gained</span>';

                // Grant rewards to the player if the game is initialized
                if (typeof game !== 'undefined' && game) {
                    game.credits = (game.credits || 0) + 10;
                    if (game.player && typeof game.player.heal === 'function') {
                        game.player.heal(10);
                    }
                    // Update HUD to reflect new credits and health
                    if (game.eventEmitter) {
                        game.eventEmitter.emit('hud-updated', {
                            player: game.player,
                            waveManager: game.waveManager,
                            shop: game.shop,
                            credits: game.credits
                        });
                    }
                }

            } else {
                resultEl.innerHTML = '<span class="error">❌ Incorrect. Try again.</span>';
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closePuzzleModal);
    }

    if (answerInput) {
        answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('submitBtnModal').click();
            }
        });
    }



    
    // Load and render leaderboard from database
    loadLeaderboardData();
});

// ============================================================
// SUPABASE AUTHENTICATION & LEADERBOARD
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://rnkjnwgkbntinkhgrbpm.supabase.co"
const SUPABASE_KEY = "sb_publishable_mSMt53nucVEn5liO4sZuSQ_Xm_sX4Nz"

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

async function loadUsername(){

    const { data: sessionData } = await supabase.auth.getSession()


    const email = sessionData.session.user.email

    const { data, error } = await supabase
        .from("leaderboard")
        .select("username, waves")
        .eq("email", email)
        .single()

    if(data){
        document.getElementById("usernameDisplay").textContent = data.username
        document.getElementById("wavesDisplay").textContent = data.waves
    }else{
        document.getElementById("usernameDisplay").textContent = "Username not found"
    }

}

async function saveWavesToDatabase(wavesReached) {
    try {
        const { data: sessionData } = await supabase.auth.getSession()
        

        const email = sessionData.session.user.email

        // Get the current user's record
        const { data: existingData, error: fetchError } = await supabase
            .from("leaderboard")
            .select("waves")
            .eq("email", email)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error fetching user data:", fetchError)
            return
        }

        // Only update if the new waves count is higher than the current one
        const currentWaves = existingData?.waves || 0
        if (wavesReached > currentWaves) {
            const { error: updateError } = await supabase
                .from("leaderboard")
                .update({ waves: wavesReached })
                .eq("email", email)

            if (updateError) {
                console.error("Error updating waves:", updateError)
            } else {
                // Update the UI to show the new highscore
                document.getElementById("wavesDisplay").textContent = wavesReached
            }
        } else {
            console.log(`Less than highscore (${currentWaves})`)
        }
    } catch (error) {
        console.error("Error in saveWavesToDatabase:", error)
    }
}

loadUsername()

async function loadLeaderboardData() {
    try {
        const { data, error } = await supabase
            .from("leaderboard")
            .select("username, waves")
            .order("waves", { ascending: false })

        if (error) {
            console.error("Error loading leaderboard:", error)
            return
        }

        if (data && data.length > 0) {
            renderLeaderboard(data)
        }
    } catch (err) {
        console.error("Error in loadLeaderboardData:", err)
    }
}

document.getElementById("logoutBtn").onclick = async () => {
    await supabase.auth.signOut()
    window.location.href = "index.html"
}
