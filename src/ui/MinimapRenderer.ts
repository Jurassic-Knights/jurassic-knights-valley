/**
 * MinimapRenderer – Draw minimap content (mapgen4 terrain, entities, hero).
 */
import { Registry } from '@core/Registry';
import { entityManager } from '@core/EntityManager';
import { GameConstants } from '@data/GameConstants';
import { generateMapgen4 } from '../tools/map-editor/Mapgen4Generator';
import { drawCachedMeshToCanvas } from '../tools/map-editor/Mapgen4PreviewRenderer';
import type { Mapgen4Param } from '../tools/map-editor/Mapgen4Param';

const WORLD_SIZE = 160000;
const MESH_SIZE = 1000;

export function renderMinimap(
    ctx: CanvasRenderingContext2D,
    canvasSize: number,
    scale: number,
    viewLeft: number,
    viewTop: number,
    viewWidth: number,
    viewHeight: number,
    hero: { x: number; y: number } | null,
    zoomLevel: number
): void {
    const toCanvas = (worldX: number, worldY: number) => ({
        x: (worldX - viewLeft) * scale,
        y: (worldY - viewTop) * scale
    });

    // Draw mapgen4 polygon map as base terrain
    const worldManager = Registry?.get<{
        getMesh: () => { mesh: unknown; map: unknown } | null;
        getMapgen4Param: () => unknown;
        getCachedTownsAndRoads?: () => {
            towns: unknown[];
            roadSegments: unknown[];
            railroadPath: number[];
            railroadCrossings: unknown[];
        };
    }>('WorldManager');
    const meshAndMap = worldManager?.getMesh?.();
    if (meshAndMap) {
        const param = worldManager.getMapgen4Param();
        const { mesh, map } = meshAndMap;
        const { towns = [], roadSegments = [], railroadPath = [], railroadCrossings = [], railroadStationIds = [] } =
            worldManager.getCachedTownsAndRoads?.() ?? {};
        const vpX = (viewLeft / WORLD_SIZE) * MESH_SIZE;
        const vpY = (viewTop / WORLD_SIZE) * MESH_SIZE;
        const vpW = (viewWidth / WORLD_SIZE) * MESH_SIZE;
        const vpH = (viewHeight / WORLD_SIZE) * MESH_SIZE;
        const canvas = ctx.canvas;
        if (canvas) {
            drawCachedMeshToCanvas(
                canvas,
                mesh,
                map,
                param,
                vpX,
                vpY,
                vpW,
                vpH,
                towns,
                roadSegments,
                railroadPath,
                railroadCrossings,
                railroadStationIds
            );
        }
    } else {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    if (entityManager) {
        ctx.fillStyle = '#F44336';
        for (const enemy of entityManager.getByType('Enemy')) {
            if (!enemy.active || enemy.isDead) continue;
            const pos = toCanvas(enemy.x, enemy.y);
            if (pos.x < 0 || pos.x > canvasSize || pos.y < 0 || pos.y > canvasSize) continue;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        for (const boss of entityManager.getByType('Boss')) {
            if (!boss.active || boss.isDead) continue;
            const pos = toCanvas(boss.x, boss.y);
            if (pos.x < 0 || pos.x > canvasSize || pos.y < 0 || pos.y > canvasSize) continue;
            const pulse = Math.sin(Date.now() / 150) * 0.3 + 1;
            ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☠', pos.x, pos.y);
        }
    }

    // Hero: always at center (view scrolls with hero)
    if (hero) {
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const pulse = Math.sin(Date.now() / GameConstants.UI.MINIMAP_PULSE_MS) * 0.3 + 1;
        ctx.fillStyle = 'rgba(255, 87, 34, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 8);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, canvasSize - 10, canvasSize - 10);
}
