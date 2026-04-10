// ============================================================
// UI MANAGER - Handles all DOM updates
// ============================================================

class UIManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.hud = document.getElementById('hud');
        this.shop = document.getElementById('shop');
        this.currentPlayer = null;
        this.currentLevelManager = null;
        this.currentShop = null;
        this.currentCredits = 0;
        this.upgradeDescriptions = {
            extendedMag: { name: 'Extended Magazine', desc: '+10 Magazine Capacity' },
            highCaliber: { name: 'High-Caliber Rounds', desc: '25% More Damage per shot' },
            temporalField: { name: 'Temporal Field', desc: 'Slows enemies for 5 seconds' },
            siphonRounds: { name: 'HP Siphon Rounds', desc: '+5 HP gained per enemy kill' },
            damageImmunity: { name: 'Damage Immunity', desc: 'No damage taken for 5 seconds' },
            explosive: { name: 'Explosive Rounds', desc: 'AoE blast kills nearby enemies' }
        };
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

        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            const newNextLevelBtn = nextLevelBtn.cloneNode(true);
            nextLevelBtn.parentNode.replaceChild(newNextLevelBtn, nextLevelBtn);
            
            newNextLevelBtn.addEventListener('click', () => {
                this.hideShop();
                this.eventEmitter.emit('next-level-clicked', {});
            });
        }

        // Solve Puzzle button emits event instead of calling HeartAPI directly
        const solvePuzzleBtn = document.getElementById('solvePuzzleBtn');
        if (solvePuzzleBtn) {
            const newSolvePuzzleBtn = solvePuzzleBtn.cloneNode(true);
            solvePuzzleBtn.parentNode.replaceChild(newSolvePuzzleBtn, solvePuzzleBtn);
            
            newSolvePuzzleBtn.addEventListener('click', () => {
                // Emit event - Main.js will handle opening the modal
                this.eventEmitter.emit('puzzle-solve-requested', {});
            });
        }
    }

    setupEventListeners() {
        this.eventEmitter.on('shop-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentLevelManager = data.levelManager;
            this.currentShop = data.shop;
            this.currentCredits = data.credits;
            this.updateShop(data.shop, data.credits);
            this.updateHUD(data.player, data.levelManager, data.shop, data.credits);
        });

        this.eventEmitter.on('hud-updated', (data) => {
            this.currentPlayer = data.player;
            this.currentLevelManager = data.levelManager;
            this.currentShop = data.shop;
            this.currentCredits = data.credits;
            this.updateHUD(data.player, data.levelManager, data.shop, data.credits);
        });
    }

    updateHUD(player, levelManager, shop, credits) {
        document.getElementById('levelDisplay').textContent = `${levelManager.currentLevel}: ${levelManager.levelName}`;
        document.getElementById('creditsDisplay').textContent = credits;
        document.getElementById('ammoDisplay').textContent = `${player.currentAmmo}/${player.magazine}`;
        document.getElementById('healthDisplay').textContent = player.health;

        // Update active upgrades display
        this.updateActiveUpgrades(shop);
    }

    updateActiveUpgrades(shop) {
        const upgradesList = document.getElementById('upgradesList');
        upgradesList.innerHTML = '';

        let hasUpgrades = false;
        Object.keys(shop.upgrades).forEach(upgradeType => {
            if (shop.hasUpgrade(upgradeType)) {
                hasUpgrades = true;
                const upgradeInfo = this.upgradeDescriptions[upgradeType];
                const upgradePurchased = shop.upgrades[upgradeType].purchased;
                
                const item = document.createElement('div');
                item.className = 'upgrade-item';
                
                const icon = document.createElement('div');
                icon.className = 'upgrade-icon';
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                
                const info = document.createElement('div');
                info.className = 'upgrade-info';
                
                const name = document.createElement('div');
                name.className = 'upgrade-name';
                name.textContent = `${upgradeInfo.name} (x${upgradePurchased})`;
                
                const desc = document.createElement('div');
                desc.className = 'upgrade-desc';
                desc.textContent = upgradeInfo.desc;
                
                info.appendChild(name);
                info.appendChild(desc);
                item.appendChild(icon);
                item.appendChild(info);
                
                upgradesList.appendChild(item);
            }
        });

        // Show empty message if no upgrades yet
        if (!hasUpgrades) {
            const empty = document.createElement('div');
            empty.className = 'upgrades-empty';
            empty.textContent = 'No upgrades yet';
            upgradesList.appendChild(empty);
        }
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
}


export {UIManager};