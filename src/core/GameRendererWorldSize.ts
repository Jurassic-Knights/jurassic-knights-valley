/**
 * GameRendererWorldSize - World dimension calculation
 */
import { GameConstants } from '@data/GameConstants';

const DEFAULTS = {
    MAP_PADDING: 2048,
    GRID_COLS: 3,
    GRID_ROWS: 3,
    ISLAND_SIZE: 1024,
    WATER_GAP: 256
};

export function getWorldWidth(): number {
    const gc = GameConstants?.World;
    if (gc?.TOTAL_WIDTH) return gc.TOTAL_WIDTH;
    const cfg = gc || DEFAULTS;
    return (
        cfg.MAP_PADDING * 2 +
        cfg.GRID_COLS * cfg.ISLAND_SIZE +
        (cfg.GRID_COLS - 1) * cfg.WATER_GAP
    );
}

export function getWorldHeight(): number {
    const gc = GameConstants?.World;
    if (gc?.TOTAL_HEIGHT) return gc.TOTAL_HEIGHT;
    const cfg = gc || DEFAULTS;
    return (
        cfg.MAP_PADDING * 2 +
        cfg.GRID_ROWS * cfg.ISLAND_SIZE +
        (cfg.GRID_ROWS - 1) * cfg.WATER_GAP
    );
}
