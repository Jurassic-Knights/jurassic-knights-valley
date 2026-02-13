/**
 * ChunkManagerDelegation — Ground and zone delegation helpers for ChunkManager.
 */

import * as PIXI from 'pixi.js';
import type { ChunkData } from './MapEditorTypes';
import type { GroundSystem } from './GroundSystem';
import type { ZoneSystem } from './ZoneSystem';

export interface GroundContext {
    groundSystem: GroundSystem;
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, PIXI.Container>;
}

export interface ZoneContext {
    zoneSystem: ZoneSystem;
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, PIXI.Container>;
}

export function paintSplat(
    ctx: GroundContext,
    worldX: number,
    worldY: number,
    radius: number,
    intensity: number,
    soft: boolean = true
) {
    return ctx.groundSystem.paintSplat(
        worldX, worldY, radius, intensity, soft,
        ctx.worldData, ctx.loadedChunks
    );
}

export async function updateGroundTile(
    ctx: GroundContext,
    chunkKey: string,
    lx: number,
    ly: number
): Promise<void> {
    const chunk = ctx.loadedChunks.get(chunkKey);
    const data = ctx.worldData.get(chunkKey);
    if (!chunk || !data) return;

    let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
    if (!groundLayer) {
        groundLayer = new PIXI.Container();
        (groundLayer as { label?: string }).label = 'ground_layer';
        chunk.addChildAt(groundLayer, 0);
    }
    await ctx.groundSystem.updateTile(
        chunkKey, lx, ly, data, groundLayer,
        undefined, undefined, undefined, ctx.worldData
    );
}

export function restoreSplatData(
    ctx: GroundContext,
    changes: Map<string, { idx: number; oldVal: number; newVal: number }[]>,
    undo: boolean
) {
    return ctx.groundSystem.restoreSplatData(changes, undo, ctx.worldData, ctx.loadedChunks);
}

export function setZone(ctx: ZoneContext, x: number, y: number, category: string, zoneId: string | null): void {
    ctx.zoneSystem.setZone(x, y, category, zoneId, ctx.worldData, ctx.loadedChunks);
}

export function setZones(
    ctx: ZoneContext,
    updates: { x: number; y: number; category: string; zoneId: string | null }[]
) {
    return ctx.zoneSystem.setZones(updates, ctx.worldData, ctx.loadedChunks);
}

export function getZone(ctx: ZoneContext, x: number, y: number, category: string): string | null {
    return ctx.zoneSystem.getZone(x, y, category, ctx.worldData);
}

export function refreshZones(ctx: ZoneContext): void {
    ctx.loadedChunks.forEach((chunk, key) => {
        const data = ctx.worldData.get(key);
        if (data?.zones) ctx.zoneSystem.renderZoneOverlay(chunk, data.zones);
    });
}
