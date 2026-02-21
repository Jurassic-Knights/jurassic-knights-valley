import { EditorCommand } from './EditorCommand';
import type { ChunkManager } from '../ChunkManager';

export class SetHeroSpawnCommand implements EditorCommand {
    type = 'hero_spawn';
    private previousPosition: { x: number; y: number } | null = null;

    constructor(
        private chunkManager: ChunkManager,
        private x: number,
        private y: number
    ) { }

    execute(): void {
        const prev = this.chunkManager.getHeroSpawn();
        if (prev) {
            this.previousPosition = { x: prev.x, y: prev.y };
        }

        this.chunkManager.setHeroSpawn(this.x, this.y);
    }

    undo(): void {
        if (this.previousPosition !== null) {
            this.chunkManager.setHeroSpawn(this.previousPosition.x, this.previousPosition.y);
        } else {
            // Need a way to clear the spawn if it didn't exist before?
            // ChunkManager doesn't seem to have a clearHeroSpawn method, but setting it to null if supported.
            // Assuming for now that hero spawn always exists or can be bypassed.
        }
    }
}
