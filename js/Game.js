import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { Shop } from './Shop.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { CollisionManager } from './CollisionManager.js';
import { GameConfig } from './Config.js';
import { Vector2 } from './Vector.js';
import { Particle } from './Particle.js';
import { EventEmitter } from './EventEmitter.js';



export class Game {
    constructor(onGameOver) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.eventEmitter = new EventEmitter();
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager(this.eventEmitter);
        this.collisionManager = new CollisionManager(this.audioManager, this.eventEmitter);
        
        this.player = new Player(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        this.player.currentAmmo = this.player.magazine;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.levelManager = new LevelManager();
        this.shop = new Shop(this.eventEmitter);
        this.credits = 0;
        this.mousePos = new Vector2(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        this.keys = {};
        this.gameState = 'playing';

        this.temporalFieldActive = false;
        this.temporalFieldTimer = 0;
        this.temporalFieldCooldown = 0;
        this.explosiveUsedThisLevel = false;
        this.onGameOver = onGameOver;   // callback for game over

        this.setupGameEventListeners();
        this.setupCanvasEventListeners();
        this.uiManager.updateHUD(this.player, this.levelManager, this.shop, this.credits);
        this.levelManager.startLevel();
    }

    setupGameEventListeners() {
        this.eventEmitter.on('upgrade-purchased', (data) => {
            const result = this.shop.purchaseUpgrade(data.upgradeType, this.credits);
            if (result) {
                this.credits -= result.cost;
                this.applyUpgradeEffect(result.effect);
                this.audioManager.play('purchase');
                this.eventEmitter.emit('shop-updated', {
                    player: this.player,
                    levelManager: this.levelManager,
                    shop: this.shop,
                    credits: this.credits
                });
            }
        });

        this.eventEmitter.on('next-level-clicked', () => {
            this.player.currentAmmo = this.player.magazine;
            if (this.player.health <= 0) {
                this.player.health = this.player.maxHealth;
            }
            this.player.isReloading = false;
            this.uiManager.hideReloadBar();
            this.explosiveUsedThisLevel = false;
            this.gameState = 'playing';
            this.levelManager.startLevel();
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
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = new Vector2(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        });

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

        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'gameOver' && e.key === 'Enter') {
                e.preventDefault();
                
                window.location.reload();
                return;
            }

            if (e.code === 'Space' && (this.gameState === 'playing' || this.gameState === 'paused')) {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                } else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
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
                if (this.shop.hasUpgrade('explosive') && this.explosiveCooldown <= 0) {
                    this.activateExplosive();
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

    activateExplosive() {
        if (!this.shop.hasUpgrade('explosive') || this.explosiveUsedThisLevel) return;
        this.explosiveUsedThisLevel = true;

        const blastRadius = 180;
        this.enemies.forEach(enemy => {
            const distance = enemy.position.distance(this.player.position);
            if (distance < blastRadius) {
                enemy.active = false;
                this.credits += this.levelManager.getLevelReward();
            }
        });

        const centerX = this.player.position.x;
        const centerY = this.player.position.y;

        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            const size = 4 + Math.random() * 6;
            const r = 255;
            const g = 100 + Math.floor(Math.random() * 155);
            const b = 0;
            const color = `rgb(${r}, ${g}, ${b})`;
            this.particles.push(new Particle(
                centerX, centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color, 0.8, size
            ));
        }

        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 150;
            this.particles.push(new Particle(
                centerX, centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff0000', 0.6, 8
            ));
        }

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

        const moveDirection = new Vector2(0, 0);
        if (this.keys['w']) moveDirection.y -= 1;
        if (this.keys['s']) moveDirection.y += 1;
        if (this.keys['a']) moveDirection.x -= 1;
        if (this.keys['d']) moveDirection.x += 1;
        if (moveDirection.magnitude() > 0) {
            this.player.move(moveDirection.normalize());
        }

        if (this.keys['t'] && this.shop.hasUpgrade('temporalField')) {
            this.activateTemporalField();
            this.keys['t'] = false;
        }

        this.player.update(deltaTime, this.mousePos);
        this.levelManager.update(deltaTime, this.enemies);

        this.enemies.forEach(enemy => enemy.update(deltaTime, this.player.position));
        this.enemies = this.enemies.filter(enemy => enemy.active);

        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.bullets = this.bullets.filter(bullet => bullet.active);

        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.active);

        if (this.player.isReloading) {
            const progress = (this.player.reloadProgress / this.player.reloadTime) * 100;
            this.uiManager.updateReloadBar(progress);
        } else {
            this.uiManager.hideReloadBar();
        }

        // Temporal field logic
        if (this.temporalFieldActive) {
            this.temporalFieldTimer -= deltaTime;
            if (this.temporalFieldTimer <= 0) this.temporalFieldActive = false;
        }
        if (this.temporalFieldCooldown > 0) this.temporalFieldCooldown -= deltaTime;
        if (this.explosiveCooldown > 0) this.explosiveCooldown -= deltaTime;

        if (this.temporalFieldActive) {
            const fieldRadius = GameConfig.TEMPORAL_FIELD.RADIUS;
            const slowFactor = GameConfig.TEMPORAL_FIELD.SLOW_FACTOR;
            this.enemies.forEach(enemy => {
                const distance = enemy.position.distance(this.player.position);
                if (distance < fieldRadius) {
                    enemy.slowEffect = slowFactor;
                    enemy.slowDuration = 0.1;
                }
            });
        }

        if (this.player) this.player.isTemporalActive = this.temporalFieldActive;

        const upgrades = {
            hasSiphonRounds: this.shop.hasUpgrade('siphonRounds'),
            hasTemporal: this.shop.hasUpgrade('temporalField')
        };

        this.collisionManager.checkBulletEnemyCollisions(
            this.bullets, this.enemies, this.player.damage, upgrades,
            (type, data) => this.handleCollisionEvent(type, data)
        );
        this.collisionManager.checkEnemyPlayerCollisions(
            this.enemies, this.player,
            (type, data) => this.handleCollisionEvent(type, data)
        );

        if (this.levelManager.isLevelComplete() && this.enemies.length === 0) {
            this.levelManager.completeLevel();
            this.startShop();
        }

        if (this.player.health <= 0 && this.gameState !== 'gameOver') {
            this.gameState = 'gameOver';
            this.uiManager.hideShop();
            const levelsReached = this.levelManager.currentLevel - 1;
            if (this.onGameOver) {
                this.onGameOver(levelsReached);
            }
        }

        this.eventEmitter.emit('hud-updated', {
            player: this.player,
            levelManager: this.levelManager,
            shop: this.shop,
            credits: this.credits
        });
    }

