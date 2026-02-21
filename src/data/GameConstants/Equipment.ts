/** Equipment and weapon slot definitions. */
export const Equipment = {
    ARMOR_SLOTS: ['head', 'body', 'hands', 'legs', 'accessory', 'accessory2'],
    WEAPON_SLOTS: ['hand1', 'hand2'],
    TOOL_SLOTS: ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'],
    ALL_SLOTS: ['head', 'body', 'hands', 'legs', 'accessory', 'accessory2', 'hand1', 'hand2'],
    SLOT_CATEGORIES: {
        armor: ['head', 'body', 'hands', 'legs', 'accessory'],
        weapon: ['hand1', 'hand2'],
        tool: ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing']
    },
    SHIELD_CATEGORY_ID: 'shield'
};

export const Weapons = {
    RANGED_TYPES: [
        'rifle', 'pistol', 'submachine_gun', 'machine_gun',
        'flamethrower', 'shotgun', 'sniper_rifle', 'bazooka'
    ],
    MELEE_TYPES: [
        'sword', 'greatsword', 'axe', 'war_axe', 'mace', 'war_hammer',
        'lance', 'halberd', 'spear', 'flail', 'knife'
    ],
    ALL_TYPES: [
        'rifle', 'pistol', 'submachine_gun', 'machine_gun',
        'flamethrower', 'shotgun', 'sniper_rifle', 'bazooka',
        'sword', 'greatsword', 'axe', 'war_axe', 'mace', 'war_hammer',
        'lance', 'halberd', 'spear', 'flail', 'knife'
    ]
};
