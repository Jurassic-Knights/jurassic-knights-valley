/**
 * DebugOverlays - Debug visualization overlays for development
 *
 * Extracted from GameRenderer.js for modularity.
 * Handles debug grid, collision blocks, and world boundary rendering.
 *
 * Owner: Development Tools
 */

import { GameConstants, getConfig } from '@data/GameConstants';
import { IGame, IViewport } from '@app-types/core';

const DebugOverlays = {
    /**
     * Draw world boundary indicator
     */
    drawWorldBoundary(ctx: CanvasRenderingContext2D, viewport: IViewport, worldWidth: number, worldHeight: number, game: IGame) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);

        // Draw world border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, worldWidth, worldHeight);

        // DEBUG: Show Collision Blocks (Red)
        const islandManager = game ? game.getSystem('WorldManager') as typeof import('../world/WorldManager').WorldManager : null;
        if (islandManager && islandManager.collisionBlocks) {
            ctx.strokeStyle = '#FF0000';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;

            for (const block of islandManager.collisionBlocks) {
                ctx.beginPath();
                ctx.rect(block.x, block.y, block.width, block.height);
                ctx.fill();
                ctx.stroke();
            }

            // Draw debug grid
            const bounds = {
                left: viewport.x,
                top: viewport.y,
                right: viewport.x + viewport.width,
                bottom: viewport.y + viewport.height
            };
            this.drawDebugGrid(ctx, bounds);
        }

        ctx.restore();
    },

    /**
     * Draw 128px gameplay grid overlay (debug only)
     */
    drawDebugGrid(ctx: CanvasRenderingContext2D, bounds: { left: number; top: number; right: number; bottom: number }) {
        const cellSize = GameConstants ? GameConstants.Grid.CELL_SIZE : 128;

        const startGx = Math.floor(bounds.left / cellSize);
        const startGy = Math.floor(bounds.top / cellSize);
        const endGx = Math.ceil(bounds.right / cellSize);
        const endGy = Math.ceil(bounds.bottom / cellSize);

        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';

        // Vertical lines
        for (let gx = startGx; gx <= endGx; gx++) {
            const x = gx * cellSize;
            ctx.beginPath();
            ctx.moveTo(x, bounds.top);
            ctx.lineTo(x, bounds.bottom);
            ctx.stroke();
        }

        // Horizontal lines
        for (let gy = startGy; gy <= endGy; gy++) {
            const y = gy * cellSize;
            ctx.beginPath();
            ctx.moveTo(bounds.left, y);
            ctx.lineTo(bounds.right, y);
            ctx.stroke();
        }

        // Cell labels
        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let gx = startGx; gx <= endGx; gx++) {
            for (let gy = startGy; gy <= endGy; gy++) {
                const centerX = gx * cellSize + cellSize / 2;
                const centerY = gy * cellSize + cellSize / 2;
                ctx.fillText(`X${gx}`, centerX, centerY - 20);
                ctx.fillText(`Y${gy}`, centerX, centerY + 20);
            }
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
};

export { DebugOverlays };
