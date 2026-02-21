/**
 * MapEditorToolUse - Tool execution logic (ground, object, zone)
 */
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { PlaceObjectCommand } from './commands/PlaceObjectCommand';
import { RemoveObjectCommand } from './commands/RemoveObjectCommand';
import type { ChunkManager } from './ChunkManager';
import type { CommandManager } from './commands/CommandManager';

export interface ToolUseState {
    currentTool: string;
    editingMode: 'object' | 'zone' | 'ground' | 'manipulation';
    brushSize: number;
    selectedAsset: { id: string; category: string } | null;
}

export interface ToolUseCallbacks {
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
            let cmd;
            if (actionType === 'add') {
                cmd = new PlaceObjectCommand(chunkManager, worldX, worldY, state.selectedAsset.id);
            } else {
                // If removing, we need to know what asset was there to undo properly
                const obj = chunkManager.getObjectAt(worldX, worldY);
                if (obj) {
                    cmd = new RemoveObjectCommand(chunkManager, worldX, worldY, obj.id);
                } else {
                    return; // Nothing to remove
                }
            }

            commandManager.execute(cmd);

            callbacks.onObjectAction({
                type: actionType,
                x: worldX,
                y: worldY,
                assetId: state.selectedAsset.id
            });
        }
    }
}
