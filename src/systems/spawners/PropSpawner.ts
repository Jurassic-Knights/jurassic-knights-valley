/**
 * PropSpawner - Handles decorative prop spawning on islands
 *
 * Extracted from SpawnManager.js for modularity.
 * Spawns foliage clusters and scattered items in water gaps.
 *
 * Owner: Level Architect
 */

import { Logger } from '@core/Logger';
import { Prop } from '../../world/Prop';
import { GameConstants } from '@data/GameConstants';
import { getConfig } from '@data/GameConfig';
import { entityManager } from '@core/EntityManager';
import { PropConfig } from '@data/PropConfig';
import { SpawnManagerService } from '../SpawnManager';
import { Registry } from '@core/Registry';
import type { Island } from '../../types/world';
import { IslandType } from '@config/WorldTypes';
import { IslandManagerService } from '../../world/IslandManager';

// Unmapped modules - need manual import

class PropSpawner {
    private spawnManager: SpawnManagerService;

    constructor(spawnManager: SpawnManagerService) {
        this.spawnManager = spawnManager;
    }

    /**
     * Check if position is on a bridge (FULL visual bounds + padding, for prop exclusion)
     * @param {number} x
     * @param {number} y
     * @param {number} padding - Extra padding around bridge bounds (default 100px for prop size)
     */
    isOnBridgeVisual(x: number, y: number, padding: number = GameConstants.UI.BRIDGE_VISUAL_PADDING) {
        const islandManager = this.spawnManager.getIslandManager();
        if (!islandManager) return false;

        const bridges = islandManager.getBridges();
        for (const bridge of bridges) {
            const bx = bridge.x - padding;
            const by = bridge.y - padding;
            const bw = bridge.width + padding * 2;
            const bh = bridge.height + padding * 2;

            if (x >= bx && x < bx + bw && y >= by && y < by + bh) {
                return true;
            }
        }
        return false;
    }

    /**
     * Spawn decorative props on all islands (except home)
     */
    spawnProps() {
        if (!Prop) {
            Logger.warn('[PropSpawner] Prop class not found, skipping prop spawn.');
            return;
        }

        const islandManager = this.spawnManager.getIslandManager();
        if (!islandManager) {
            Logger.warn('[PropSpawner] IslandManager not found.');
            return;
        }

        const spawnedProps: { x: number; y: number }[] = [];

        for (const island of islandManager.islands) {
            if ((island as Island).type === IslandType.HOME) continue;

            const foliageMap = (PropConfig && PropConfig.FOLIAGE_MAP ? PropConfig.FOLIAGE_MAP : {}) as Record<string, string[]>;
            const itemMap = (PropConfig && PropConfig.ITEM_MAP ? PropConfig.ITEM_MAP : {}) as Record<string, string[]>;
            const foliageList = foliageMap[island.name];
            const itemList = itemMap[island.name];

            if (foliageList) {
                this.spawnFoliage(island, foliageList, spawnedProps);
            }

            if (itemList) {
                this.spawnScatteredItems(island, itemList, spawnedProps);
            }
        }
        Logger.info(`[PropSpawner] Spawned ${spawnedProps.length} props.`);
    }

