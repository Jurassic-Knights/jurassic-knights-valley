/** Entity size and boss defaults. */
export const Entities = {
    TILE_SIZE: 128,
    MERCHANT_SIZE: 186,
    CRAFTING_FORGE_SIZE: 250
};

export const Boss = {
    DEFAULT_LEVEL: 10,
    SPAWN_OFFSETS: {
        grasslands: { x: 5500, y: 3000 },
        tundra: { x: 3000, y: 5500 },
        desert: { x: 5500, y: 5500 },
        badlands: { x: 3000, y: 3000 },
        default: { x: 3500, y: 3500 }
    },
    NAME_PLATE_Y_OFFSET: 35
};

/** EntityLoader fallbacks when entity config is missing fields. */
export const EntityLoader = {
    DEFAULT_HEALTH: 50,
    DEFAULT_SPEED: 80,
    DEFAULT_DAMAGE: 10,
    DEFAULT_ATTACK_RANGE: 80,
    DEFAULT_AGGRO_RANGE: 200,
    DEFAULT_LEASH_DISTANCE: 400,
    DEFAULT_RESPAWN_TIME: 30,
    DEFAULT_XP_REWARD: 10,
    BOSS_HEALTH: 500,
    BOSS_SPEED: 60,
    BOSS_DAMAGE: 40,
    BOSS_DEFENSE: 10,
    BOSS_ATTACK_RANGE: 150,
    BOSS_AGGRO_RANGE: 400,
    BOSS_RESPAWN_TIME: 180,
    BOSS_XP_REWARD: 200
};

export const Enemy = {
    DEFAULT_HEALTH: 30,
    DEFAULT_DAMAGE: 5,
    DEFAULT_ATTACK_RANGE: 100,
    DEFAULT_SPEED: 80,
    DEFAULT_XP_REWARD: 10,
    DEFAULT_RESPAWN_TIME: 60,
    FRAME_INTERVAL: 200,
    ELITE_FALLBACK_HEALTH: 50,
    DEFAULT_SIZE: 192,
    WANDER_INTERVAL_MIN: 3000,
    WANDER_INTERVAL_VARIANCE: 2000
};

export const Dinosaur = {
    DEFAULT_SIZE: 150,
    DEFAULT_MAX_HEALTH: 60,
    DEFAULT_RESPAWN_TIME: 30,
    DEFAULT_STAMINA: 100,
    DEFAULT_SPEED: 30,
    DEFAULT_MOVE_SPEED: 0.5,
    SPEED_SCALE: 60,
    DEFAULT_XP_REWARD: 10,
    WANDER_INTERVAL_MIN: 2000,
    WANDER_INTERVAL_MAX: 5000,
    FRAME_INTERVAL: 200
};

export const HeroDefaults = {
    XP_TO_NEXT_LEVEL: 100,
    XP_SCALING: 1.5,
    FOOTSTEP_INTERVAL: 0.15,
    DEFAULT_ATTACK: 10,
    MAX_STAMINA_FALLBACK: 100,
    MAX_HEALTH_FALLBACK: 100
};

export const Resource = {
    HEALTH_BAR_WIDTH: 100,
    HEALTH_BAR_HEIGHT: 14,
    HEALTH_BAR_OFFSET_X: 50,
    HEALTH_BAR_Y_OFFSET: 18,
    VFX_SPARK_LIFETIME: 300,
    T1_FAST_RESPAWN: 15,
    DEFAULT_BASE_RESPAWN: 30
};

export const Progression = {
    XP_BASE: 100,
    XP_SCALING: 1.5,
    LEVEL_UP_FLOATING_TEXT_LIFETIME: 1000
};

export const Crafting = {
    FORGE_SLOT_UNLOCK_COST: 1000
};

export const Quest = {
    NEXT_QUEST_DELAY_MS: 2000
};

export const IslandUpgrades = {
    BASE_COSTS: { resourceSlots: 100, autoChance: 150, respawnTime: 75 },
    CAPS: { resourceSlots: 15, autoChance: 80, respawnTime: 100 },
    DEFAULT_BASE_COST: 100
};

export const DroppedItem = {
    MAGNET_SPEED: 100,
    MAGNET_ACCELERATION: 500,
    MIN_PICKUP_TIME: 0.8,
    MIN_PICKUP_TIME_CRAFTED: 0.5,
    POST_LAND_DELAY: 0.5,
    FLY_TWEEN_DURATION_MS: 500
};

export const FloatingText = {
    STACK_SPACING: 50,
    STACK_TIMEOUT_MS: 500
};

export const EnemyRender = {
    HEALTH_BAR_WIDTH: 50,
    HEALTH_BAR_Y_OFFSET: 15,
    ELITE_PULSE_MS: 200,
    ELITE_ALPHA_BASE: 0.3,
    ELITE_ALPHA_AMPLITUDE: 0.1
};
