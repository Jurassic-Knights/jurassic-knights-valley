/**
 * MinimapRenderer – Draw minimap content (biomes, roads, islands, enemies, hero).
 */
import { BiomeManager } from '../world/BiomeManager';
import { entityManager } from '@core/EntityManager';
import { IslandManager } from '../world/IslandManager';
import { IslandType } from '@config/WorldTypes';
import { GameConstants } from '@data/GameConstants';

export function renderMinimap(
    ctx: CanvasRenderingContext2D,
    canvasSize: number,
    scale: number,
    viewLeft: number,
    viewTop: number,
    hero: { x: number; y: number } | null,
    zoomLevel: number
): void {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const toCanvas = (worldX: number, worldY: number) => ({
        x: (worldX - viewLeft) * scale,
        y: (worldY - viewTop) * scale
    });

    if (BiomeManager) {
        for (const biome of Object.values(BiomeManager.BIOMES)) {
            const polygon = biome.polygon;
            if (!polygon || polygon.length < 3) continue;
            const points = polygon.map((p: { x: number; y: number }) => toCanvas(p.x, p.y));
            ctx.fillStyle = biome.color + '60';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = biome.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            let cx = 0, cy = 0;
            for (const p of points) { cx += p.x; cy += p.y; }
            cx /= points.length;
            cy /= points.length;
            if (cx > 20 && cx < canvasSize - 20 && cy > 20 && cy < canvasSize - 20) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(biome.name, cx, cy);
            }
        }
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const road of BiomeManager.ROADS) {
            if (!road.points || road.points.length < 4) continue;
            const p0 = toCanvas(road.points[0].x, road.points[0].y);
            const p1 = toCanvas(road.points[1].x, road.points[1].y);
            const p2 = toCanvas(road.points[2].x, road.points[2].y);
            const p3 = toCanvas(road.points[3].x, road.points[3].y);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            ctx.stroke();
        }
    }

    if (IslandManager) {
        const islands = IslandManager.islands || [];
        for (const island of islands) {
            const pos = toCanvas(island.worldX, island.worldY);
            const w = island.width * scale;
            const h = island.height * scale;
            if (pos.x + w < 0 || pos.x > canvasSize || pos.y + h < 0 || pos.y > canvasSize) continue;
            ctx.fillStyle = island.type === IslandType.HOME ? '#4CAF50' : island.unlocked ? '#2196F3' : '#37474F';
            ctx.fillRect(pos.x, pos.y, w, h);
            ctx.strokeStyle = island.unlocked ? '#fff' : '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x, pos.y, w, h);
        }
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

    if (BiomeManager && hero) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(BiomeManager.getDebugInfo(hero.x, hero.y), 10, 10);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Zoom: ${zoomLevel.toFixed(1)}x`, canvasSize - 10, canvasSize - 10);
}
