/**
 * IslandManagerBridges - Bridge geometry and queries
 */
import type { Bridge } from '../types/world';

export interface BridgeConfig {
    gridCols: number;
    gridRows: number;
    cellSize: number;
    islandSize: number;
    waterGap: number;
    bridgeWidth: number;
    mapPadding: number;
    ironhavenOffsetX: number;
    ironhavenOffsetY: number;
}

export function getBridges(config: BridgeConfig): Bridge[] {
    const bridges: Bridge[] = [];
    const {
        gridCols,
        gridRows,
        cellSize,
        islandSize,
        waterGap,
        bridgeWidth,
        mapPadding,
        ironhavenOffsetX,
        ironhavenOffsetY
    } = config;
    const halfBridge = bridgeWidth / 2;
    const islandCenter = islandSize / 2;
    const overlap = 25;

    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            const baseX = ironhavenOffsetX + mapPadding + col * cellSize;
            const baseY = ironhavenOffsetY + mapPadding + row * cellSize;

            if (col < gridCols - 1) {
                bridges.push({
                    x: baseX + islandSize - overlap,
                    y: baseY + islandCenter - halfBridge,
                    width: waterGap + overlap * 2,
                    height: bridgeWidth,
                    type: 'horizontal',
                    from: { col, row },
                    to: { col: col + 1, row }
                });
            }

            if (row < gridRows - 1) {
                bridges.push({
                    x: baseX + islandCenter - halfBridge,
                    y: baseY + islandSize - overlap,
                    width: bridgeWidth,
                    height: waterGap + overlap * 2,
                    type: 'vertical',
                    from: { col, row },
                    to: { col, row: row + 1 }
                });
            }
        }
    }

    return bridges;
}

export function isOnBridge(x: number, y: number, bridges: Bridge[]): boolean {
    const marginPct = 0.15;

    for (const bridge of bridges) {
        let bx = bridge.x;
        let by = bridge.y;
        let bw = bridge.width;
        let bh = bridge.height;

        if (bridge.type === 'horizontal') {
            const margin = bh * marginPct;
            by += margin;
            bh -= margin * 2;
        } else {
            const margin = bw * marginPct;
            bx += margin;
            bw -= margin * 2;
        }

        if (x >= bx && x < bx + bw && y >= by && y < by + bh) {
            return true;
        }
    }
    return false;
}

export function getBridgeAt(x: number, y: number, bridges: Bridge[]): Bridge | null {
    for (const bridge of bridges) {
        if (
            x >= bridge.x &&
            x < bridge.x + bridge.width &&
            y >= bridge.y &&
            y < bridge.y + bridge.height
        ) {
            return bridge;
        }
    }
    return null;
}
