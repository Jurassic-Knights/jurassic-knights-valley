import { EditorCommand } from './EditorCommand';
import { ChunkManager } from '../ChunkManager';

interface ObjectAction {
    type: 'add' | 'remove';
    x: number;
    y: number;
    assetId: string;
}

export class BatchObjectCommand implements EditorCommand {
    public type = 'Batch Object Action';

    constructor(
        private chunkManager: ChunkManager,
        private actions: ObjectAction[]
    ) { }

    public execute() {
        this.actions.forEach(action => {
            if (action.type === 'add') {
                this.chunkManager.addObject(action.x, action.y, action.assetId);
            } else {
                this.chunkManager.removeObjectAt(action.x, action.y);
            }
        });
    }

    public undo() {
        // Reverse order for undo
        for (let i = this.actions.length - 1; i >= 0; i--) {
            const action = this.actions[i];
            if (action.type === 'add') {
                this.chunkManager.removeObjectAt(action.x, action.y);
            } else {
                this.chunkManager.addObject(action.x, action.y, action.assetId);
            }
        }
    }
}
