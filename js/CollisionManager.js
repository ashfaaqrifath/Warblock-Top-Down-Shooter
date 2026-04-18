// crash stuff into each other

import {GameConfig} from './Config.js';


class CollisionManager {
    constructor(audioManager) {
        this.audioManager = audioManager;
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

                    // effects when hit enemy
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 50 + Math.random() * 500;
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
                
                player.takeDamage(GameConfig.ENEMY.CONTACT_DAMAGE);
                
                enemy.active = false;
                
                if (onCollision) {
                    onCollision('enemy-contact', { enemy, player });
                }
            }
        });
    }
}


export {CollisionManager};