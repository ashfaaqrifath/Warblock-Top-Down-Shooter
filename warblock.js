// ============================================================
// EVENT EMITTER - Decouples components via events
// ============================================================
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
        SPEED: 200,
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
        REWARD_BASE: 50,
        REWARD_GROWTH: 1.2
    },
    UPGRADES: {
        extendedMag: { cost: 50, maxPurchases: 10, costGrowth: 1.5 },
        highCaliber: { cost: 75, maxPurchases: 5, costGrowth: 1.5 },
        cryoRounds: { cost: 100, maxPurchases: 1, costGrowth: 1.5 },
        quantumDisplacer: { cost: 150, maxPurchases: 1, costGrowth: 1.5 },
        vampiricStrike: { cost: 125, maxPurchases: 1, costGrowth: 1.5 },
        rapidFire: { cost: 80, maxPurchases: 3, costGrowth: 1.5 }
    },
    COLORS: {
        PLAYER: '#4a8a4a',
        ENEMY: '#ff0000',
        HEALTH_BAR_BG: '#333',
        HEALTH_BAR_FILL: '#4a8a4a',
        BULLET: '#ffff88',
        PARTICLE_HIT: '#ff8888',
        PARTICLE_DEATH: '#ff4444',
        CRYO_EFFECT: '#88ccff',
        BACKGROUND: '#0a0a0a',
        GRID: '#1a1a1a'
    }
};

// ============================================================
// AUDIO MANAGER - Handles all audio
// ============================================================
class AudioManager {
    constructor() {
        this.sounds = this.initializeSounds();
    }

    initializeSounds() {
        return {
            shoot: this.createSound({ type: 'shoot', duration: 0.1 }),
            hit: this.createSound({ type: 'hit', duration: 0.15 }),
            death: this.createSound({ type: 'death', duration: 0.3 }),
            reload: this.createSound({ type: 'reload', duration: 0.5 }),
            purchase: this.createSound({ type: 'purchase', duration: 0.4 })
        };
    }

    createSound(config) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = config.duration || 0.2;
        const sampleRate = audioContext.sampleRate;
        const samples = Math.floor(sampleRate * duration);
        const buffer = audioContext.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            let sample = 0;

            if (config.type === 'shoot') {
                sample = Math.random() * 0.3 * Math.exp(-t * 10) * Math.sin(t * 1000);
            } else if (config.type === 'hit') {
                sample = Math.random() * 0.2 * Math.exp(-t * 15) * Math.sin(t * 800);
            } else if (config.type === 'death') {
                sample = Math.random() * 0.4 * Math.exp(-t * 5) * Math.sin(t * 200 + t * t * 1000);
            } else if (config.type === 'reload') {
                sample = 0.1 * Math.sin(t * 400) * Math.exp(-t * 3);
            } else if (config.type === 'purchase') {
                sample = 0.2 * Math.sin(t * 600 + Math.sin(t * 10) * 2) * Math.exp(-t * 2);
            }
            data[i] = sample;
        }
        return buffer;
    }

    play(soundType) {
        const buffer = this.sounds[soundType];
        if (!buffer) return;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    }
}

