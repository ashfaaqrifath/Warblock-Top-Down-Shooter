import { GameConfig } from "./Config.js";
import { Vector2 } from "./Vector.js";

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

export {Bullet};