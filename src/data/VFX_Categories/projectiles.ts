const WEAPON_MAP: Record<string, string | null> = {
    pistol: 'PROJECTILE_PISTOL', rifle: 'PROJECTILE_RIFLE', sniper_rifle: 'PROJECTILE_MARKSMAN', sniperrifle: 'PROJECTILE_MARKSMAN',
    shotgun: 'PROJECTILE_SHOTGUN', machine_gun: 'PROJECTILE_MACHINEGUN', submachine_gun: 'PROJECTILE_MACHINEGUN',
    flamethrower: 'PROJECTILE_RIFLE', bazooka: 'PROJECTILE_MARKSMAN',
    sword: null, longsword: null, greatsword: null, axe: null, war_axe: null, mace: null, war_hammer: null, lance: null, halberd: null, spear: null, flail: null, knife: null,
    revolver: 'PROJECTILE_PISTOL', marksman: 'PROJECTILE_MARKSMAN', sniper: 'PROJECTILE_MARKSMAN', machinegun: 'PROJECTILE_MACHINEGUN', smg: 'PROJECTILE_MACHINEGUN', default: 'PROJECTILE_PISTOL'
};
const MUZZLE_FLASH: Record<string, unknown> = {
    pistol: { distance: 140, size: 40, spread: 0.3 }, rifle: { distance: 190, size: 60, spread: 0.2 },
    sniper_rifle: { distance: 250, size: 80, spread: 0.1 }, sniperrifle: { distance: 250, size: 80, spread: 0.1 },
    shotgun: { distance: 160, size: 80, spread: 0.6 }, machine_gun: { distance: 180, size: 50, spread: 0.25 },
    submachine_gun: { distance: 160, size: 45, spread: 0.3 }, flamethrower: { distance: 100, size: 100, spread: 0.5 },
    bazooka: { distance: 200, size: 120, spread: 0.2 },
    revolver: { distance: 150, size: 50, spread: 0.4 }, marksman: { distance: 220, size: 70, spread: 0.15 },
    sniper: { distance: 250, size: 80, spread: 0.1 }, machinegun: { distance: 180, size: 50, spread: 0.25 }, default: { distance: 150, size: 50, spread: 0.3 }
};
export const PROJECTILES = {
    WEAPON_MAP,
    getTemplateForWeapon(weaponType: string) { return WEAPON_MAP[weaponType?.toLowerCase()] ?? WEAPON_MAP.default; },
    MUZZLE_FLASH,
    getMuzzleFlash(weaponType: string) { return MUZZLE_FLASH[weaponType?.toLowerCase()] ?? MUZZLE_FLASH.default; }
};
