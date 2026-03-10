import { GameConfig, Vector2, Bullet } from "./main.js";

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
        this.isTemporalActive = false;
        this.pulseTimer = 0;
        this.damageImmunityTimer = 0;
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
        // Update pulse timer for temporal visual effects
        if (this.pulseTimer !== undefined) this.pulseTimer += deltaTime;
        // Update damage immunity timer
        if (this.damageImmunityTimer > 0) this.damageImmunityTimer -= deltaTime;
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
        if (this.damageImmunityTimer > 0) return;
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

        // Draw player (with temporal pulse when active)
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        if (this.isTemporalActive) {
            const freq = 8; // pulse frequency
            const t = this.pulseTimer || 0;
            const pulse = (Math.sin(t * freq) + 1) / 2; // 0..1

            // glow using shadowBlur and varying alpha
            ctx.shadowColor = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.shadowBlur = 8 + pulse * 12;
            ctx.globalAlpha = 0.85 + pulse * 0.15;
            ctx.fillStyle = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            // reset shadow and alpha for direction indicator
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        } else {
            ctx.fillStyle = GameConfig.COLORS.PLAYER;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            // Draw direction indicator
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        }

        if (this.damageImmunityTimer > 0) {
            const freq = 8; // pulse frequency
            const t = this.pulseTimer || 0;
            const pulse = (Math.sin(t * freq) + 1) / 2; // 0..1

            // glow using shadowBlur and varying alpha
            ctx.shadowColor = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.shadowBlur = 8 + pulse * 12;
            ctx.globalAlpha = 0.85 + pulse * 0.15;
            ctx.fillStyle = GameConfig.COLORS.PLAYER_TEMPORAL;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            // reset shadow and alpha for direction indicator
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        } else {
            ctx.fillStyle = GameConfig.COLORS.PLAYER;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);

            // Draw direction indicator
            ctx.fillStyle = '#6aaa6a';
            ctx.fillRect(this.size/4, -2, this.size/2, 4);
        }

        ctx.restore();
    }
}

export { Player };