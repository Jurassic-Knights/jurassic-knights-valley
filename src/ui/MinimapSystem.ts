/**
 * MinimapSystem
 * Renders a miniature world map centered on the player with zoom controls.
 *
 * Features:
 * - Player-centered view for large 30k×30k world
 * - Zoom in/out with +/- buttons
 * - Shows biome colors, roads, islands, enemies
 *
 * Owner: UI Engineer
 */

import { Logger } from '@core/Logger';
import { UIManager } from './UIManager';
import { BiomeManager } from '../world/BiomeManager';
import { entityManager } from '@core/EntityManager';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { IslandManager } from '../world/IslandManager';
import type { IGame } from '../types/core.d';
import type { BiomeDef } from '../types/world';

class MinimapSystem {
    // Property declarations
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    modal: HTMLElement | null;
    isOpen: boolean;
    zoomLevel: number;
    minZoom: number;
    maxZoom: number;
    zoomStep: number;
    baseViewRadius: number;
    game: IGame | null;
    scale: number = 1;

    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.modal = null;
        this.isOpen = false;

        // Zoom settings
        this.zoomLevel = 1;
        this.minZoom = 0.25; // Show 4x area
        this.maxZoom = 4; // Show 1/4 area
        this.zoomStep = 0.5;

        // View radius at zoom 1 (how much world to show)
        this.baseViewRadius = 3000; // pixels of world radius to show
        this.game = null;

        Logger.info('[MinimapSystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;

        // Cache DOM elements
        this.modal = document.getElementById('modal-map');
        this.canvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas?.getContext('2d') || null;

        // Setup button handlers
        const btnMap = document.getElementById('btn-map');
        const btnClose = document.getElementById('btn-close-map');

        if (btnMap) {
            btnMap.addEventListener('click', () => {
                // Skip if footer is in override mode (equipment/inventory screen has taken over)
                if (btnMap.dataset.footerOverride) return;
                this.toggle();
            });
        }
        if (btnClose) {
            btnClose.addEventListener('click', () => this.close());
        }

        // Close on click outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }

        // Create zoom controls
        this.createZoomControls();

        // Register with UIManager for fullscreen exclusivity
        if (UIManager && UIManager.registerFullscreenUI) {
            UIManager.registerFullscreenUI(this);
        }

        Logger.info('[MinimapSystem] Initialized');
    }

    createZoomControls() {
        if (!this.modal) return;

        // Find or create container
        const mapContent = this.modal.querySelector('.modal-content') || this.modal;

        // Check if controls already exist
        if (mapContent.querySelector('.minimap-zoom-controls')) return;

        const controls = DOMUtils.create('div', {
            className: 'minimap-zoom-controls',
            cssText: `
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 10;
        `
        });

        const btnStyle = `
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        `;

        const btnZoomIn = DOMUtils.create('button', {
            text: '+',
            cssText: btnStyle
        });
        btnZoomIn.addEventListener('click', () => this.zoomIn());
        btnZoomIn.addEventListener(
            'mouseenter',
            () => (btnZoomIn.style.background = 'rgba(255, 255, 255, 0.4)')
        );
        btnZoomIn.addEventListener(
            'mouseleave',
            () => (btnZoomIn.style.background = 'rgba(255, 255, 255, 0.2)')
        );

        const btnZoomOut = DOMUtils.create('button', {
            text: '−',
            cssText: btnStyle
        });
        btnZoomOut.addEventListener('click', () => this.zoomOut());
        btnZoomOut.addEventListener(
            'mouseenter',
            () => (btnZoomOut.style.background = 'rgba(255, 255, 255, 0.4)')
        );
        btnZoomOut.addEventListener(
            'mouseleave',
            () => (btnZoomOut.style.background = 'rgba(255, 255, 255, 0.2)')
        );

        controls.appendChild(btnZoomIn);
        controls.appendChild(btnZoomOut);

        // Make modal content relative for absolute positioning
        if ((mapContent as HTMLElement).style.position !== 'relative') {
            (mapContent as HTMLElement).style.position = 'relative';
        }
        mapContent.appendChild(controls);
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
        this.render();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
        this.render();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.modal) return;

        // Close other fullscreen UIs first
        if (UIManager && UIManager.closeOtherFullscreenUIs) {
            UIManager.closeOtherFullscreenUIs(this);
        }

        // Hide weapon swap button
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = 'none';

        this.modal.style.display = 'flex';
        this.isOpen = true;
        this.render();
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.isOpen = false;

