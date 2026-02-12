/**
 * ProjectileWeaponType – Infer weapon subtype from equipped weapon for projectile VFX.
 */

interface IWeaponCarrier {
    equipment?: {
        getSlot?: (slot: string) => {
            id?: string;
            name?: string;
            weaponSubtype?: string;
            weaponType?: string;
        };
    };
}

export function getWeaponType(hero: IWeaponCarrier): string {
    if (!hero?.equipment) return 'pistol';

    const hand1 = hero.equipment.getSlot?.('hand1');
    if (hand1) {
        if (hand1.weaponSubtype) return hand1.weaponSubtype;
        if (hand1.weaponType === 'ranged') {
            const id = (hand1.id || '').toLowerCase();
            const name = (hand1.name || '').toLowerCase();
            if (id.includes('shotgun') || name.includes('shotgun')) return 'shotgun';
            if (id.includes('sniper') || name.includes('sniper') || name.includes('marksman')) return 'sniperrifle';
            if (id.includes('rifle') || name.includes('rifle')) return 'rifle';
            if (id.includes('machine') || id.includes('smg')) return 'machine_gun';
            if (id.includes('revolver') || name.includes('revolver')) return 'pistol';
            if (id.includes('pistol') || name.includes('pistol')) return 'pistol';
            return 'pistol';
        }
    }

    const hand2 = hero.equipment.getSlot?.('hand2');
    if (hand2?.weaponSubtype) return hand2.weaponSubtype;

    return 'pistol';
}