    handleCollisionEvent(type, data) {
        if (type === 'particle') {
            this.particles.push(new Particle(
                data.x, data.y, data.vx, data.vy, data.color, data.life, data.size
            ));
        } else if (type === 'enemy-death') {
            this.credits += this.levelManager.getLevelReward();
            if (data.shouldHeal) this.player.heal(5);
        } else if (type === 'enemy-contact') {
            const enemy = data.enemy;
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 200;
                this.particles.push(new Particle(
                    enemy.position.x, enemy.position.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    GameConfig.COLORS.PARTICLE_DEATH,
                    0.5, 4
                ));
            }
            this.audioManager.play('death');
        }
    }

    draw() {
        this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.temporalFieldActive) {
            this.ctx.save();
            const t = this.player?.pulseTimer || 0;
            const freq = 3.0;
            const pulse = (Math.sin(t * freq) + 1) / 2;
            const alphaInner = 0.45 + pulse * 0.25;
            const alphaOuter = 0.05 + pulse * 0.1;

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

        this.particles.forEach(p => p.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);

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

        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Chakra Petch';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Chakra Petch';
            this.ctx.fillText(`Level Reached: ${this.levelManager.currentLevel - 1}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            this.ctx.fillText('Press Enter to restart', this.canvas.width / 2, this.canvas.height / 2 + 100);
        }

        if (this.temporalFieldActive) {
            this.ctx.save();
            this.ctx.strokeStyle = '#88ccff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(this.player.position.x, this.player.position.y, GameConfig.TEMPORAL_FIELD.RADIUS, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
    }

    startShop() {
        this.gameState = 'shop';
        this.uiManager.showShop(this.shop, this.credits);
    }

    startNextLevel() {
        this.gameState = 'playing';
        this.levelManager.startLevel();
    }

    // Public method to add rewards (used by puzzle event)
    addReward(creditsAmount, healthAmount) {
        this.credits += creditsAmount;
        if (this.player) {
            this.player.heal(healthAmount);
        }
        this.eventEmitter.emit('hud-updated', {
            player: this.player,
            levelManager: this.levelManager,
            shop: this.shop,
            credits: this.credits
        });
    }
}