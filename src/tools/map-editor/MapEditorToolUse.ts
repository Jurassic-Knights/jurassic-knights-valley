/**
 * MapEditorToolUse - Tool execution logic (ground, object, zone)
 */
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { ZoneCategory } from '@data/ZoneConfig';
import { PaintZoneCommand } from './commands/PaintZoneCommand';
import type { ChunkManager } from './ChunkManager';
import type { CommandManager } from './commands/CommandManager';
import type { SplatChange } from './commands/PaintSplatCommand';

export interface ToolUseState {
    currentTool: string;
    editingMode: 'object' | 'zone' | 'ground';
    brushSize: number;
    selectedAsset: { id: string; category: string } | null;
    selectedZoneId: string | null;
    activeZoneCategory: ZoneCategory;
}

export interface ToolUseCallbacks {
    onSplatChanges: (changes: SplatChange[]) => void;
    onObjectAction: (action: { type: 'add' | 'remove'; x: number; y: number; assetId: string }) => void;
}

export function executeTool(
    worldX: number,
    worldY: number,
    e: MouseEvent,
    state: ToolUseState,
    chunkManager: ChunkManager,
    commandManager: CommandManager,
    currentObjectActions: Array<{ type: 'add' | 'remove'; x: number; y: number; assetId: string }>,
    callbacks: ToolUseCallbacks
): void {
    const { TILE_SIZE } = MapEditorConfig;

    if (state.currentTool === 'brush' && state.editingMode === 'ground') {
        const intensity = e.shiftKey ? -50 : 50;
        const radius = (state.brushSize || 1) * 4;

        chunkManager.paintSplat(worldX, worldY, radius, intensity).then((changes) => {
            if (changes?.length) callbacks.onSplatChanges(changes);
        });
        return;
    }

    if (
        state.currentTool === 'brush' &&
        state.editingMode === 'object' &&
        state.selectedAsset
    ) {
        const actionType = e.shiftKey ? 'remove' : 'add';

        const existing = currentObjectActions.find(
            (a) =>
                Math.abs(a.x - worldX) < 1 &&
                Math.abs(a.y - worldY) < 1 &&
                a.type === actionType
        );

        if (!existing) {
            if (actionType === 'add') {
                chunkManager.addObject(worldX, worldY, state.selectedAsset.id);
            } else {
                chunkManager.removeObjectAt(worldX, worldY);
            }
            callbacks.onObjectAction({
                type: actionType,
                x: worldX,
                y: worldY,
                assetId: state.selectedAsset.id
            });
        }
        return;
    }

    if (
        state.currentTool === 'brush' &&
        state.editingMode === 'zone' &&
        state.selectedZoneId
    ) {
        const centerTileX = Math.floor(worldX / TILE_SIZE);
        const centerTileY = Math.floor(worldY / TILE_SIZE);
        const radius = state.brushSize - 1;
        const updates: Array<{ x: number; y: number; category: string; zoneId: string | null }> = [];

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (x * x + y * y <= radius * radius + 0.5) {
                    const tx = centerTileX + x;
                    const ty = centerTileY + y;
                    const px = tx * TILE_SIZE + TILE_SIZE / 2;
                    const py = ty * TILE_SIZE + TILE_SIZE / 2;
                    updates.push({
                        x: px,
                        y: py,
                        category: state.activeZoneCategory,
                        zoneId: e.shiftKey ? null : state.selectedZoneId
                    });
                }
            }
        }

        if (updates.length > 0) {
            const cmd = new PaintZoneCommand(chunkManager, updates);
            commandManager.execute(cmd);
        }
    }
}
