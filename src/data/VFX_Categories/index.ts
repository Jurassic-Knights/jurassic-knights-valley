/**
 * VFX_Categories - Domain-Specific VFX Configurations (by game system)
 */
import { PURCHASE } from './purchase';
import { UNLOCK } from './unlock';
import { MAGNET } from './magnet';
import { HERO } from './hero';
import { DINO } from './dino';
import { RESOURCE } from './resource';
import { PROJECTILES } from './projectiles';

export const VFX_Categories = {
    PURCHASE, UNLOCK, MAGNET, HERO, DINO, RESOURCE, PROJECTILES
} as Record<string, unknown>;
