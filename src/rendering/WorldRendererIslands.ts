/**
 * WorldRendererIslands – Draw islands, bridges, home outpost, fallback grid.
 */
import { getConfig } from '@data/GameConfig';
import { IslandManagerService } from '../world/IslandManagerCore';
import { IslandType, BridgeOrientation } from '@config/WorldTypes';
import type { IViewport } from '../types/core';
import type { Island } from '../types/world';

interface CachedIsland extends Island {
    _cachedAssetId?: string;
    _scaledW?: number;
    _scaledH?: number;
    _drawX?: number;
    _drawY?: number;
}

export function drawWorld(
    ctx: CanvasRenderingContext2D,
    viewport: IViewport,
    islandManager: IslandManagerService,
    assetLoader: { getImagePath: (id: string) => string; createImage: (path: string) => HTMLImageElement; cache?: { get: (id: string) => HTMLImageElement | null }; preloadImage?: (id: string) => void } | null,
    zoneImages: Record<string, HTMLImageElement>,
    gameRenderer: { worldWidth: number; worldHeight: number } | null,
    addZoneImage: (id: string, img: HTMLImageElement) => void
): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-viewport.x, -viewport.y);

    const vpLeft = viewport.x - 200;
    const vpRight = viewport.x + viewport.width + 200;
    const vpTop = viewport.y - 200;
    const vpBottom = viewport.y + viewport.height + 200;

    const islandColor = '#4A5D23';
    const islandBorder = '#3A4D13';

    for (const rawIsland of islandManager.islands) {
        const island = rawIsland as CachedIsland;
        if (island.worldX + island.width < vpLeft || island.worldX > vpRight ||
            island.worldY + island.height < vpTop || island.worldY > vpBottom) continue;

        if (!island._cachedAssetId) {
            island._cachedAssetId = island.type === IslandType.HOME ? 'world_island_home' : 'zone_' + island.name.toLowerCase().replace(/ /g, '_');
            const scale = 1.2;
            island._scaledW = island.width * scale;
            island._scaledH = island.height * scale;
            island._drawX = island.worldX - (island._scaledW! - island.width) / 2;
            island._drawY = island.worldY - (island._scaledH! - island.height) / 2;
        }

        let drawn = false;
        if (assetLoader) {
            if (!zoneImages[island._cachedAssetId]) {
                const bgPath = assetLoader.getImagePath(island._cachedAssetId);
                if (bgPath) addZoneImage(island._cachedAssetId, assetLoader.createImage(bgPath));
            }
            const img = zoneImages[island._cachedAssetId];
            if (img?.complete && img.naturalWidth) {
                ctx.drawImage(img, island._drawX!, island._drawY!, island._scaledW!, island._scaledH!);
                drawn = true;
            }
        }
        if (!drawn) {
            ctx.fillStyle = islandColor;
            ctx.fillRect(island.worldX, island.worldY, island.width, island.height);
            ctx.strokeStyle = islandBorder;
            ctx.lineWidth = 3;
            ctx.strokeRect(island.worldX, island.worldY, island.width, island.height);
        }
        if (!island.unlocked) drawLockedOverlay(ctx, island);
    }

    drawBridges(ctx, islandManager, assetLoader);
    drawHomeOutpost(ctx, islandManager);

    if (gameRenderer) {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, gameRenderer.worldWidth, gameRenderer.worldHeight);
    }
    ctx.restore();
}

function drawLockedOverlay(ctx: CanvasRenderingContext2D, island: Island): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 80px "Courier New", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('??', island.worldX + island.width / 2, island.worldY + island.height / 2 - 40);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px "Courier New", sans-serif';
    ctx.fillText(`${island.unlockCost} Gold`, island.worldX + island.width / 2, island.worldY + island.height / 2 + 60);
}

function drawBridges(
    ctx: CanvasRenderingContext2D,
    islandManager: IslandManagerService,
    assetLoader: { cache?: { get: (id: string) => HTMLImageElement | null }; preloadImage?: (id: string) => void } | null
): void {
    const bridges = islandManager.getBridges();
    let planksImg: HTMLImageElement | null = null;
    if (assetLoader) {
        planksImg = assetLoader.cache?.get('world_bridge_planks') ?? null;
        if (!planksImg && assetLoader.preloadImage) assetLoader.preloadImage('world_bridge_planks');
    }

    for (const bridge of bridges) {
        ctx.save();
        if (planksImg) {
            ctx.translate(bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);
            if (bridge.type === BridgeOrientation.HORIZONTAL) {
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(planksImg, -bridge.height / 2, -bridge.width / 2, bridge.height, bridge.width);
            } else {
                ctx.drawImage(planksImg, -bridge.width / 2, -bridge.height / 2, bridge.width, bridge.height);
            }
        } else {
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);
            ctx.strokeStyle = '#5A4A2A';
            ctx.lineWidth = 2;
            if (bridge.type === BridgeOrientation.HORIZONTAL) {
                for (let x = bridge.x + 10; x < bridge.x + bridge.width; x += 15) {
                    ctx.beginPath();
                    ctx.moveTo(x, bridge.y);
                    ctx.lineTo(x, bridge.y + bridge.height);
                    ctx.stroke();
                }
            } else {
                for (let y = bridge.y + 10; y < bridge.y + bridge.height; y += 15) {
                    ctx.beginPath();
                    ctx.moveTo(bridge.x, y);
                    ctx.lineTo(bridge.x + bridge.width, y);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
}

function drawHomeOutpost(ctx: CanvasRenderingContext2D, islandManager: IslandManagerService): void {
    const home = islandManager.getHomeIsland();
    if (!home) return;
    const centerX = home.worldX + home.width / 2;
    const centerY = home.worldY + home.height / 2;
    const radius = getConfig().Interaction.REST_AREA_RADIUS;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 20]);
    (ctx as CanvasRenderingContext2D & { lineDashOffset: number }).lineDashOffset = -(performance.now() / 15);
    ctx.stroke();
    ctx.setLineDash([]);
    (ctx as CanvasRenderingContext2D & { lineDashOffset: number }).lineDashOffset = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('REST AREA', centerX, centerY);
}

export function drawFallbackGrid(ctx: CanvasRenderingContext2D, viewport: IViewport): void {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    const offsetX = -viewport.x % gridSize;
    const offsetY = -viewport.y % gridSize;
    for (let x = offsetX; x < ctx.canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
    }
    for (let y = offsetY; y < ctx.canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
        ctx.stroke();
    }
}