        // Show weapon swap button again
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = '';
    }

    /**
     * Render the minimap centered on the player
     */
    render() {
        if (!this.ctx || !this.canvas) return;

        const hero = this.game?.hero;
        const canvasSize = this.canvas.width;
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Calculate view area (world coordinates centered on hero)
        const viewRadius = this.baseViewRadius / this.zoomLevel;
        const heroX = hero?.x || 15000;
        const heroY = hero?.y || 15000;

        // Scale: canvas pixels per world pixel
        this.scale = canvasSize / (viewRadius * 2);

        // World coordinates of view bounds
        const viewLeft = heroX - viewRadius;
        const viewTop = heroY - viewRadius;

        // Convert world coord to canvas coord
        const toCanvas = (worldX: number, worldY: number) => ({
            x: (worldX - viewLeft) * this.scale,
            y: (worldY - viewTop) * this.scale
        });

        // Draw biome backgrounds as polygons
        if (BiomeManager) {
            // BiomeManager.BIOMES is typed as Record<string, BiomeDef>
            for (const biome of Object.values(BiomeManager.BIOMES)) {
                const polygon = biome.polygon;
                if (!polygon || polygon.length < 3) continue;

                // Convert polygon points to canvas coords
                const points = polygon.map((p: { x: number; y: number }) => toCanvas(p.x, p.y));

                // Draw filled polygon
                ctx.fillStyle = biome.color + '60'; // Semi-transparent
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.fill();

                // Draw polygon border
                ctx.strokeStyle = biome.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Calculate centroid for label
                let cx = 0,
                    cy = 0;
                for (const p of points) {
                    cx += p.x;
                    cy += p.y;
                }
                cx /= points.length;
                cy /= points.length;

                // Biome name at centroid (if on screen)
                if (cx > 20 && cx < canvasSize - 20 && cy > 20 && cy < canvasSize - 20) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(biome.name, cx, cy);
                }
            }

            // Draw roads as curved splines
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (const road of BiomeManager.ROADS) {
                if (!road.points || road.points.length < 4) continue;

                // Convert control points to canvas coords
                const p0 = toCanvas(road.points[0].x, road.points[0].y);
                const p1 = toCanvas(road.points[1].x, road.points[1].y);
                const p2 = toCanvas(road.points[2].x, road.points[2].y);
                const p3 = toCanvas(road.points[3].x, road.points[3].y);

                // Draw cubic Bezier curve
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
                ctx.stroke();
            }
        }

        // Draw Ironhaven islands
        // Use proper IslandManager import instead of casting game system
        if (IslandManager) {
            const islands = IslandManager.islands || [];
            for (const island of islands) {
                const pos = toCanvas(island.worldX, island.worldY);
                const w = island.width * this.scale;
                const h = island.height * this.scale;

                // Skip if not visible
                if (pos.x + w < 0 || pos.x > canvasSize || pos.y + h < 0 || pos.y > canvasSize)
                    continue;

                // Island color based on state
                if (island.type === 'home') {
                    ctx.fillStyle = '#4CAF50'; // Green for home
                } else if (island.unlocked) {
                    ctx.fillStyle = '#2196F3'; // Blue for unlocked
                } else {
                    ctx.fillStyle = '#37474F'; // Gray for locked
                }

                ctx.fillRect(pos.x, pos.y, w, h);

                // Island border
                ctx.strokeStyle = island.unlocked ? '#fff' : '#555';
                ctx.lineWidth = 1;
                ctx.strokeRect(pos.x, pos.y, w, h);
            }
        }

        // Draw enemies as red dots
        if (entityManager) {
            const enemies = entityManager.getByType('Enemy');
            ctx.fillStyle = '#F44336';
            for (const enemy of enemies) {
                if (!enemy.active || enemy.isDead) continue;
                const pos = toCanvas(enemy.x, enemy.y);
                if (pos.x < 0 || pos.x > canvasSize || pos.y < 0 || pos.y > canvasSize) continue;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw bosses
            const bosses = entityManager.getByType('Boss');
            for (const boss of bosses) {
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

        // Draw hero at center (always visible)
        if (hero) {
            const centerX = canvasSize / 2;
            const centerY = canvasSize / 2;
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 1;

            // Glow
            ctx.fillStyle = 'rgba(255, 87, 34, 0.4)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 12 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Hero marker
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

        // Draw current biome name
        if (BiomeManager && hero) {
            const biomeInfo = BiomeManager.getDebugInfo(hero.x, hero.y);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(biomeInfo, 10, 10);
        }

        // Draw zoom level
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Zoom: ${this.zoomLevel.toFixed(1)}x`, canvasSize - 10, canvasSize - 10);
    }

    /**
     * Update called each frame (for live minimap)
     */
    update(dt: number) {
        // Re-render if open to show hero movement
        if (this.isOpen) {
            this.render();
        }
    }
}

// Create singleton instance
const minimapSystemInstance = new MinimapSystem();
if (Registry) Registry.register('MinimapSystem', minimapSystemInstance);

// ES6 Module Export
export { MinimapSystem, minimapSystemInstance };
