/**
 * Entity: weapon_ranged_bazooka_t1_01
 * Auto-generated from JSON.
 */

export default {
    id: 'weapon_ranged_bazooka_t1_01',
    name: 'Salvage Launcher',
    description: 'A crude rocket launcher for area denial.',
    category: 'equipment',
    equipSlot: 'hand1',
    weaponType: 'ranged',
    weaponSubtype: 'bazooka',
    tier: 1,
    rarity: 'common',
    stats: {
        damage: 60,
        attackSpeed: 0.3,
        range: 500,
        ammoCapacity: 1,
        splashRadius: 50
    },
    recipe: {
        scraps_t1_01: 20,
        minerals_t1_01: 12
    },
    sprite: 'weapon_ranged_bazooka_t1_01',
    sourceFile: 'weapon',
    files: {
        original: 'images/equipment/weapons/bazooka/weapon_bazooka_t1_01_original.png'
    },
    gripType: '2-hand'
};
