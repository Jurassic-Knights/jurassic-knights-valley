import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class SetManualStationRegionCommand implements EditorCommand {
    type = 'manual_data';
    private previousRegionId: number | null = null;

    constructor(
        private core: MapEditorCore,
        private index: number,
        private newRegionId: number
    ) { }

    execute(): void {
        const stations = this.core.getManualStations();
        if (this.index >= 0 && this.index < stations.length) {
            this.previousRegionId = stations[this.index]!.regionId;
        }

        this.core.setManualStationRegion(this.index, this.newRegionId);
    }

    undo(): void {
        if (this.previousRegionId !== null) {
            this.core.setManualStationRegion(this.index, this.previousRegionId);
        }
    }

    mergeWith(next: EditorCommand): boolean {
        if (next instanceof SetManualStationRegionCommand && next.index === this.index) {
            this.newRegionId = next.newRegionId;
            return true;
        }
        return false;
    }
}