// ============================================================
// UI MANAGER - Handles all DOM updates
// ============================================================
class UIManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.hud = document.getElementById('hud');
        this.shop = document.getElementById('shop');
        this.reloadBar = document.getElementById('reloadBar');
        this.currentPlayer = null;
        this.currentWaveManager = null;
        this.currentShop = null;
        this.currentCurrency = 0;
        this.setupShopListeners();
        this.setupEventListeners();
    }

    setupShopListeners() {
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const upgradeType = btn.dataset.upgrade;
                this.eventEmitter.emit('upgrade-purchased', { upgradeType });
            });
        });

        document.getElementById('nextWaveBtn').addEventListener('click', () => {
            this.hideShop();
            this.eventEmitter.emit('next-wave-clicked', {});
        });
    }

    setupEventListeners() {
        this.eventEmitter.on('shop-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentWaveManager = data.waveManager;
            this.currentShop = data.shop;
            this.currentCurrency = data.currency;
            this.updateShop(data.shop, data.currency);
            this.updateHUD(data.player, data.waveManager, data.shop, data.currency);
        });

        this.eventEmitter.on('hud-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentWaveManager = data.waveManager;
            this.currentShop = data.shop;
            this.currentCurrency = data.currency;
            this.updateHUD(data.player, data.waveManager, data.shop, data.currency);
        });
    }

    updateHUD(player, waveManager, shop, currency) {
        document.getElementById('waveDisplay').textContent = waveManager.currentWave;
        document.getElementById('currencyDisplay').textContent = currency;
        document.getElementById('ammoDisplay').textContent = `${player.currentAmmo}/${player.magazine}`;
        document.getElementById('healthDisplay').textContent = player.health;

        const upgradeIcons = document.getElementById('upgradeIcons');
        upgradeIcons.innerHTML = '';
        Object.keys(shop.upgrades).forEach(upgradeType => {
            if (shop.hasUpgrade(upgradeType)) {
                const icon = document.createElement('div');
                icon.style.cssText = 'display: inline-block; margin: 2px; padding: 2px 6px; background: #2a4a2a; border: 1px solid #4a7a4a; border-radius: 3px; font-size: 10px;';
                icon.textContent = upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1);
                upgradeIcons.appendChild(icon);
            }
        });
    }

    updateShop(shop, currency) {
        document.getElementById('shopCurrency').textContent = currency;

        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            const upgradeType = btn.dataset.upgrade;
            const upgrade = shop.upgrades[upgradeType];
            const cost = shop.getUpgradeCost(upgradeType);

            btn.querySelector('.cost').textContent = cost;

            if (upgrade.purchased >= upgrade.maxPurchases) {
                btn.disabled = true;
                btn.classList.add('purchased');
                btn.querySelector('.cost').textContent = 'MAX';
            } else if (currency < cost) {
                btn.disabled = true;
                btn.classList.remove('purchased');
            } else {
                btn.disabled = false;
                btn.classList.remove('purchased');
            }
        });
    }

    showShop(shop, currency) {
        this.shop.style.display = 'block';
        this.updateShop(shop, currency);
    }

    hideShop() {
        this.shop.style.display = 'none';
    }

    showReloadBar() {
        this.reloadBar.style.display = 'block';
    }

    hideReloadBar() {
        this.reloadBar.style.display = 'none';
    }

    updateReloadBar(progress) {
        document.getElementById('reloadFill').style.width = progress + '%';
    }
}

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

class Enemy {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.maxHealth = GameConfig.ENEMY.MAX_HEALTH;
        this.health = this.maxHealth;
        this.speed = GameConfig.ENEMY.SPEED;
        this.size = GameConfig.ENEMY.SIZE;
        this.active = true;
        this.aggroTime = 0;
        this.slowEffect = 0;
        this.slowDuration = 0;
    }

    update(deltaTime, playerPos) {
        if (!this.active) return;

        // Update slow effect
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.slowEffect = 0;
            }
        }

        // Simple pathfinding towards player
        const direction = playerPos.subtract(this.position).normalize();
        const currentSpeed = this.speed * (1 - this.slowEffect);
        this.velocity = direction.multiply(currentSpeed);
        this.position = this.position.add(this.velocity.multiply(deltaTime));

        // Update aggro animation
        this.aggroTime += deltaTime * 5;
    }

    takeDamage(damage, upgrades) {
        this.health -= damage;
        
        // Apply effects based on upgrades
        if (upgrades.hasCryo) {
            this.slowEffect = 0.5;
            this.slowDuration = 2.0;
        }

        if (upgrades.hasQuantum && Math.random() < 0.2) {
            this.position = new Vector2(
                Math.random() * GameConfig.CANVAS.WIDTH,
                Math.random() * GameConfig.CANVAS.HEIGHT
            );
        }

        const isDead = this.health <= 0;
        if (isDead) {
            this.active = false;
        }

        return {
            isDead,
            shouldHeal: upgrades.hasVampiric && isDead
        };
    }

    draw(ctx) {
        if (!this.active) return;

        // Draw health bar
        const healthBarY = this.position.y - this.size - 8;
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_BG;
        ctx.fillRect(this.position.x - 15, healthBarY, 30, 4);
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_FILL;
        const healthWidth = (this.health / this.maxHealth) * 30;
        ctx.fillRect(this.position.x - 15, healthBarY, healthWidth, 4);

        // Draw enemy with aggro pulse
        const pulseIntensity = Math.sin(this.aggroTime) * 0.2 + 0.8;
        const red = Math.floor(255 * pulseIntensity);
        ctx.fillStyle = `rgb(${red}, 0, 0)`;
        
        // Add slow effect visual
        if (this.slowDuration > 0) {
            ctx.strokeStyle = GameConfig.COLORS.CRYO_EFFECT;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
        }
        
        ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
    }
}

