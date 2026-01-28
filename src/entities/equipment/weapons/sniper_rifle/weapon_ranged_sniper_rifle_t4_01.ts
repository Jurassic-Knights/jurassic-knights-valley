/**
 * Entity: weapon_ranged_sniper_rifle_t4_01
 * Auto-generated from JSON.
 */

export default {
    id: 'weapon_ranged_sniper_rifle_t4_01',
    name: 'Rex Eye Long Rifle',
    description: 'A legendary sniper that can drop a T-Rex at 800m.',
    category: 'equipment',
    equipSlot: 'hand1',
    weaponType: 'ranged',
    weaponSubtype: 'sniper_rifle',
    tier: 4,
    rarity: 'legendary',
    stats: {
        damage: 120,
        attackSpeed: 0.8,
        range: 700,
        ammoCapacity: 5,
        critChance: 0.3,
        armorPen: 25
    },
    recipe: {
        scraps_t4_01: 22,
        minerals_t3_01: 15,
        bone_t2_01: 8,
        fossil_t1_01: 4
    },
    sprite: 'weapon_ranged_sniper_rifle_t4_01',
    sourceFile: 'weapon',
    files: {
        original: 'images/equipment/weapons/sniper_rifle/weapon_sniper_rifle_t4_01_original.png'
    },
    gripType: '2-hand'
};
