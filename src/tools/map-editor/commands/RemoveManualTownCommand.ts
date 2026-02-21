import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class RemoveManualTownCommand implements EditorCommand {
    type = 'manual_data';

    constructor(
        private core: MapEditorCore,
        private regionId: number
    ) { }

    execute(): void {
        this.core.removeManualTown(this.regionId);
    }

    undo(): void {
        this.core.addManualTown(this.regionId);
    }
}
