/**
 * HomeOutpostRenderer - Home base / rest area visual
 *
 * Extracted from GameRenderer.js for modularity.
 * Draws the animated safe zone indicator.
 *
 * Owner: Rendering System
 */

import { getConfig } from '@data/GameConfig';
import type { IGame } from '../types/core';

const HomeOutpostRenderer = {
    /**
     * Draw home outpost at center of home island
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} worldWidth
     * @param {number} worldHeight
     * @param {Object} game - Game reference
     */
    draw(ctx: CanvasRenderingContext2D, worldWidth: number, worldHeight: number, game: IGame) {
        let centerX = worldWidth / 2;
        let centerY = worldHeight / 2;

        // Use IslandManager if available
        const islandManager = game ? game.getSystem('IslandManager') : null;
        if (islandManager) {
            const home = islandManager.getHomeIsland();
            if (home) {
                centerX = home.worldX + home.width / 2;
                centerY = home.worldY + home.height / 2;
            }
        }

        const radius = getConfig().Interaction.REST_AREA_RADIUS;

        // Outer glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.fill();

        // Base circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.fill();

        // Animated border (marching ants)
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 6;
        ctx.setLineDash([40, 20]);
        ctx.lineDashOffset = -(performance.now() / 15);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REST AREA', centerX, centerY);
    }
};

export { HomeOutpostRenderer };
