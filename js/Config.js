// ============================================================
// CONFIGURATION - Centralized game constants
// ============================================================
const GameConfig = {
    CANVAS: { WIDTH: 800, HEIGHT: 600, GRID_SIZE: 40 },
    PLAYER: {
        SPAWN_X: 400,
        SPAWN_Y: 300,
        SIZE: 12,
        MAX_HEALTH: 100,
        SPEED: 80,
        MAGAZINE_BASE: 30,
        FIRE_RATE: 0.2,
        DAMAGE_BASE: 25
    },
    ENEMY: {
        SIZE: 15,
        MAX_HEALTH: 50,
        SPEED: 80,
        CONTACT_DAMAGE: 20,
        SPAWN_OFFSET: 20
    },
    BULLET: { SPEED: 600, SIZE: 4, TRAIL_SIZE: 10 },
    PARTICLE: { DEFAULT_SIZE: 2, FRICTION: 0.98 },
    LEVEL: {
        BASE_ENEMIES: 5,
        GROWTH_RATE: 1.3,
        SPAWN_INTERVAL: 1.0,
        REWARD_BASE: 5,
        REWARD_GROWTH: 1
    },
    UPGRADES: { // all the costs is 0 for demo purposes. must change later
        extendedMag: { cost: 10, maxPurchases: 10, costGrowth: 1.5 },
        highCaliber: { cost: 10, maxPurchases: 5, costGrowth: 1.5 },
        temporalField: { cost: 10, maxPurchases: 1, costGrowth: 1.5 },
        siphonRounds: { cost: 10, maxPurchases: 1, costGrowth: 1.5 },
        damageImmunity: { cost: 10, maxPurchases: 1, costGrowth: 1.5 },
        explosive: { cost: 10, maxPurchases: 1, costGrowth: 1.5 }
    },
    COLORS: {
        PLAYER: '#0099ff',
        PLAYER_TEMPORAL: '#00ff84',
        TEMPORAL_BG: '#224488',
        ENEMY: '#ff0000',
        HEALTH_BAR_BG: '#333',
        HEALTH_BAR_FILL: '#4a8a4a',
        BULLET: '#ffff00',
        PARTICLE_HIT: '#ff8888',
        PARTICLE_DEATH: '#ff4444',
        TEMPORAL_EFFECT: '#88cbffa5',
        BACKGROUND: '#0a0a0a',
        GRID: '#1a1a1a'
    },
    TEMPORAL_FIELD: {
        RADIUS: 180,
        DURATION: 5.0,
        COOLDOWN: 10.0,
        SLOW_FACTOR: 0.8  // slowness
    }
};

export {GameConfig};