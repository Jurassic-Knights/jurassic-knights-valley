/**
 * GameRendererViewport - Viewport and resize logic
 */
import { Logger } from './Logger';

export interface ViewportLike {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ViewportState {
    canvas: HTMLCanvasElement;
    viewport: ViewportLike;
    worldWidth: number;
    worldHeight: number;
    hero: { x: number; y: number } | null;
}

export function updateViewport(state: ViewportState): void {
    const container = state.canvas?.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const containerAspect = containerWidth / containerHeight;
    const isPortrait = containerHeight > containerWidth;

    if (isPortrait) {
        state.viewport.width = 1100;
        state.viewport.height = state.viewport.width / containerAspect;
    } else {
        state.viewport.height = 1950;
        state.viewport.width = state.viewport.height * containerAspect;
    }

    Logger.info(
        `[GameRenderer] Viewport Updated: ${Math.floor(state.viewport.width)}x${Math.floor(state.viewport.height)} (Container: ${containerWidth}x${containerHeight})`
    );
}

export function updateCamera(state: ViewportState): void {
    if (!state.hero) return;

    state.viewport.x = state.hero.x - state.viewport.width / 2;
    state.viewport.y = state.hero.y - state.viewport.height / 2;

    state.viewport.x = Math.max(
        0,
        Math.min(state.worldWidth - state.viewport.width, state.viewport.x)
    );
    state.viewport.y = Math.max(
        0,
        Math.min(state.worldHeight - state.viewport.height, state.viewport.y)
    );
}

export function resizeCanvas(state: { canvas: HTMLCanvasElement; viewport: ViewportLike }): void {
    const container = state.canvas.parentElement;
    if (!container) return;

    state.canvas.width = state.viewport.width;
    state.canvas.height = state.viewport.height;

    state.canvas.style.width = '100%';
    state.canvas.style.height = '100%';
    state.canvas.style.margin = '0';
}
