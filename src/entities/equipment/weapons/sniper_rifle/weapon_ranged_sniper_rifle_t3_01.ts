/**
 * Entity: weapon_ranged_sniper_rifle_t3_01
 * Auto-generated from JSON.
 */

export default {
    id: 'weapon_ranged_sniper_rifle_t3_01',
    name: 'Anti-Material Rifle',
    description: 'A heavy sniper for armored targets.',
    category: 'equipment',
    equipSlot: 'hand1',
    weaponType: 'ranged',
    weaponSubtype: 'sniper_rifle',
    tier: 3,
    rarity: 'rare',
    stats: {
        damage: 80,
        attackSpeed: 0.7,
        range: 700,
        ammoCapacity: 5,
        critChance: 0.25,
        armorPen: 15
    },
    recipe: {
        scraps_t3_01: 18,
        minerals_t2_01: 12,
        bone_t1_01: 5
    },
    sprite: 'weapon_ranged_sniper_rifle_t3_01',
    sourceFile: 'weapon',
    files: {
        original: 'images/equipment/weapons/sniper_rifle/weapon_sniper_rifle_t3_01_original.png'
    },
    gripType: '2-hand'
};
