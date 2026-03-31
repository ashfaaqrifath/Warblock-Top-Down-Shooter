import { Game } from './Game.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { CollisionManager } from './CollisionManager.js';
import { Shop } from './Shop.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { EventEmitter } from './EventEmitter.js';
import { GameConfig } from './Config.js';

/**
 * GameFactory - Handles dependency creation and injection
 * Centralizes the creation of all game components to reduce coupling
 */
export class GameFactory {
    static createGame(onGameOver) {
        // Create the event emitter first (shared by all components)
        const eventEmitter = new EventEmitter();
        
        // Create service managers
        const audioManager = new AudioManager();
        const uiManager = new UIManager(eventEmitter);
        const collisionManager = new CollisionManager(audioManager, eventEmitter);
        
        // Create game entities
        const player = new Player(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        player.currentAmmo = player.magazine;
        
        const levelManager = new LevelManager();
        const shop = new Shop(eventEmitter);
        
        // Create dependencies object
        const dependencies = {
            eventEmitter,
            audioManager,
            uiManager,
            collisionManager,
            player,
            levelManager,
            shop,
            onGameOver
        };
        
        // Create and return the game instance
        return new Game(dependencies);
    }
}
