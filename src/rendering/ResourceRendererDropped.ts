/**
 * ResourceRendererDropped – Render dropped item entities.
 */
import { AssetLoader } from '@core/AssetLoader';
import { MaterialLibrary } from '@vfx/MaterialLibrary';
import type { DroppedItem } from '../gameplay/DroppedItem';

export function renderDroppedItem(ctx: CanvasRenderingContext2D, item: DroppedItem): void {
    if (!item.active) return;

    if (item.isMagnetized && item.trailHistory.length > 2) {
        ctx.save();
        ctx.strokeStyle = item.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < item.trailHistory.length - 1; i++) {
            const p1 = item.trailHistory[i] as { x: number; y: number; z?: number };
            const p2 = item.trailHistory[i + 1] as { x: number; y: number; z?: number };
            const alpha = (i / item.trailHistory.length) * 0.6;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 8 + (i / item.trailHistory.length) * 24;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y - (p1.z || 0));
            ctx.lineTo(p2.x, p2.y - (p2.z || 0));
            ctx.stroke();
        }
        const last = item.trailHistory[item.trailHistory.length - 1] as { x: number; y: number; z?: number };
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y - (last.z || 0));
        ctx.lineTo(item.x, item.y - item.z);
        ctx.stroke();
        ctx.restore();
    }

    const pulse = 0.7 + 0.3 * Math.sin(item.pulseTime * 4);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    const shadowSize = Math.max(0, (item.width / 2) * (1 - item.z / 100));
    ctx.ellipse(item.x, item.y, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const renderY = item.y - item.z;

    if (!item._cachedAssetId) item._cachedAssetId = item.customIcon || item.resourceType;
    const assetId = item._cachedAssetId;

    if (!item._spriteImage && AssetLoader) {
        const imagePath = AssetLoader.getImagePath(assetId);
        if (imagePath) {
            item._spriteImage = AssetLoader.createImage(imagePath, () => { item._spriteLoaded = true; });
            item._spriteLoaded = false;
        }
    }

    if (item._spriteLoaded && item._spriteImage) {
        if (MaterialLibrary && !item._silhouetteCanvas) {
            const rarityColor = item.rarityColor || '#BDC3C7';
            item._silhouetteCanvas = MaterialLibrary.get(assetId, 'silhouette', { color: rarityColor }, item._spriteImage) as HTMLCanvasElement;
        }

        ctx.save();
        ctx.translate(item.x, renderY);
        const scale = 1 + 0.1 * Math.sin(item.pulseTime * 5);
        ctx.scale(scale, scale);

        if (item._silhouetteCanvas) {
            const w = item.width, h = item.height, x = -w / 2, y = -h / 2;
            ctx.globalAlpha = 0.7;
            const outlineSize = 4;
            ctx.drawImage(item._silhouetteCanvas, x - outlineSize / 2, y - outlineSize / 2, w + outlineSize, h + outlineSize);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(item.x, renderY);
        ctx.scale(scale, scale);
        ctx.drawImage(item._spriteImage, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
    } else {
        ctx.save();
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(item.x, renderY - item.height / 2);
        ctx.lineTo(item.x + item.width / 2, renderY);
        ctx.lineTo(item.x, renderY + item.height / 2);
        ctx.lineTo(item.x - item.width / 2, renderY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    if (item.amount > 1) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`x${item.amount}`, item.x, item.y + item.height / 2 + 10);
    }
}
