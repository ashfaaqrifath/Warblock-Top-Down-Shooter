import { GameFactory } from './GameFactory.js';
import { initPuzzle, openPuzzleModal } from './HeartAPI.js';
import { loadUsername, saveLevelsToDatabase, loadLeaderboardData, setupLogoutButton } from './Supabase.js';

let game;
let lastTime = 0;

function gameLoop(currentTime) {
    if (!game) {
        // Use GameFactory to create the game with injected dependencies
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

// Start the game loop immediately (canvas exists)
requestAnimationFrame(gameLoop);

// Initialize UI and Supabase when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    initPuzzle();
    setupLogoutButton();
    await loadUsername();
    await loadLeaderboardData();
});

// Listen for puzzle-correct event and reward the player
window.addEventListener('puzzle-correct', () => {
    if (game) {
        game.addReward(10, 10);
    }
});

// Listen for puzzle-solve-requested event and open the puzzle modal
// This decouples UIManager from HeartAPI
window.addEventListener('puzzle-solve-requested', () => {
    openPuzzleModal();
});