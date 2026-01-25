/**
 * Entity: weapon_ranged_pistol_t1_01
 * Auto-generated. Edit in dashboard.
 */
import type { EquipmentEntity } from '@types/entities';

export default {
    "id": "weapon_ranged_pistol_t1_01",
    "name": "Trench Revolver",
    "description": "A reliable six-shooter for close defense.",
    "category": "equipment",
    "equipSlot": "hand1",
    "weaponType": "ranged",
    "weaponSubtype": "pistol",
    "tier": 1,
    "rarity": "common",
    "stats": {
        "damage": 8,
        "attackSpeed": 2,
        "range": "500",
        "ammoCapacity": 6
    },
    "recipe": {
        "scraps_t1_01": 6,
        "minerals_t1_01": 3
    },
    "sprite": "weapon_ranged_pistol_t1_01",
    "sourceFile": "weapon",
    "files": {
        "original": "images/equipment/weapons/pistol/weapon_pistol_t1_01_original.png"
    },
    "gripType": "1-hand"
} satisfies EquipmentEntity;
