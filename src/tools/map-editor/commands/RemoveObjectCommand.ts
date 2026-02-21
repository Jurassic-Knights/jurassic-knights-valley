import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';

/** Command to remove an object at a world position. Undo restores it. */
export class RemoveObjectCommand implements EditorCommand {
    public type = 'Remove Object';

    constructor(
        private chunkManager: ChunkManager,
        private x: number,
        private y: number,
        private assetId: string // Needed to re-add it on Undo
    ) { }

    public execute() {
        this.chunkManager.removeObjectAt(this.x, this.y);
    }

    public undo() {
        this.chunkManager.addObject(this.x, this.y, this.assetId);
    }
}
