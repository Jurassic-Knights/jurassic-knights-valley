import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class RemoveWaypointCommand implements EditorCommand {
    type = 'spline';
    private previousRegionId: number | null = null;

    constructor(
        private core: MapEditorCore,
        private legIndex: number,
        private waypointIndex: number
    ) { }

    execute(): void {
        const waypoints = this.core.getRailroadWaypoints().filter(w => w.legIndex === this.legIndex);
        if (this.waypointIndex >= 0 && this.waypointIndex < waypoints.length) {
            this.previousRegionId = waypoints[this.waypointIndex]!.regionId;
        }

        this.core.removeWaypoint(this.legIndex, this.waypointIndex);
    }

    undo(): void {
        if (this.previousRegionId !== null) {
            this.core.addWaypoint(this.legIndex, this.previousRegionId, this.waypointIndex);
        }
    }
}
