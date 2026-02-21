/**
 * MapEditorState
 *
 * Holds mutable editing state for the Map Editor.
 * Editing mode, tool state, brush state, selection, and manual railroad data.
 * Pure data container; no PIXI or DOM.
 */
import type { MapObject } from './MapEditorTypes';
import { ZoneCategory } from '@data/ZoneConfig';
import type { ManualStation, RailroadWaypointEntry } from '../../world/MapDataService';

export type EditingMode = 'object' | 'manipulation';
export type CurrentTool = 'brush' | 'eraser' | 'select';
export type ObjectAction = { type: 'add' | 'remove'; x: number; y: number; assetId: string };

export class MapEditorState {
    isInitialized = false;
    currentTool: CurrentTool = 'brush';
    currentLayer = 0;

    editingMode: EditingMode = 'object';
    brushSize = 1;
    hiddenZoneIds = new Set<string>();

    selectedAsset: { id: string; category: string } | null = null;
    selectedObject: MapObject | null = null;

    currentObjectActions: ObjectAction[] = [];

    debugShowStationNumbers = false;
    debugShowSplinePath = false;

    manualTowns: number[] = [];
    manualStations: ManualStation[] = [];
    railroadWaypoints: RailroadWaypointEntry[] = [];
}
