/**
 * ResourceConstants - Static color and rarity definitions for Resource
 */

export const RESOURCE_COLORS: Record<string, string> = {
    scraps: '#7A7A7A',
    minerals: '#8B4513',
    food: '#8B0000',
    wood: '#5D4037',
    gold: '#FFD700',
    salvage: '#2F2F2F'
};

export const RESOURCE_RARITY = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    LEGENDARY: 'legendary'
} as const;

export const RESOURCE_RARITY_COLORS: Record<string, string> = {
    common: '#BDC3C7',
    uncommon: '#2ECC71',
    rare: '#3498DB',
    legendary: '#F1C40F'
};
