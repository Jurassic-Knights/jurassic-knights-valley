/**
 * HomeBaseRenderer - Renders outpost, forge, trees, and debug zone
 */

import { GameRenderer } from '@core/GameRenderer';
import { AssetLoader } from '@core/AssetLoader';
import type { Bounds } from '../types/world';
import type { IEntity } from '../types/core';

export interface HomeBaseRenderState {
    _cachedHome: { gridX: number; gridY: number } | null;
    _cachedBounds: Bounds | null;
    _cachedTrees: IEntity[];
    _sortedTrees: IEntity[];
    _outpostPath: string | null;
    _forgePath: string | null;
    _treePath: string | null;
    _treeConsumedPath: string | null;
    _outpostImg: HTMLImageElement | null;
    _forgeImg: HTMLImageElement | null;
    _treeImage: HTMLImageElement | null;
    _treeConsumedImage: HTMLImageElement | null;
    _treeLoaded: boolean;
    _treeConsumedLoaded: boolean;
    _forgePos: { x: number; y: number; size: number } | null;
    _debugSpawnZone: {
        minX: number; minY: number; maxX: number; maxY: number;
        centerX: number; centerY: number; restAreaRadius: number;
    } | null;
}

export function renderHomeBase(ctx: CanvasRenderingContext2D, state: HomeBaseRenderState): void {
    const bounds = state._cachedBounds;

    if (state._debugSpawnZone && GameRenderer?.debugMode) {
        const z = state._debugSpawnZone;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(z.minX, z.minY, z.maxX - z.minX, z.maxY - z.minY);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        ctx.fillRect(z.minX, z.minY, z.maxX - z.minX, z.maxY - z.minY);
        ctx.beginPath();
        ctx.arc(z.centerX, z.centerY, z.restAreaRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 0, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.fillStyle = 'red';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TREE SPAWN ZONE', z.centerX, z.minY - 20);
        ctx.fillText(`Trees: ${state._cachedTrees?.length || 0}`, z.centerX, z.minY - 50);
        ctx.restore();
    }

    if (bounds && state._outpostPath) {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        let img = state._outpostImg;
        if (!img) {
            (state as { _outpostImg: HTMLImageElement | null })._outpostImg = AssetLoader.createImage(state._outpostPath);
            img = (state as { _outpostImg: HTMLImageElement | null })._outpostImg;
        }
        if (img?.complete && img.naturalWidth) {
            ctx.drawImage(img, centerX - 150, centerY - 150, 300, 300);
        }
    }

    if (bounds && state._forgePath) {
        const forgeSize = 250;
        const forgeX = bounds.x + forgeSize / 2 + 30;
        const forgeY = bounds.y + bounds.height - forgeSize / 2 - 30;
        (state as { _forgePos: { x: number; y: number; size: number } | null })._forgePos = { x: forgeX, y: forgeY, size: forgeSize };
        let img = state._forgeImg;
        if (!img) {
            (state as { _forgeImg: HTMLImageElement | null })._forgeImg = AssetLoader.createImage(state._forgePath);
            img = (state as { _forgeImg: HTMLImageElement | null })._forgeImg;
        }
        if (img?.complete && img.naturalWidth) {
            ctx.drawImage(img, forgeX - forgeSize / 2, forgeY - forgeSize / 2, forgeSize, forgeSize);
        }
    }

    if (!state._treeImage && state._treePath) {
        (state as { _treeImage: HTMLImageElement | null })._treeImage = AssetLoader.createImage(state._treePath, () => {
            (state as { _treeLoaded: boolean })._treeLoaded = true;
        });
        (state as { _treeLoaded: boolean })._treeLoaded = false;
    }
    if (!state._treeConsumedImage && state._treeConsumedPath) {
        (state as { _treeConsumedImage: HTMLImageElement | null })._treeConsumedImage =
            AssetLoader.createImage(state._treeConsumedPath, () => {
                (state as { _treeConsumedLoaded: boolean })._treeConsumedLoaded = true;
            });
        (state as { _treeConsumedLoaded: boolean })._treeConsumedLoaded = false;
    }

    const sortedTrees = state._sortedTrees || [];
    for (const tree of sortedTrees) {
        if (tree.state === 'depleted') {
            if (state._treeConsumedLoaded && state._treeConsumedImage) {
                ctx.drawImage(state._treeConsumedImage, tree.x - 80, tree.y - 80, 160, 160);
            } else {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#3E2723';
                ctx.beginPath();
                ctx.arc(tree.x, tree.y + 10, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            continue;
        }
        if (!tree.active) continue;

        if (state._treeLoaded && state._treeImage) {
            ctx.drawImage(state._treeImage, tree.x - 80, tree.y - 80, 160, 160);
        } else {
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(tree.x - 6, tree.y + 5, 12, 20);
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - 5, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - 8, 14, 0, Math.PI * 2);
            ctx.fill();
        }
        if (tree.renderHealthBar) tree.renderHealthBar(ctx);
    }
}
