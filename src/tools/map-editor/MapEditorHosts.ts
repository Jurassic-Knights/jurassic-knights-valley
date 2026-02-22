import type * as PIXI from 'pixi.js';
import type { ProceduralCache } from './MapEditorProceduralRenderer';
import type { MapEditorCore } from './MapEditorCore';
import type { ManualStation, RailroadWaypointEntry } from '../../world/MapDataService';
import type { EditingMode } from './MapEditorState';

import { RemoveWaypointCommand } from './commands/RemoveWaypointCommand';
import { UpdateWaypointRegionCommand } from './commands/UpdateWaypointRegionCommand';
import { SetManualTownAtCommand } from './commands/SetManualTownAtCommand';
import { SetManualStationRegionCommand } from './commands/SetManualStationRegionCommand';

export function getDebugOverlayHost(
    core: MapEditorCore,
    props: {
        procCache: ProceduralCache | null;
        worldContainer: PIXI.Container | null;
        app: PIXI.Application | null;
        zoom: number;
        debugShowStationNumbers: boolean;
        debugShowSplinePath: boolean;
    }
) {
    return {
        procCache: props.procCache,
        worldContainer: props.worldContainer,
        app: props.app,
        zoom: props.zoom,
        debugShowStationNumbers: props.debugShowStationNumbers,
        debugShowSplinePath: props.debugShowSplinePath
    };
}

export function getWaypointManagerHost(
    core: MapEditorCore,
    props: {
        procCache: ProceduralCache | null;
        worldContainer: PIXI.Container | null;
        app: PIXI.Application | null;
        zoom: number;
        manualStations: ManualStation[];
        railroadWaypoints: RailroadWaypointEntry[];
        editingMode: EditingMode;
        debugShowStationNumbers: boolean;
        debugShowSplinePath: boolean;
    }
) {
    return {
        procCache: props.procCache,
        worldContainer: props.worldContainer,
        app: props.app,
        zoom: props.zoom,
        manualStations: props.manualStations,
        railroadWaypoints: props.railroadWaypoints,
        editingMode: props.editingMode,
        debugShowStationNumbers: props.debugShowStationNumbers,
        debugShowSplinePath: props.debugShowSplinePath,
        _onRemoveWaypoint: (leg: number, idx: number) =>
            core.executeCommand(new RemoveWaypointCommand(core, leg, idx)),
        _onUpdateWaypointRegion: (leg: number, idx: number, regionId: number) =>
            core.executeCommand(new UpdateWaypointRegionCommand(core, leg, idx, regionId)),
        _getRegionAtWorld: (wx: number, wy: number) => core.getRegionAtWorld(wx, wy)
    };
}

export function getManipulationHandlesHost(
    core: MapEditorCore,
    props: {
        procCache: ProceduralCache | null;
        worldContainer: PIXI.Container | null;
        app: PIXI.Application | null;
        zoom: number;
        manualTowns: number[];
        manualStations: ManualStation[];
        editingMode: EditingMode;
    }
) {
    return {
        procCache: props.procCache,
        worldContainer: props.worldContainer,
        app: props.app,
        zoom: props.zoom,
        manualTowns: props.manualTowns,
        manualStations: props.manualStations,
        editingMode: props.editingMode,
        onSetTownAt: (idx: number, regionId: number) => {
            core.executeCommand(new SetManualTownAtCommand(core, idx, regionId));
            const param = core.getMapgen4Param();
            if (param) void core.setProceduralPreview(param);
        },
        onSetStationRegion: (idx: number, regionId: number) => {
            core.executeCommand(new SetManualStationRegionCommand(core, idx, regionId));
            const param = core.getMapgen4Param();
            if (param) void core.setProceduralPreview(param);
        },
        getRegionAtWorld: (wx: number, wy: number) => core.getRegionAtWorld(wx, wy)
    };
}
