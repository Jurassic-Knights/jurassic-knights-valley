/**
 * EquipmentUIFilterConfig - Filter hierarchy and mode categories for equipment UI
 */
export interface FilterCategory {
    id: string;
    label: string;
    iconId?: string;
    children?: FilterCategory[];
}

export const MODE_CATEGORIES: Record<string, FilterCategory[]> = {
    armor: [
        { id: 'all', label: 'ALL' },
        { id: 'head', label: 'HEAD' },
        { id: 'body', label: 'BODY' },
        { id: 'hands', label: 'HANDS' },
        { id: 'legs', label: 'LEGS' },
        { id: 'accessory', label: 'ACCESSORY' }
    ],
    weapon: [
        { id: 'all', label: 'ALL' },
        { id: 'melee', label: 'MELEE' },
        { id: 'ranged', label: 'RANGED' },
        { id: 'shield', label: 'SHIELD' },
        { id: '1-hand', label: '1-HAND' },
        { id: '2-hand', label: '2-HAND' }
    ],
    tool: [
        { id: 'all', label: 'ALL' },
        { id: 'mining', label: '?? MINING' },
        { id: 'woodcutting', label: '?? WOODCUT' },
        { id: 'harvesting', label: '?? HARVEST' },
        { id: 'fishing', label: '?? FISHING' }
    ]
};

export function getFilterHierarchy(selectedMode: string): FilterCategory[] {
    const rootCategories: FilterCategory[] = [];

    if (selectedMode === 'weapon') {
        rootCategories.push(
            { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
            {
                id: '1-hand',
                label: '1-HAND',
                iconId: 'ui_icon_1-hand',
                children: [
                    {
                        id: 'melee',
                        label: 'MELEE',
                        iconId: 'ui_icon_melee',
                        children: [
                            { id: 'sword', label: 'SWORD', iconId: 'ui_icon_sword' },
                            { id: 'axe', label: 'AXE', iconId: 'ui_icon_axe' },
                            { id: 'mace', label: 'MACE', iconId: 'ui_icon_mace' },
                            { id: 'knife', label: 'KNIFE', iconId: 'ui_icon_knife' },
                            { id: 'flail', label: 'FLAIL', iconId: 'ui_icon_flail' },
                            { id: 'shield', label: 'SHIELD', iconId: 'ui_icon_shield' }
                        ]
                    },
                    {
                        id: 'ranged',
                        label: 'RANGED',
                        iconId: 'ui_icon_ranged',
                        children: [
                            { id: 'pistol', label: 'PISTOL', iconId: 'ui_icon_pistol' },
                            { id: 'submachine_gun', label: 'SMG', iconId: 'ui_icon_machine_gun' }
                        ]
                    }
                ]
            },
            {
                id: '2-hand',
                label: '2-HAND',
                iconId: 'ui_icon_2-hand',
                children: [
                    {
                        id: 'melee',
                        label: 'MELEE',
                        iconId: 'ui_icon_melee',
                        children: [
                            { id: 'greatsword', label: 'GREATSWORD', iconId: 'ui_icon_greatsword' },
                            { id: 'spear', label: 'SPEAR', iconId: 'ui_icon_spear' },
                            { id: 'war_axe', label: 'WAR AXE', iconId: 'ui_icon_war_axe' },
                            { id: 'war_hammer', label: 'HAMMER', iconId: 'ui_icon_war_hammer' },
                            { id: 'lance', label: 'LANCE', iconId: 'ui_icon_lance' },
                            { id: 'halberd', label: 'HALBERD', iconId: 'ui_icon_halberd' }
                        ]
                    },
                    {
                        id: 'ranged',
                        label: 'RANGED',
                        iconId: 'ui_icon_ranged',
                        children: [
                            { id: 'rifle', label: 'RIFLE', iconId: 'ui_icon_rifle' },
                            { id: 'machine_gun', label: 'MG', iconId: 'ui_icon_machine_gun' },
                            { id: 'shotgun', label: 'SHOTGUN', iconId: 'ui_icon_shotgun' },
                            { id: 'sniper_rifle', label: 'SNIPER', iconId: 'ui_icon_sniper_rifle' },
                            { id: 'bazooka', label: 'BAZOOKA', iconId: 'ui_icon_bazooka' },
                            { id: 'flamethrower', label: 'FLAME', iconId: 'ui_icon_flamethrower' }
                        ]
                    }
                ]
            }
        );
    } else if (selectedMode === 'armor') {
        rootCategories.push(
            { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
            { id: 'head', label: 'HEAD', iconId: 'ui_icon_helmet' },
            { id: 'body', label: 'BODY', iconId: 'ui_icon_chest' },
            { id: 'hands', label: 'HANDS', iconId: 'ui_icon_gloves' },
            { id: 'legs', label: 'LEGS', iconId: 'ui_icon_legs' },
            { id: 'accessory', label: 'ACC.', iconId: 'ui_icon_accessory' }
        );
    } else {
        rootCategories.push(
            { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
            { id: 'mining', label: 'MINING', iconId: 'ui_icon_pickaxe' },
            { id: 'woodcutting', label: 'WOOD', iconId: 'ui_icon_wood_axe' },
            { id: 'harvesting', label: 'CROP', iconId: 'ui_icon_harvesting' },
            { id: 'fishing', label: 'FISH', iconId: 'ui_icon_fishing' }
        );
    }
    return rootCategories;
}
