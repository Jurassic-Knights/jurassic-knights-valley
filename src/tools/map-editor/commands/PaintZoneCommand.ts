import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';

interface ZoneUpdate {
    x: number;
    y: number;
    category: string;
    zoneId: string | null;
}

export class PaintZoneCommand implements EditorCommand {
    public type = 'Paint Zones';
    private previousState: ZoneUpdate[] = [];

    constructor(
        private chunkManager: ChunkManager,
        private updates: ZoneUpdate[]
    ) {
        // Capture Previous State
        this.updates.forEach(u => {
            const prevId = this.chunkManager.getZone(u.x, u.y, u.category);
            this.previousState.push({
                x: u.x,
                y: u.y,
                category: u.category,
                zoneId: prevId
            });
        });
    }

    private splatChanges: { chunkKey: string, idx: number, oldVal: number, newVal: number }[] = [];

    public async execute() {
        const changes = await this.chunkManager.setZones(this.updates);
        if (changes) {
            this.splatChanges = changes;
        }
    }

    public async undo() {
        await this.chunkManager.setZones(this.previousState);

        // REVERT PROCEDURAL BLENDING
        if (this.splatChanges.length > 0) {
            // Group by Chunk for efficiency (Reuse logic from PaintSplatCommand)
            const byChunk = new Map<string, { chunkKey: string, idx: number, oldVal: number, newVal: number }[]>();
            this.splatChanges.forEach(c => {
                if (!byChunk.has(c.chunkKey)) byChunk.set(c.chunkKey, []);
                byChunk.get(c.chunkKey)!.push(c);
            });
            await this.chunkManager.restoreSplatData(byChunk, true);
        }
    }
}
