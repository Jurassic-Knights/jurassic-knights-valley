/**
 * EntityTypes - Centralized entity type constants
 * 
 * Use these instead of constructor.name checks for reliable type identification.
 * 
 * Owner: Director
 */

const EntityTypes = {
    HERO: 'hero',
    DINOSAUR: 'dinosaur',           // Passive zone dinos
    ENEMY_DINOSAUR: 'enemy_dinosaur', // Hostile dinosaurs
    ENEMY_SOLDIER: 'enemy_soldier',   // Hostile soldiers
    RESOURCE: 'resource',
    MERCHANT: 'merchant',
    DROPPED_ITEM: 'dropped_item',
    PROP: 'prop'
};

window.EntityTypes = EntityTypes;
