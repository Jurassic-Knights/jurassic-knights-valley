import { EditorCommand } from './EditorCommand';
import type { MapEditorCore } from '../MapEditorCore';

export class UpdateWaypointRegionCommand implements EditorCommand {
    type = 'spline';
    private previousRegionId: number | null = null;

    constructor(
        private core: MapEditorCore,
        private legIndex: number,
        private waypointIndex: number,
        private newRegionId: number
    ) { }

    execute(): void {
        const waypoints = this.core.getRailroadWaypoints().filter(w => w.legIndex === this.legIndex);
        if (this.waypointIndex >= 0 && this.waypointIndex < waypoints.length) {
            this.previousRegionId = waypoints[this.waypointIndex]!.regionId;
        }

        this.core.updateWaypointRegion(this.legIndex, this.waypointIndex, this.newRegionId);
    }

    undo(): void {
        if (this.previousRegionId !== null) {
            this.core.updateWaypointRegion(this.legIndex, this.waypointIndex, this.previousRegionId);
        }
    }

    mergeWith(next: EditorCommand): boolean {
        if (next instanceof UpdateWaypointRegionCommand &&
            next.legIndex === this.legIndex &&
            next.waypointIndex === this.waypointIndex) {
            // Keep our original previousRegionId (start of drag), but adopt their newRegionId (end of drag)
            this.newRegionId = next.newRegionId;
            return true;
        }
        return false;
    }
}
