import { GameConfig } from './main.js';

class Shop {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.upgrades = this.initializeUpgrades();
    }

    initializeUpgrades() {
        const upgrades = {};
        const config = GameConfig.UPGRADES;
        for (const [key, value] of Object.entries(config)) {
            upgrades[key] = {
                cost: value.cost,
                costGrowth: value.costGrowth,
                purchased: 0,
                maxPurchases: value.maxPurchases
            };
        }
        return upgrades;
    }

    purchaseUpgrade(upgradeType, credits) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade || upgrade.purchased >= upgrade.maxPurchases) return null;

        const cost = this.getUpgradeCost(upgradeType);
        if (credits < cost) return null;

        upgrade.purchased++;
        const effect = this.getUpgradeEffect(upgradeType);
        
        this.eventEmitter.emit('upgrade-applied', {
            upgradeType,
            cost,
            effect
        });

        return { cost, effect };
    }

    getUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return Math.floor(upgrade.cost * Math.pow(upgrade.costGrowth, upgrade.purchased));
    }

    getUpgradeEffect(upgradeType) {
        switch (upgradeType) {
            case 'extendedMag':
                return { type: 'magazine', value: 5 };
            case 'highCaliber':
                return { type: 'damage', value: 1.25 };
            case 'damageImmunity':
                return { type: 'immunity', value: 5 };
            case 'temporalField':
                return { type: 'temporal', value: true };
            case 'siphonRounds':
                return { type: 'siphon', value: true };
            case 'empBlast':
                return { type: 'empBlast', value: true };
            default:
                return { type: 'none', value: null };
        }
    }

    hasUpgrade(upgradeType) {
        return this.upgrades[upgradeType].purchased > 0;
    }
}

export { Shop };