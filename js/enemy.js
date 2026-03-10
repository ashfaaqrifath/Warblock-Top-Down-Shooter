import { GameConfig, Vector2 } from "./main.js";

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
        

        const isDead = this.health <= 0;
        if (isDead) {
            this.active = false;
        }

        return {
            isDead,
            shouldHeal: upgrades.hasSiphonRounds && isDead
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

        // Determine if enemy is inside the active temporal field
        let inTemporalField = false;
        if (typeof game !== 'undefined' && game && game.temporalFieldActive && game.player) {
            const dist = this.position.distance(game.player.position);
            if (dist < GameConfig.TEMPORAL_FIELD.RADIUS) inTemporalField = true;
        }

        if (inTemporalField) {

            ctx.save();
            ctx.shadowColor = GameConfig.COLORS.TEMPORAL_EFFECT;
            ctx.fillStyle = GameConfig.COLORS.TEMPORAL_EFFECT;
            ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
            ctx.restore();
        } else {
            // Draw enemy with aggro pulse
            const pulseIntensity = Math.sin(this.aggroTime) * 0.2 + 0.8;
            const red = Math.floor(255 * pulseIntensity);
            ctx.fillStyle = `rgb(${red}, 0, 0)`;
            
            // Add slow effect visual (stroke)
            if (this.slowDuration > 0) {
                ctx.strokeStyle = GameConfig.COLORS.TEMPORAL_EFFECT;
                ctx.lineWidth = 2;
                ctx.strokeRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
            }
            
            ctx.fillRect(this.position.x - this.size/2, this.position.y - this.size/2, this.size, this.size);
        }
    }
}


export { Enemy };