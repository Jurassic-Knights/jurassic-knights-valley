/**
 * Entity: weapon_ranged_bazooka_t3_01
 * Auto-generated from JSON.
 */

export default {
    id: 'weapon_ranged_bazooka_t3_01',
    name: 'Dino Destroyer',
    description: 'A heavy launcher for taking down large saurians.',
    category: 'equipment',
    equipSlot: 'hand1',
    weaponType: 'ranged',
    weaponSubtype: 'bazooka',
    tier: 3,
    rarity: 'rare',
    stats: {
        damage: 160,
        attackSpeed: 0.5,
        range: 500,
        ammoCapacity: 2,
        splashRadius: 75,
        armorPen: 25
    },
    recipe: {
        scraps_t3_01: 30,
        minerals_t2_01: 20,
        bone_t1_01: 8
    },
    sprite: 'weapon_ranged_bazooka_t3_01',
    sourceFile: 'weapon',
    files: {
        original: 'images/equipment/weapons/bazooka/weapon_bazooka_t3_01_original.png'
    },
    gripType: '2-hand'
};
