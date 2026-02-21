/**
 * ChunkManagerHeroSpawn — Hero spawn marker creation and update.
 */

import * as PIXI from 'pixi.js';
import type { HeroSpawnPosition } from './MapEditorTypes';

export function createHeroSpawnMarker(): PIXI.Container {
    const marker = new PIXI.Container();
    marker.zIndex = 9980;
    const text = new PIXI.Text({
        text: 'hero spawn',
        style: {
            fill: 0x66fcf1,
            fontSize: 24,
            fontFamily: 'system-ui, sans-serif'
        }
    });
    text.anchor.set(0.5, 0.5);
    marker.addChild(text);
    return marker;
}

export function updateHeroSpawnMarker(
    marker: PIXI.Container | null,
    heroSpawn: HeroSpawnPosition | null
): void {
    if (!marker) return;
    if (!heroSpawn) {
        marker.visible = false;
        return;
    }
    marker.visible = true;
    marker.position.set(heroSpawn.x, heroSpawn.y);
}

/**
 * Scale the text so it stays readable at all zoom levels.
 * The marker itself scales via worldContainer, so we apply the inverse zoom
 * to the text child directly to maintain a constant screen size without drifting.
 */
export function updateHeroSpawnMarkerScale(marker: PIXI.Container | null, zoom: number): void {
    if (!marker || marker.children.length === 0) return;
    const scale = Math.min(100, Math.max(0.5, 1 / zoom));
    const text = marker.children[0] as PIXI.Text;
    text.scale.set(scale);
}

