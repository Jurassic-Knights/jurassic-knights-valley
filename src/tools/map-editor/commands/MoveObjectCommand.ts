import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';

export class MoveObjectCommand implements EditorCommand {
    public type = 'Move Object';

    constructor(
        private chunkManager: ChunkManager,
        private oldX: number,
        private oldY: number,
        private newX: number,
        private newY: number,
        private assetId: string
    ) {}

    public execute(): void {
        this.chunkManager.moveObject(this.oldX, this.oldY, this.newX, this.newY);
    }

    public undo(): void {
        this.chunkManager.moveObject(this.newX, this.newY, this.oldX, this.oldY);
    }
}
