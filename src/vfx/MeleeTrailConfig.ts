/**
 * MeleeTrailConfig – Weapon-specific trail configs for MeleeTrailVFX.
 */
import type { MeleeTrailConfig as MeleeTrailConfigType } from '../types/vfx';

export const MELEE_TRAIL_CONFIGS: Record<string, MeleeTrailConfigType> = {
    knife: {
        color: '#00FFFF',
        fadeColor: '#004444',
        width: 3,
        maxPoints: 6,
        lifetime: 0.08,
        style: 'afterimage',
        flickerRate: 3
    },
    sword: {
        color: '#FFFFFF',
        fadeColor: '#4466AA',
        width: 6,
        maxPoints: 12,
        lifetime: 0.14,
        style: 'arc',
        glow: true
    },
    longsword: {
        color: '#66BBFF',
        fadeColor: '#224488',
        width: 7,
        maxPoints: 14,
        lifetime: 0.16,
        style: 'arc',
        glow: true,
        shimmer: true
    },
    greatsword: {
        color: '#2266FF',
        fadeColor: '#112266',
        width: 16,
        maxPoints: 18,
        lifetime: 0.28,
        style: 'heavy',
        blur: true,
        particles: true
    },
    axe: {
        color: '#FF8800',
        fadeColor: '#663300',
        width: 10,
        maxPoints: 10,
        lifetime: 0.12,
        style: 'debris',
        sparks: true
    },
    war_axe: {
        color: '#FF2200',
        fadeColor: '#660000',
        width: 18,
        maxPoints: 12,
        lifetime: 0.18,
        style: 'crescent',
        embers: true
    },
    mace: {
        color: '#FFAA00',
        fadeColor: '#553300',
        width: 10,
        maxPoints: 8,
        lifetime: 0.1,
        style: 'burst',
        shockwave: true
    },
    war_hammer: {
        color: '#FFCC00',
        fadeColor: '#664400',
        width: 20,
        maxPoints: 10,
        lifetime: 0.2,
        style: 'impact',
        shockwave: true,
        sparks: true
    },
    lance: {
        color: '#AACCEE',
        fadeColor: '#446688',
        width: 5,
        maxPoints: 16,
        lifetime: 0.12,
        style: 'thrust',
        flash: true
    },
    halberd: {
        color: '#DD4422',
        fadeColor: '#551111',
        width: 14,
        maxPoints: 14,
        lifetime: 0.2,
        style: 'sweep',
        windTrail: true
    },
    spear: {
        color: '#22DD22',
        fadeColor: '#115511',
        width: 5,
        maxPoints: 14,
        lifetime: 0.1,
        style: 'thrust',
        afterimage: true
    },
    flail: {
        color: '#CC8844',
        fadeColor: '#553311',
        width: 4,
        maxPoints: 14,
        lifetime: 0.16,
        style: 'chain',
        ball: true
    },
    default: {
        color: '#FFFFFF',
        fadeColor: '#444444',
        width: 5,
        maxPoints: 10,
        lifetime: 0.15,
        style: 'arc'
    }
};
