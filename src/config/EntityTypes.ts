/**
 * EntityTypes - Centralized entity type constants
 *
 * Use these instead of constructor.name checks for reliable type identification.
 *
 * Owner: Director
 */

const EntityTypes = {
    HERO: 'hero',
    DINOSAUR: 'dinosaur', // Passive zone dinos
    ENEMY: 'enemy', // Generic enemy type
    ENEMY_DINOSAUR: 'enemy_dinosaur', // Hostile dinosaurs
    ENEMY_SOLDIER: 'enemy_soldier', // Hostile soldiers
    ENEMY_SAURIAN: 'enemy_saurian', // Hostile saurians (humanoid dino hybrids)
    BOSS: 'boss', // Boss entities
    RESOURCE: 'resource',
    MERCHANT: 'merchant',
    DROPPED_ITEM: 'dropped_item',
    PROP: 'prop'
};

export { EntityTypes };
