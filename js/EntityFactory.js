import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';
import { Particle } from './Particle.js';


// the game doesnt have know how to make everything
export class EntityFactory {
    
    createBullet(x, y, direction, damage) {
        return new Bullet(x, y, direction, damage);
    }

    createEnemy(x, y) {
        return new Enemy(x, y);
    }

    createParticle(x, y, vx, vy, color, life, size) {
        return new Particle(x, y, vx, vy, color, life, size);
    }
}
