import { GameFactory } from './GameFactory.js';
import { initPuzzle, openPuzzleModal } from './HeartAPI.js';
import { loadUsername, saveLevelsToDatabase, loadLeaderboardData, setupLogoutButton, checkAuthentication } from './Supabase.js';

let game;
let lastTime = 0;

// make sure the person logged in
async function initializeGame() {
    const isAuthenticated = await checkAuthentication()
    if (!isAuthenticated) {
        return 
    }
    
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!game) {
        // make the game
        game = GameFactory.createGame((levelsReached) => {
            saveLevelsToDatabase(levelsReached);
        });
    }
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    game.update(deltaTime);
    game.draw();
    requestAnimationFrame(gameLoop);
}


initializeGame();


window.addEventListener('DOMContentLoaded', async () => {
    initPuzzle();
    setupLogoutButton();
    await loadUsername();
    await loadLeaderboardData();
});


window.addEventListener('puzzle-correct', () => {
    if (game) {
        game.addReward(10, 10);
    }
});

window.addEventListener('puzzle-solve-requested', () => {
    openPuzzleModal();
});