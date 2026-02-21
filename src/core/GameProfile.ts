/**
 * GameProfile - Profile result logging for Game
 */

import { Logger } from './Logger';

export interface ProfileData {
    systems: Record<string, number>;
    entityManager: number;
    gameRenderer: number;
    vfxForeground: number;
    frameCount: number;
    startTime: number;
}

export function logProfileResults(p: ProfileData): void {
    const elapsed = (performance.now() - p.startTime) / 1000;
    const avgFps = p.frameCount / elapsed;

    Logger.info('=== FRAME PROFILE ===');
    Logger.info(`Frames: ${p.frameCount}, Time: ${elapsed.toFixed(1)}s, Avg FPS: ${avgFps.toFixed(1)}`);
    Logger.info('--- Systems (ms total) ---');
    for (const [name, time] of Object.entries(p.systems).sort((a, b) => (b[1] as number) - (a[1] as number))) {
        Logger.info(`  ${name}: ${(time as number).toFixed(1)}ms (${((time as number) / p.frameCount).toFixed(2)}ms/frame)`);
    }
    Logger.info(`--- EntityManager: ${p.entityManager.toFixed(1)}ms (${(p.entityManager / p.frameCount).toFixed(2)}ms/frame)`);
    Logger.info(`--- GameRenderer: ${p.gameRenderer.toFixed(1)}ms (${(p.gameRenderer / p.frameCount).toFixed(2)}ms/frame)`);
    Logger.info(`--- VFX Foreground: ${p.vfxForeground.toFixed(1)}ms (${(p.vfxForeground / p.frameCount).toFixed(2)}ms/frame)`);
    Logger.info('=====================');
}