class Player {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.rotation = 0;
        this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.health = this.maxHealth;
        this.speed = GameConfig.PLAYER.SPEED;
        this.size = GameConfig.PLAYER.SIZE;
        this.magazine = GameConfig.PLAYER.MAGAZINE_BASE;
        this.currentAmmo = GameConfig.PLAYER.MAGAZINE_BASE / 2;
        this.isReloading = false;
        this.reloadTime = GameConfig.PLAYER.RELOAD_TIME;
        this.reloadProgress = 0;
        this.fireRate = GameConfig.PLAYER.FIRE_RATE;
        this.lastShot = 0;
        this.damage = GameConfig.PLAYER.DAMAGE_BASE;
        this.lastContactDamageTime = 0;
    }

    update(deltaTime, mousePos) {
        // Rotation towards mouse
        const direction = mousePos.subtract(this.position);
        this.rotation = Math.atan2(direction.y, direction.x);

        // Movement
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.velocity = this.velocity.multiply(0.8); // Friction

        // Bounds checking
        this.position.x = Math.max(this.size/2, Math.min(GameConfig.CANVAS.WIDTH - this.size/2, this.position.x));
        this.position.y = Math.max(this.size/2, Math.min(GameConfig.CANVAS.HEIGHT - this.size/2, this.position.y));

        // Reload handling
        if (this.isReloading) {
            this.reloadProgress += deltaTime;
            if (this.reloadProgress >= this.reloadTime) {
                this.currentAmmo = this.magazine;
                this.isReloading = false;
                this.reloadProgress = 0;
            }
        }

        // Update fire rate cooldown
        this.lastShot += deltaTime;

        // Update contact damage cooldown
        this.lastContactDamageTime -= deltaTime;
    }

    move(direction) {
        this.velocity = this.velocity.add(direction.multiply(this.speed));
    }

    shoot(mousePos) {
        if (this.isReloading || this.currentAmmo <= 0 || this.lastShot < this.fireRate) {
            return null;
        }

        this.currentAmmo--;
        this.lastShot = 0;

        const direction = mousePos.subtract(this.position).normalize();
        const bullet = new Bullet(this.position.x, this.position.y, direction, this.damage);
        return bullet;
    }

    reload() {
        if (!this.isReloading && this.currentAmmo < this.magazine) {
            this.isReloading = true;
            this.reloadProgress = 0;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx) {
        // Draw health bar
        const healthBarY = this.position.y - this.size - 8;
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_BG;
        ctx.fillRect(this.position.x - 15, healthBarY, 30, 4);
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_FILL;
        const healthWidth = (this.health / this.maxHealth) * 30;
        ctx.fillRect(this.position.x - 15, healthBarY, healthWidth, 4);

        // Draw player
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = GameConfig.COLORS.PLAYER;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Draw direction indicator
        ctx.fillStyle = '#6aaa6a';
        ctx.fillRect(this.size/4, -2, this.size/2, 4);
        ctx.restore();
    }
}

class WaveManager {
    constructor() {
        this.currentWave = 1;
        this.enemiesRemaining = 0;
        this.baseEnemies = GameConfig.WAVE.BASE_ENEMIES;
        this.growthRate = GameConfig.WAVE.GROWTH_RATE;
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.WAVE.SPAWN_INTERVAL;
        this.waveActive = false;
    }

    startWave() {
        this.waveActive = true;
        this.enemiesRemaining = Math.floor(this.baseEnemies * Math.pow(this.growthRate, this.currentWave - 1));
        this.spawnTimer = 0;
    }

    update(deltaTime, enemies) {
        if (!this.waveActive || this.enemiesRemaining <= 0) return;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.enemiesRemaining > 0) {
            enemies.push(this.spawnEnemy());
            this.spawnTimer = 0;
            this.enemiesRemaining--;
        }
    }

    spawnEnemy() {
        // Spawn at random edge
        let x, y;
        const side = Math.floor(Math.random() * 4);
        const offset = GameConfig.ENEMY.SPAWN_OFFSET;
        const w = GameConfig.CANVAS.WIDTH;
        const h = GameConfig.CANVAS.HEIGHT;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * w;
                y = -offset;
                break;
            case 1: // Right
                x = w + offset;
                y = Math.random() * h;
                break;
            case 2: // Bottom
                x = Math.random() * w;
                y = h + offset;
                break;
            case 3: // Left
                x = -offset;
                y = Math.random() * h;
                break;
        }
        return new Enemy(x, y);
    }

    isWaveComplete() {
        return this.waveActive && this.enemiesRemaining <= 0;
    }

    getWaveReward() {
        return Math.floor(GameConfig.WAVE.REWARD_BASE * Math.pow(GameConfig.WAVE.REWARD_GROWTH, this.currentWave - 1));
    }

    completeWave() {
        this.waveActive = false;
        this.currentWave++;
    }
}

