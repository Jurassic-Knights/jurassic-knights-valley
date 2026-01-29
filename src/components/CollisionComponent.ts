
export interface ICollisionComponent {
    bounds: {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    };
    layer: number;
    mask: number;
    isTrigger: boolean;
    enabled: boolean;
}

export const CollisionLayers = {
    NONE: 0,
    WORLD: 0x0001,
    HERO: 0x0002,
    ENEMY: 0x0004,
    TRIGGER: 0x0008,
    ALL: 0xFFFF
};

export const DefaultMasks = {
    HERO: CollisionLayers.WORLD | CollisionLayers.TRIGGER, // Hero hits walls and triggers
    ENEMY: CollisionLayers.WORLD | CollisionLayers.ENEMY,   // Enemy hits walls and pushes other enemies
    WORLD: CollisionLayers.ALL,                             // Walls stop everything
    TRIGGER: CollisionLayers.HERO                           // Triggers only activate for Hero
};

export class CollisionComponent implements ICollisionComponent {
    bounds: { width: number; height: number; offsetX: number; offsetY: number };
    layer: number;
    mask: number;
    isTrigger: boolean;
    enabled: boolean;

    constructor(config: Partial<ICollisionComponent> = {}) {
        this.bounds = {
            width: 32, height: 32, offsetX: 0, offsetY: 0,
            ...(config.bounds || {})
        };
        this.layer = config.layer ?? CollisionLayers.WORLD;
        this.mask = config.mask ?? CollisionLayers.ALL;
        this.isTrigger = config.isTrigger ?? false;
        this.enabled = config.enabled ?? true;
    }
}
