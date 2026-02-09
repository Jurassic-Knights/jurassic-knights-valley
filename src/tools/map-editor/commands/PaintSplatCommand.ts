import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';
import { EditorContext } from '../EditorContext';

export interface SplatChange {
    chunkKey: string;
    idx: number;
    oldVal: number;
    newVal: number;
}

export class PaintSplatCommand implements EditorCommand {
    public type = 'Paint Ground';

    constructor(
        private chunkManager: ChunkManager,
        private changes: SplatChange[]
    ) { }

    public execute() {
        // Already executed during painting!
        // Re-execute only if Redo
        this.applyChanges(false);
    }

    public undo() {
        this.applyChanges(true);
    }

    private async applyChanges(undo: boolean) {
        // Group by Chunk for efficiency
        const byChunk = new Map<string, SplatChange[]>();
        this.changes.forEach(c => {
            if (!byChunk.has(c.chunkKey)) byChunk.set(c.chunkKey, []);
            byChunk.get(c.chunkKey)!.push(c);
        });

        const worldData = (this.chunkManager as { worldData?: unknown }).worldData;
        // We need access to worldData to apply changes. 
        // ChunkManager doesn't expose `setSplatData`. 
        // Ideally we assume ChunkManager has a way to update splat data.
        // Let's rely on GroundSystem via ChunkManager if possible.
        // Or adding `updateSplatData` to ChunkManager.

        // For now, let's assume we can access via a new method in ChunkManager.

        await this.chunkManager.restoreSplatData(byChunk, undo);
    }
}
