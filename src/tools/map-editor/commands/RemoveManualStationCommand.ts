import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class RemoveManualStationCommand implements EditorCommand {
    type = 'manual_data';
    private previousOrder: number | null = null;

    constructor(
        private core: MapEditorCore,
        private regionId: number
    ) { }

    execute(): void {
        const station = this.core.getManualStations().find(s => s.regionId === this.regionId);
        if (station) {
            this.previousOrder = station.order;
        }
        this.core.removeManualStation(this.regionId);
    }

    undo(): void {
        if (this.previousOrder !== null) {
            this.core.addManualStation(this.regionId, this.previousOrder);
        }
    }
}
