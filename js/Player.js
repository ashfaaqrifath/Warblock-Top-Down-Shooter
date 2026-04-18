import {Vector2} from "./Vector.js";
import {GameConfig} from "./Config.js";

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
        this.fireRate = GameConfig.PLAYER.FIRE_RATE;
        this.lastShot = 0;
        this.damage = GameConfig.PLAYER.DAMAGE_BASE;
        this.lastContactDamageTime = 0;
        this.isTemporalActive = false;
        this.pulseTimer = 0;
        this.damageImmunityTimer = 0;
    }

    update(deltaTime, mousePos) {
        
        const direction = mousePos.subtract(this.position);
        this.rotation = Math.atan2(direction.y, direction.x);

        
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.velocity = this.velocity.multiply(0.8); // make things slide and slow down

        
        this.position.x = Math.max(this.size/2, Math.min(GameConfig.CANVAS.WIDTH - this.size/2, this.position.x));
        this.position.y = Math.max(this.size/2, Math.min(GameConfig.CANVAS.HEIGHT - this.size/2, this.position.y));


        
        this.lastShot += deltaTime;

        
        this.lastContactDamageTime -= deltaTime;
        
        if (this.pulseTimer !== undefined) this.pulseTimer += deltaTime;
        
        if (this.damageImmunityTimer > 0) this.damageImmunityTimer -= deltaTime;
    }

    move(direction) {
        this.velocity = this.velocity.add(direction.multiply(this.speed));
    }

    shoot(mousePos) {
        if (this.currentAmmo <= 0 || this.lastShot < this.fireRate) {
            return null;
        }

        this.currentAmmo--;
        this.lastShot = 0;

        const direction = mousePos.subtract(this.position).normalize();
        
        
        return {
            x: this.position.x,
            y: this.position.y,
            direction: direction,
            damage: this.damage
        };
    }


    takeDamage(damage) {
        if (this.damageImmunityTimer > 0) return;
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx) {
        // draw health bar
        const healthBarY = this.position.y - this.size - 8;
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_BG;
        ctx.fillRect(this.position.x - 15, healthBarY, 30, 4);
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_FILL;
        const healthWidth = (this.health / this.maxHealth) * 30;
        ctx.fillRect(this.position.x - 15, healthBarY, healthWidth, 4);

        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        // temporal effect - AI GENERATED
        if (this.isTemporalActive) {
            const freq = 8; 
            const t = this.pulseTimer || 0;
            const pulse = (Math.sin(t * freq) + 1) / 2; // 0..1

            
            ctx.shadowColor = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.shadowBlur = 8 + pulse * 12;
            ctx.globalAlpha = 0.85 + pulse * 0.15;
            ctx.fillStyle = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        } else {
            ctx.fillStyle = GameConfig.COLORS.PLAYER;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        }

        // damage immunity effect - AI GENERATED
        if (this.damageImmunityTimer > 0) {
            const freq = 8; // pulse frequency
            const t = this.pulseTimer || 0;
            const pulse = (Math.sin(t * freq) + 1) / 2; // 0..1

            
            ctx.shadowColor = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.shadowBlur = 8 + pulse * 12;
            ctx.globalAlpha = 0.85 + pulse * 0.15;
            ctx.fillStyle = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        } else {
            ctx.fillStyle = GameConfig.COLORS.PLAYER;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        }

        ctx.restore();
    }
}

export {Player};