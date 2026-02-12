/**
 * ProjectileMuzzleFlash – Multi-layered muzzle flash VFX.
 */
import { VFXController } from './VFXController';
import type { ProjectileConfig } from './ProjectileVFXConfig';

export function spawnMuzzleFlash(x: number, y: number, angle: number, _config: ProjectileConfig): void {
    if (!VFXController) return;

    VFXController.playForeground(x, y, {
        type: 'glow',
        color: '#FFFFFF',
        count: 1,
        speed: 0,
        lifetime: 60,
        size: 40,
        blendMode: 'lighter'
    });

    VFXController.playForeground(x, y, {
        type: 'glow',
        color: '#FF8800',
        count: 1,
        speed: 0,
        lifetime: 100,
        size: 25,
        blendMode: 'lighter'
    });

    VFXController.playForeground(x, y, {
        type: 'spark',
        color: '#FFF700',
        count: 8,
        speed: 18,
        lifetime: 120,
        size: 3,
        angle,
        spread: 0.6,
        drag: 0.9,
        colorOverLifetime: ['#FFFFFF', '#FF4500'],
        blendMode: 'lighter'
    });

    VFXController.playForeground(x, y, {
        type: 'debris',
        color: '#FFCC00',
        count: 6,
        speed: 10,
        lifetime: 200,
        size: 4,
        angle,
        spread: 1.2,
        gravity: 0.3,
        drag: 0.92,
        blendMode: 'lighter'
    });

    VFXController.playForeground(x, y, {
        type: 'glow',
        color: '#555555',
        count: 3,
        speed: 2,
        lifetime: 400,
        size: 15,
        angle: angle + Math.PI,
        spread: 0.8,
        alpha: 0.3,
        drag: 0.98,
        blendMode: 'source-over'
    });
}
