import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';

/** Command to place an object at a world position. Supports undo by removing at same position. */
export class PlaceObjectCommand implements EditorCommand {
    public type = 'Place Object';

    constructor(
        private chunkManager: ChunkManager,
        private x: number,
        private y: number,
        private assetId: string
        // Optionally store UUID if we need to remove EXACT object
        // But ChunkManager.addObject doesn't return ID currently.
        // We'll trust coordinate based removal or update ChunkManager to return ID.
    ) { }

    public execute() {
        this.chunkManager.addObject(this.x, this.y, this.assetId);
    }

    public undo() {
        // Need a removeObject method in ChunkManager that takes x,y (or exact ID)
        // Currently ChunkManager might only have removeObjectById?
        // Let's assume we remove topmost object at x,y
        this.chunkManager.removeObjectAt(this.x, this.y);
    }
}
