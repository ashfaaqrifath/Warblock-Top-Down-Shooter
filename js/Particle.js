import { GameConfig } from "./Config.js";
import { Vector2 } from "./Vector.js";

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

export {Particle};