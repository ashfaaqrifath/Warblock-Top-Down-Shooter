import { Game } from './Game.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { CollisionManager } from './CollisionManager.js';
import { Shop } from './Shop.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { EventEmitter } from './EventEmitter.js';
import { EntityFactory } from './EntityFactory.js';
import { GameConfig } from './Config.js';


export class GameFactory {
    static createGame(onGameOver) {
        // message system
        const eventEmitter = new EventEmitter();
        
        // helper things
        const audioManager = new AudioManager();
        const uiManager = new UIManager(eventEmitter);
        const collisionManager = new CollisionManager(audioManager);
        const entityFactory = new EntityFactory();
        
        // make the player and level
        const player = new Player(GameConfig.PLAYER.SPAWN_X, GameConfig.PLAYER.SPAWN_Y);
        player.currentAmmo = player.magazine;
        
        const levelManager = new LevelManager();
        const shop = new Shop(eventEmitter);
        
        
        const dependencies = {
            eventEmitter,
            audioManager,
            uiManager,
            collisionManager,
            entityFactory,
            player,
            levelManager,
            shop,
            onGameOver
        };
        
        
        return new Game(dependencies);
    }
}
