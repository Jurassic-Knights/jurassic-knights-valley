/**
 * ProjectileVFXConfig – Weapon-specific projectile visual configs.
 */

export interface ProjectileConfig {
    color: string;
    coreColor: string;
    size: number;
    speed: number;
    length: number;
    glow?: boolean;
    glowSize?: number;
    trail?: boolean;
    fade?: boolean;
    pellets?: number;
    spread?: number;
}

export const PROJECTILE_CONFIGS: Record<string, ProjectileConfig> = {
    pistol: {
        color: '#FFF8DC',
        coreColor: '#FFFFFF',
        size: 3,
        speed: 1100,
        length: 15,
        glow: true,
        glowSize: 8
    },
    rifle: {
        color: '#FFD700',
        coreColor: '#FFFFFF',
        size: 4,
        speed: 1400,
        length: 28,
        glow: true,
        glowSize: 12
    },
    sniper_rifle: {
        color: '#00FFFF',
        coreColor: '#FFFFFF',
        size: 5,
        speed: 2000,
        length: 50,
        glow: true,
        glowSize: 15,
        trail: true
    },
    sniperrifle: {
        color: '#00FFFF',
        coreColor: '#FFFFFF',
        size: 5,
        speed: 2000,
        length: 50,
        glow: true,
        glowSize: 15,
        trail: true
    },
    shotgun: {
        color: '#FF6600',
        coreColor: '#FFFF00',
        size: 2,
        speed: 900,
        length: 10,
        pellets: 8,
        spread: 0.35,
        glow: true,
        glowSize: 6
    },
    machine_gun: {
        color: '#FFCC00',
        coreColor: '#FFFFFF',
        size: 3,
        speed: 1300,
        length: 18,
        glow: true,
        glowSize: 8
    },
    submachine_gun: {
        color: '#FFE055',
        coreColor: '#FFFFFF',
        size: 2,
        speed: 1200,
        length: 12,
        glow: true,
        glowSize: 6
    },
    flamethrower: {
        color: '#FF4500',
        coreColor: '#FFFF00',
        size: 10,
        speed: 500,
        length: 20,
        fade: true,
        glow: true,
        glowSize: 20
    },
    bazooka: {
        color: '#FF3300',
        coreColor: '#FFFF00',
        size: 10,
        speed: 600,
        length: 35,
        glow: true,
        glowSize: 25,
        trail: true
    },
    default: {
        color: '#FFFFCC',
        coreColor: '#FFFFFF',
        size: 4,
        speed: 1100,
        length: 20,
        glow: true,
        glowSize: 10
    }
};
