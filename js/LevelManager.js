import {GameConfig} from "./Config.js";

class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.levelName = "Unknown Realm";
        this.enemiesRemaining = 0;
        this.baseEnemies = GameConfig.LEVEL.BASE_ENEMIES;
        this.growthRate = GameConfig.LEVEL.GROWTH_RATE;
        this.spawnTimer = 0;
        this.spawnInterval = GameConfig.LEVEL.SPAWN_INTERVAL;
        this.levelActive = false;
    }

    async generateLevelName(levelNumber) {
        try {
            const response = await fetch('https://random-word-api.herokuapp.com/all');
            const words = await response.json();
            
            if (!words || words.length === 0) {
                this.levelName = `Level ${levelNumber}`;
                return;
            }
            
            // Get two random words for a cooler name
            const word1 = words[Math.floor(Math.random() * words.length)];
            const word2 = words[Math.floor(Math.random() * words.length)];
            
            const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
            this.levelName = `${capitalize(word1)} ${capitalize(word2)}`;
        } catch (error) {
            console.error('Error generating level name:', error);
            this.levelName = `Level ${levelNumber}`;
        }
    }

    startLevel() {
        this.levelActive = true;
        this.enemiesRemaining = Math.floor(this.baseEnemies * Math.pow(this.growthRate, this.currentLevel - 1));
        this.spawnTimer = 0;
        this.generateLevelName(this.currentLevel);
    }

    update(deltaTime, onSpawn) {
        if (!this.levelActive || this.enemiesRemaining <= 0) return;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.enemiesRemaining > 0) {
            // Return spawn data instead of creating Enemy instances
            const spawnData = this.getSpawnData();
            if (onSpawn) {
                onSpawn(spawnData);
            }
            this.spawnTimer = 0;
            this.enemiesRemaining--;
        }
    }

    getSpawnData() {
        // Spawn at random edge - return coordinates, not Enemy instance
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
        
        return { x, y, type: 'standard' };
    }

    isLevelComplete() {
        return this.levelActive && this.enemiesRemaining <= 0;
    }

    getLevelReward() {
        return Math.floor(GameConfig.LEVEL.REWARD_BASE * Math.pow(GameConfig.LEVEL.REWARD_GROWTH, this.currentLevel - 1));
    }

    completeLevel() {
        this.levelActive = false;
        this.currentLevel++;
    }
}


export {LevelManager};