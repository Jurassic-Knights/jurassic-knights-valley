/**
 * IslandManagerGrid - Grid coordinate utilities
 */
import { GameConstants } from '@data/GameConstants';

export function worldToGrid(x: number, y: number): { gx: number; gy: number } {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        gx: Math.floor(x / cellSize),
        gy: Math.floor(y / cellSize)
    };
}

export function gridToWorld(gx: number, gy: number): { x: number; y: number } {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        x: gx * cellSize + cellSize / 2,
        y: gy * cellSize + cellSize / 2
    };
}

export function snapToGrid(x: number, y: number): { x: number; y: number } {
    const grid = worldToGrid(x, y);
    return gridToWorld(grid.gx, grid.gy);
}

export function getGridCellBounds(
    gx: number,
    gy: number
): { x: number; y: number; width: number; height: number } {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        x: gx * cellSize,
        y: gy * cellSize,
        width: cellSize,
        height: cellSize
    };
}