class Shop {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.upgrades = this.initializeUpgrades();
    }

    initializeUpgrades() {
        const upgrades = {};
        const config = GameConfig.UPGRADES;
        for (const [key, value] of Object.entries(config)) {
            upgrades[key] = {
                cost: value.cost,
                costGrowth: value.costGrowth,
                purchased: 0,
                maxPurchases: value.maxPurchases
            };
        }
        return upgrades;
    }

    purchaseUpgrade(upgradeType, currency) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade || upgrade.purchased >= upgrade.maxPurchases) return null;

        const cost = this.getUpgradeCost(upgradeType);
        if (currency < cost) return null;

        upgrade.purchased++;
        const effect = this.getUpgradeEffect(upgradeType);
        
        this.eventEmitter.emit('upgrade-applied', {
            upgradeType,
            cost,
            effect
        });

        return { cost, effect };
    }

    getUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return Math.floor(upgrade.cost * Math.pow(upgrade.costGrowth, upgrade.purchased));
    }

    getUpgradeEffect(upgradeType) {
        switch (upgradeType) {
            case 'extendedMag':
                return { type: 'magazine', value: 5 };
            case 'highCaliber':
                return { type: 'damage', value: 1.25 };
            case 'rapidFire':
                return { type: 'fireRate', value: 0.8 };
            case 'cryoRounds':
                return { type: 'cryo', value: true };
            case 'quantumDisplacer':
                return { type: 'quantum', value: true };
            case 'vampiricStrike':
                return { type: 'vampiric', value: true };
            default:
                return { type: 'none', value: null };
        }
    }

    hasUpgrade(upgradeType) {
        return this.upgrades[upgradeType].purchased > 0;
    }
}

// ============================================================
// COLLISION MANAGER - Handles all collision detection
// ============================================================
class CollisionManager {
    constructor(audioManager, eventEmitter) {
        this.audioManager = audioManager;
        this.eventEmitter = eventEmitter;
    }

    checkBulletEnemyCollisions(bullets, enemies, bulletDamage, upgrades, onCollision) {
        bullets.forEach(bullet => {
            if (!bullet.active) return;

            enemies.forEach(enemy => {
                if (!enemy.active) return;

                const distance = bullet.position.distance(enemy.position);
                if (distance < enemy.size / 2 + 2) {
                    bullet.active = false;
                    
                    const result = enemy.takeDamage(bullet.damage, upgrades);

                    // Create hit particles
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 50 + Math.random() * 100;
                        onCollision('particle', {
                            x: enemy.position.x,
                            y: enemy.position.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            color: GameConfig.COLORS.PARTICLE_HIT,
                            life: 0.3,
                            size: 3
                        });
                    }

                    this.audioManager.play('hit');

                    if (result.isDead) {
                        // Death explosion
                        for (let i = 0; i < 15; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 100 + Math.random() * 200;
                            onCollision('particle', {
                                x: enemy.position.x,
                                y: enemy.position.y,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                color: GameConfig.COLORS.PARTICLE_DEATH,
                                life: 0.5,
                                size: 4
                            });
                        }

                        this.audioManager.play('death');
                        onCollision('enemy-death', { shouldHeal: result.shouldHeal });
                    }
                }
            });
        });
    }

    checkEnemyPlayerCollisions(enemies, player, onCollision) {
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            const distance = enemy.position.distance(player.position);
            if (distance < (enemy.size + player.size) / 2) {
                // Player takes damage once
                player.takeDamage(GameConfig.ENEMY.CONTACT_DAMAGE);
                // Enemy dies
                enemy.active = false;
                // Trigger effects (particles, sound)
                if (onCollision) {
                    onCollision('enemy-contact', { enemy, player });
                }
            }
        });
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
        this.currency = 0;
        this.mousePos = new Vector2(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        this.keys = {};
        this.gameState = 'playing'; // 'playing', 'shop', 'gameOver'
        
        this.setupGameEventListeners();
        this.setupCanvasEventListeners();
        this.uiManager.updateHUD(this.player, this.waveManager, this.shop, this.currency);
        this.waveManager.startWave();
    }

    setupGameEventListeners() {
        // Handle upgrade purchase requests from UI
        this.eventEmitter.on('upgrade-purchased', (data) => {
            const result = this.shop.purchaseUpgrade(data.upgradeType, this.currency);
            if (result) {
                this.currency -= result.cost;
                this.applyUpgradeEffect(result.effect);
                this.audioManager.play('purchase');
                this.eventEmitter.emit('shop-updated', {
                    player: this.player,
                    waveManager: this.waveManager,
                    shop: this.shop,
                    currency: this.currency
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
                    this.createMuzzleFlash();
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
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    createMuzzleFlash() {
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
                3
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

        
        // Collision detection with callback for decoupling
        const upgrades = {
            hasVampiric: this.shop.hasUpgrade('vampiricStrike'),
            hasCryo: this.shop.hasUpgrade('cryoRounds'),
            hasQuantum: this.shop.hasUpgrade('quantumDisplacer')
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
        }

        this.eventEmitter.emit('hud-updated', {
            player: this.player,
            waveManager: this.waveManager,
            shop: this.shop,
            currency: this.currency
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
            this.currency += this.waveManager.getWaveReward();
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
            // No currency reward for contact kills
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
    }

    startShop() {
        this.gameState = 'shop';
        this.uiManager.showShop(this.shop, this.currency);
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
