import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class AddWaypointCommand implements EditorCommand {
    type = 'spline';

    constructor(
        private core: MapEditorCore,
        private legIndex: number,
        private regionId: number,
        private insertIndex?: number
    ) { }

    execute(): void {
        this.core.addWaypoint(this.legIndex, this.regionId, this.insertIndex);
    }

    undo(): void {
        const waypoints = this.core.getRailroadWaypoints().filter(w => w.legIndex === this.legIndex);

        let targetIndex = waypoints.length - 1; // Default to last if appended
        if (this.insertIndex !== undefined && this.insertIndex < waypoints.length) {
            targetIndex = this.insertIndex;
        }

        this.core.removeWaypoint(this.legIndex, targetIndex);
    }
}
