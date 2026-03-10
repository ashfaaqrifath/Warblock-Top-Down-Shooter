import { GameConfig } from "./main.js";
import { Enemy } from "./enemy.js";

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


export { WaveManager };