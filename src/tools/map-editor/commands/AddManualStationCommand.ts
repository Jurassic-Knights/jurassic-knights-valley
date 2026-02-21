import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class AddManualStationCommand implements EditorCommand {
    type = 'manual_data';

    constructor(
        private core: MapEditorCore,
        private regionId: number,
        private order: number
    ) { }

    execute(): void {
        this.core.addManualStation(this.regionId, this.order);
    }

    undo(): void {
        this.core.removeManualStation(this.regionId);
    }
}