    spawnFoliage(island: Island, foliageList: string[], spawnedProps: { x: number; y: number }[]) {
        const C = getConfig().Spawning.PROPS;
        const islandManager = this.spawnManager.getIslandManager();
        const gap = islandManager?.waterGap ?? GameConstants.Spawning.PROPS.WATER_GAP_FALLBACK;

        const clusterCount = C.CLUSTER_COUNT_MIN + Math.floor(Math.random() * C.CLUSTER_COUNT_RND);

        for (let c = 0; c < clusterCount; c++) {
            const maxAttempts = GameConstants.Spawning.PROPS.FIND_POSITION_MAX_ATTEMPTS;
            const clusterPos = this.findValidPosition(
                island,
                gap,
                GameConstants.UI.BRIDGE_VISUAL_PADDING,
                spawnedProps,
                C.MIN_DIST,
                maxAttempts
            );
            if (!clusterPos) continue;

            const propsPerCluster =
                C.PROPS_PER_CLUSTER_MIN + Math.floor(Math.random() * C.PROPS_PER_CLUSTER_RND);

            for (let i = 0; i < propsPerCluster; i++) {
                const propId = foliageList[Math.floor(Math.random() * foliageList.length)];

                for (let k = 0; k < 8; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * C.CLUSTER_RADIUS * 0.8 + C.CLUSTER_RADIUS * 0.2;
                    const px = clusterPos.x + Math.cos(angle) * dist;
                    const py = clusterPos.y + Math.sin(angle) * dist;

                    if (
                        this.isValidPropPosition(
                            px,
                            py,
                            island,
                            GameConstants.UI.BRIDGE_VISUAL_PADDING,
                            spawnedProps,
                            C.MIN_DIST
                        )
                    ) {
                        this.createProp(px, py, propId, island);
                        spawnedProps.push({ x: px, y: py });
                        break;
                    }
                }
            }
        }
    }

    spawnScatteredItems(island: Island, itemList: string[], spawnedProps: { x: number; y: number }[]) {
        const C = getConfig().Spawning.PROPS;
        const islandManager = this.spawnManager.getIslandManager();
        const gap = islandManager?.waterGap ?? GameConstants.Spawning.PROPS.WATER_GAP_FALLBACK;

        const itemCount = C.ITEM_COUNT_MIN + Math.floor(Math.random() * C.ITEM_COUNT_RND);

        for (let i = 0; i < itemCount; i++) {
            const propId = itemList[Math.floor(Math.random() * itemList.length)];
            const itemPadding = GameConstants.Spawning.PROPS.ITEM_BRIDGE_PADDING;
            const maxAttempts = GameConstants.Spawning.PROPS.FIND_POSITION_MAX_ATTEMPTS;
            const pos = this.findValidPosition(
                island,
                gap,
                itemPadding,
                spawnedProps,
                C.MIN_DIST * 1.5,
                maxAttempts
            );

            if (pos) {
                this.createProp(pos.x, pos.y, propId, island);
                spawnedProps.push({ x: pos.x, y: pos.y });
            }
        }
    }

    findValidPosition(island: Island, gap: number, bridgePadding: number, existingProps: { x: number; y: number }[], minSpacing: number, maxAttempts: number) {
        const minX = island.worldX - gap;
        const maxX = island.worldX + island.width + gap;
        const minY = island.worldY - gap;
        const maxY = island.worldY + island.height + gap;

        for (let i = 0; i < maxAttempts; i++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);

            if (this.isValidPropPosition(x, y, island, bridgePadding, existingProps, minSpacing)) {
                return { x, y };
            }
        }
        return null;
    }

    isValidPropPosition(x: number, y: number, island: Island, bridgePadding: number, existingProps: { x: number; y: number }[], minSpacing: number) {
        // Inside Island Bounds (invalid - props go in water gap)
        if (
            x > island.worldX &&
            x < island.worldX + island.width &&
            y > island.worldY &&
            y < island.worldY + island.height
        )
            return false;

        // Bridge Clearance
        if (this.isOnBridgeVisual(x, y, bridgePadding)) return false;

        // Overlap Check
        const minDistSq = minSpacing * minSpacing;
        for (const p of existingProps) {
            if ((x - p.x) ** 2 + (y - p.y) ** 2 < minDistSq) return false;
        }

        return true;
    }

    createProp(x: number, y: number, sprite: string, island: Island) {
        const w = GameConstants.Spawning.PROPS.DEFAULT_WIDTH;
        const h = GameConstants.Spawning.PROPS.DEFAULT_HEIGHT;
        const prop = new Prop({
            x: x,
            y: y,
            sprite: sprite,
            width: w,
            height: h,
            islandGridX: island.gridX,
            islandGridY: island.gridY
        });
        if (entityManager) entityManager.add(prop);
    }
}

// ES6 Module Export
export { PropSpawner };
