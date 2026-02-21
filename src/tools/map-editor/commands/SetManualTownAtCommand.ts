import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class SetManualTownAtCommand implements EditorCommand {
    type = 'manual_data';
    private previousRegionId: number | null = null;

    constructor(
        private core: MapEditorCore,
        private index: number,
        private newRegionId: number
    ) { }

    execute(): void {
        const towns = this.core.getManualTowns();
        if (this.index >= 0 && this.index < towns.length) {
            this.previousRegionId = towns[this.index]!;
        }

        this.core.setManualTownAt(this.index, this.newRegionId);
    }

    undo(): void {
        if (this.previousRegionId !== null) {
            this.core.setManualTownAt(this.index, this.previousRegionId);
        }
    }

    mergeWith(next: EditorCommand): boolean {
        if (next instanceof SetManualTownAtCommand && next.index === this.index) {
            this.newRegionId = next.newRegionId;
            return true;
        }
        return false;
    }
}
