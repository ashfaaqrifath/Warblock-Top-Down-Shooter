import { Vector2 } from './Vector.js';
import { GameConfig } from './Config.js';

export class Enemy {
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
        this.isInTemporalField = false;
    }
    update(deltaTime, playerPos) {
        if (!this.active) return;
        
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) this.slowEffect = 0;
        }
        const direction = playerPos.subtract(this.position).normalize();
        const currentSpeed = this.speed * (1 - this.slowEffect);
        this.velocity = direction.multiply(currentSpeed);
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.aggroTime += deltaTime * 5;
    }
    takeDamage(damage, upgrades) {
        this.health -= damage;
        const isDead = this.health <= 0;
        if (isDead) this.active = false;
        return { isDead, shouldHeal: upgrades.hasSiphonRounds && isDead };
    }
    draw(ctx) {
        if (!this.active) return;
        const healthBarY = this.position.y - this.size - 8;
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_BG;
        ctx.fillRect(this.position.x - 15, healthBarY, 30, 4);
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_FILL;
        const healthWidth = (this.health / this.maxHealth) * 30;
        ctx.fillRect(this.position.x - 15, healthBarY, healthWidth, 4);

        if (this.isInTemporalField) {
            ctx.save();
            ctx.shadowColor = GameConfig.COLORS.TEMPORAL_EFFECT;
            ctx.fillStyle = GameConfig.COLORS.TEMPORAL_EFFECT;
            ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
            ctx.restore();
        } else {
            const pulseIntensity = Math.sin(this.aggroTime) * 0.2 + 0.8;
            const red = Math.floor(255 * pulseIntensity);
            ctx.fillStyle = `rgb(${red}, 0, 0)`;
            if (this.slowDuration > 0) {
                ctx.strokeStyle = GameConfig.COLORS.TEMPORAL_EFFECT;
                ctx.lineWidth = 2;
                ctx.strokeRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
            }
            ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
        }
    }
}