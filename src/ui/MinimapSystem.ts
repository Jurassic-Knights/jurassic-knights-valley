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
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import type { IGame } from '../types/core.d';
import { renderMinimap } from './MinimapRenderer';

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
        this.zoomStep = GameConstants.UI.MINIMAP_ZOOM_STEP;

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

        if (EventBus && GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.UI_FULLSCREEN_OPENED, { source: this });
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

    render() {
        if (!this.ctx || !this.canvas) return;
        const hero = this.game?.hero;
        const canvasSize = this.canvas.width;
        const viewRadius = this.baseViewRadius / this.zoomLevel;
        const heroX = hero?.x || 15000;
        const heroY = hero?.y || 15000;
        this.scale = canvasSize / (viewRadius * 2);
        const viewLeft = heroX - viewRadius;
        const viewTop = heroY - viewRadius;
        renderMinimap(this.ctx, canvasSize, this.scale, viewLeft, viewTop, hero ?? null, this.zoomLevel);
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
