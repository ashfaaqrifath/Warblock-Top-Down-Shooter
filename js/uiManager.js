// ============================================================
// UI MANAGER - Handles all DOM updates
// ============================================================
import { openPuzzleModal } from './main.js';


class UIManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.hud = document.getElementById('hud');
        this.shop = document.getElementById('shop');
        this.reloadBar = document.getElementById('reloadBar');
        this.currentPlayer = null;
        this.currentWaveManager = null;
        this.currentShop = null;
        this.currentCredits = 0;
        this.setupShopListeners();
        this.setupEventListeners();
    }

    setupShopListeners() {
        // Clone and replace upgrade buttons to remove old listeners from previous game instances
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });

        // Toggle selection on click. Selection is visual; purchases occur when player confirms via upgrade.
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // ignore clicks on disabled buttons
                if (btn.disabled) return;
                const upgradeType = btn.dataset.upgrade;
                if (btn.classList.contains('selected')) {
                    btn.classList.remove('selected');
                    this.eventEmitter.emit('upgrade-deselected', { upgradeType });
                } else {
                    btn.classList.add('selected');
                    this.eventEmitter.emit('upgrade-selected', { upgradeType });
                }
            });
        });

        // Buy all currently selected upgrades (clone button to remove old listeners)
        const buyBtn = document.getElementById('buySelectedBtn');
        if (buyBtn) {
            const newBuyBtn = buyBtn.cloneNode(true);
            buyBtn.parentNode.replaceChild(newBuyBtn, buyBtn);
            
            newBuyBtn.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.upgrade-btn.selected'));
                selected.forEach(btn => {
                    const upgradeType = btn.dataset.upgrade;
                    this.eventEmitter.emit('upgrade-purchased', { upgradeType });
                    btn.classList.remove('selected');
                });
            });
        }

        const nextWaveBtn = document.getElementById('nextWaveBtn');
        if (nextWaveBtn) {
            const newNextWaveBtn = nextWaveBtn.cloneNode(true);
            nextWaveBtn.parentNode.replaceChild(newNextWaveBtn, nextWaveBtn);
            
            newNextWaveBtn.addEventListener('click', () => {
                this.hideShop();
                this.eventEmitter.emit('next-wave-clicked', {});
            });
        }

        // NEW: Solve Puzzle button opens in-page modal (clone to remove old listeners)
        const solvePuzzleBtn = document.getElementById('solvePuzzleBtn');
        if (solvePuzzleBtn) {
            const newSolvePuzzleBtn = solvePuzzleBtn.cloneNode(true);
            solvePuzzleBtn.parentNode.replaceChild(newSolvePuzzleBtn, solvePuzzleBtn);
            
            newSolvePuzzleBtn.addEventListener('click', () => {
                openPuzzleModal();
            });
        }
    }

    setupEventListeners() {
        this.eventEmitter.on('shop-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentWaveManager = data.waveManager;
            this.currentShop = data.shop;
            this.currentCredits = data.credits;
            this.updateShop(data.shop, data.credits);
            this.updateHUD(data.player, data.waveManager, data.shop, data.credits);
        });

        this.eventEmitter.on('hud-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentWaveManager = data.waveManager;
            this.currentShop = data.shop;
            this.currentCredits = data.credits;
            this.updateHUD(data.player, data.waveManager, data.shop, data.credits);
        });
    }

    updateHUD(player, waveManager, shop, credits) {
        document.getElementById('waveDisplay').textContent = waveManager.currentWave;
        document.getElementById('creditsDisplay').textContent = credits;
        document.getElementById('ammoDisplay').textContent = `${player.currentAmmo}/${player.magazine}`;
        document.getElementById('healthDisplay').textContent = player.health;

        const upgradeIcons = document.getElementById('upgradeIcons');
        upgradeIcons.innerHTML = '';
        Object.keys(shop.upgrades).forEach(upgradeType => {
            if (shop.hasUpgrade(upgradeType)) {
                const icon = document.createElement('div');
                icon.style.cssText = 'margin: 2px; padding: 2px 6px; background: #2a4a2a; border: 1px solid #4a7a4a; border-radius: 3px; font-size: 8px;';
                icon.textContent = upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1);
                upgradeIcons.appendChild(icon);
            }
        });
    }

    updateShop(shop, credits) {
        document.getElementById('shopCredits').textContent = credits;

        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            const upgradeType = btn.dataset.upgrade;
            const upgrade = shop.upgrades[upgradeType];
            const cost = shop.getUpgradeCost(upgradeType);

            btn.querySelector('.cost').textContent = cost;

            if (upgrade.purchased >= upgrade.maxPurchases) {
                btn.disabled = true;
                btn.classList.add('purchased');
                btn.querySelector('.cost').textContent = 'MAX';
            } else if (credits < cost) {
                btn.disabled = true;
                btn.classList.remove('purchased');
            } else {
                btn.disabled = false;
                btn.classList.remove('purchased');
            }
        });
    }

    showShop(shop, credits) {
        this.shop.style.display = 'block';
        this.updateShop(shop, credits);
    }

    hideShop() {
        this.shop.style.display = 'none';
    }

    showReloadBar() {
        this.reloadBar.style.display = 'block';
    }

    hideReloadBar() {
        this.reloadBar.style.display = 'none';
    }

    updateReloadBar(progress) {
        document.getElementById('reloadFill').style.width = progress + '%';
    }
}


export { UIManager };