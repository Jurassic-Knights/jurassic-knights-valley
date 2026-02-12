/**
 * IslandManagerWalkable - Walkable zone building and unlock trigger resolution
 */
import { ZoneType } from '@config/WorldTypes';
import type { Island, WalkableZoneWithId } from '../types/world';
import type { Bridge } from '../types/world';
import type { PlayableBounds } from '../types/world';

export function buildWalkableZones(
    islands: Island[],
    bridges: Bridge[],
    waterGap: number,
    overlap: number,
    getPlayableBounds: (island: Island) => PlayableBounds | null
): WalkableZoneWithId[] {
    const zones: WalkableZoneWithId[] = [];

    for (const island of islands) {
        if (island.unlocked) {
            const bounds = getPlayableBounds(island);
            if (bounds) {
                zones.push({
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    id: `island_${island.gridX}_${island.gridY}`,
                    type: 'island'
                });
            }
        }
    }

    for (const bridge of bridges) {
        const centerX = bridge.x + bridge.width / 2;
        const centerY = bridge.y + bridge.height / 2;

        let zoneWidth = bridge.width;
        let zoneHeight = bridge.height;

        if (bridge.type === 'horizontal') {
            zoneWidth = waterGap + overlap * 2;
        } else {
            zoneHeight = waterGap + overlap * 2;
        }

        zones.push({
            x: centerX - zoneWidth / 2,
            y: centerY - zoneHeight / 2,
            width: zoneWidth,
            height: zoneHeight,
            id: `bridge_${bridge.from.col}_${bridge.from.row}_to_${bridge.to.col}_${bridge.to.row}`,
            type: 'bridge'
        });
    }

    return zones;
}

export function getUnlockTrigger(
    x: number,
    y: number,
    walkableZones: WalkableZoneWithId[],
    getIslandByGrid: (gridX: number, gridY: number) => Island | undefined
): Island | null {
    for (const zone of walkableZones) {
        if (zone.type === ZoneType.BRIDGE) {
            if (
                x >= zone.x &&
                x <= zone.x + zone.width &&
                y >= zone.y &&
                y <= zone.y + zone.height
            ) {
                const parts = zone.id.split('_');
                if (parts.length === 6) {
                    const fromCol = parseInt(parts[1]);
                    const fromRow = parseInt(parts[2]);
                    const toCol = parseInt(parts[4]);
                    const toRow = parseInt(parts[5]);

                    const fromIsland = getIslandByGrid(fromCol, fromRow);
                    const toIsland = getIslandByGrid(toCol, toRow);

                    if (
                        fromIsland &&
                        fromIsland.unlocked &&
                        toIsland &&
                        !toIsland.unlocked
                    ) {
                        return toIsland;
                    }
                    if (
                        toIsland &&
                        toIsland.unlocked &&
                        fromIsland &&
                        !fromIsland.unlocked
                    ) {
                        return fromIsland;
                    }
                }
            }
        }
    }
    return null;
}
