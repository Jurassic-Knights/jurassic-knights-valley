import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { GroundSystem } from './GroundSystem';
import { ObjectSystem } from './ObjectSystem';
import { ZoneSystem } from './ZoneSystem';
import { ChunkData, MapObject, HeroSpawnPosition } from './MapEditorTypes';
import { serialize, deserializeInto } from './ChunkManagerSerialization';
import { updateChunkViewport } from './ChunkManagerViewport';
import {
    loadChunk as loadChunkFn,
    loadChunkSync as loadChunkSyncFn,
    unloadChunk as unloadChunkFn,
    renderPlaceholderGround,
    getDebugGraphics,
    type ChunkLoaderContext
} from './ChunkManagerLoader';
import { createHeroSpawnMarker, updateHeroSpawnMarker, updateHeroSpawnMarkerScale } from './ChunkManagerHeroSpawn';
import { getAllObjects, getObjectAt, addObject, removeObjectAt, type AddObjectContext, type RemoveObjectContext } from './ChunkManagerObjects';
import {
    paintSplat as paintSplatFn,
    updateGroundTile as updateGroundTileFn,
    restoreSplatData as restoreSplatDataFn,
    setZone as setZoneFn,
    setZones as setZonesFn,
    getZone as getZoneFn,
    refreshZones as refreshZonesFn,
    type GroundContext,
    type ZoneContext
} from './ChunkManagerDelegation';

/** Manages map chunk lifecycle; dynamic load/unload based on viewport visibility. */
export class ChunkManager {
    private container: PIXI.Container;
    private loadedChunks: Map<string, PIXI.Container>;
    private loadingChunks: Set<string>;
    private pool: PIXI.Container[];
    private worldData: Map<string, ChunkData>;
    private heroSpawn: HeroSpawnPosition | null = null;

    // Sub-Systems
    private groundSystem: GroundSystem;
    private objectSystem: ObjectSystem;
    private zoneSystem: ZoneSystem;

    private heroSpawnMarker: PIXI.Container | null = null;

    constructor(parentContainer: PIXI.Container) {
        this.container = new PIXI.Container();
        parentContainer.addChild(this.container);

        this.heroSpawnMarker = createHeroSpawnMarker();
        this.container.addChild(this.heroSpawnMarker);

        this.loadedChunks = new Map();
        this.loadingChunks = new Set<string>();
        this.pool = [];
        this.worldData = new Map();
        this.groundSystem = new GroundSystem();
        this.objectSystem = new ObjectSystem();
        this.zoneSystem = new ZoneSystem(this.groundSystem);
    }

    private gridOpacity: number = 0.5;

    private onMapEdit: ((type: string, payload: unknown) => void) | null = null;
    private _skipEditCallback = false;

    /** Set callback for real-time sync to game (MAP_OBJECT_ADD, REMOVE, MOVE). */
    public setOnMapEdit(fn: ((type: string, payload: unknown) => void) | null): void {
        this.onMapEdit = fn;
    }

    private updateHeroSpawnMarker(): void {
        updateHeroSpawnMarker(this.heroSpawnMarker, this.heroSpawn);
    }

    public getHeroSpawn(): HeroSpawnPosition | null {
        return this.heroSpawn;
    }

    public setHeroSpawn(x: number, y: number): void {
        this.heroSpawn = { x, y };
        this.updateHeroSpawnMarker();
        this.onMapEdit?.('MAP_HERO_SPAWN', { x, y });
    }

    public setGridOpacity(opacity: number) {
        this.gridOpacity = opacity;
        this.loadedChunks.forEach((chunk) => {
            const g = getDebugGraphics(chunk);
            if (g) g.alpha = opacity;
        });
    }

    private getGroundContext(): GroundContext {
        return { groundSystem: this.groundSystem, worldData: this.worldData, loadedChunks: this.loadedChunks };
    }

    private getZoneContext(): ZoneContext {
        return { zoneSystem: this.zoneSystem, worldData: this.worldData, loadedChunks: this.loadedChunks };
    }

    private getLoaderContext(): ChunkLoaderContext {
        return {
            worldData: this.worldData,
            loadedChunks: this.loadedChunks,
            pool: this.pool,
            container: this.container,
            groundSystem: this.groundSystem,
            objectSystem: this.objectSystem,
            zoneSystem: this.zoneSystem,
            gridOpacity: this.gridOpacity
        };
    }

    public async renderProceduralGround(chunk: PIXI.Container, chunkX: number, chunkY: number) {
        if (MapEditorConfig.USE_PLACEHOLDER_GROUND) {
            renderPlaceholderGround(chunk, chunkX, chunkY, this.worldData);
            return;
        }
        const chunkKey = `${chunkX},${chunkY}`;
        const data = this.worldData.get(chunkKey);
        if (data) {
            await this.groundSystem.renderChunk(chunk, data, chunkX, chunkY, this.worldData);
        }
    }

    public async paintSplat(worldX: number, worldY: number, radius: number, intensity: number, soft = true) {
        return paintSplatFn(this.getGroundContext(), worldX, worldY, radius, intensity, soft);
    }

    public async updateGroundTile(chunkKey: string, lx: number, ly: number) {
        return updateGroundTileFn(this.getGroundContext(), chunkKey, lx, ly);
    }

    public async restoreSplatData(
        changes: Map<string, { idx: number; oldVal: number; newVal: number }[]>,
        undo: boolean
    ) {
        return restoreSplatDataFn(this.getGroundContext(), changes, undo);
    }

    /** Adds an object to the world at specific coordinates. */
    public addObject(x: number, y: number, assetId: string): void {
        const ctx: AddObjectContext = {
            worldData: this.worldData,
            loadedChunks: this.loadedChunks,
            loadingChunks: this.loadingChunks,
            container: this.container,
            objectSystem: this.objectSystem,
            loadChunkSync: (k, ax, ay) => this.loadChunkSync(k, ax, ay),
            loadChunk: (k, ax, ay) => this.loadChunk(k, ax, ay),
            onMapEdit: this.onMapEdit,
            skipEditCallback: this._skipEditCallback
        };
        addObject(ctx, x, y, assetId);
    }

    /** Removes an object at specific world coordinates. */
    public removeObjectAt(x: number, y: number): void {
        const ctx: RemoveObjectContext = {
            worldData: this.worldData,
            loadedChunks: this.loadedChunks,
            objectSystem: this.objectSystem,
            getObjectAt: (ax, ay) => getObjectAt(this.worldData, ax, ay),
            onMapEdit: this.onMapEdit,
            skipEditCallback: this._skipEditCallback
        };
        removeObjectAt(ctx, x, y);
    }

    public setZone(x: number, y: number, category: string, zoneId: string | null): void {
        setZoneFn(this.getZoneContext(), x, y, category, zoneId);
    }

    public async setZones(updates: { x: number; y: number; category: string; zoneId: string | null }[]) {
        return setZonesFn(this.getZoneContext(), updates);
    }

    public getZone(x: number, y: number, category: string): string | null {
        return getZoneFn(this.getZoneContext(), x, y, category);
    }

    /** Read-only access to world chunk data (e.g. for minimap). */
    public getWorldData(): Map<string, ChunkData> {
        return this.worldData;
    }

    /** Re-render object sprites in all loaded chunks (e.g. when entity display size changes via dashboard) */
    public refreshObjectSprites(): void {
        for (const [key, chunk] of this.loadedChunks) {
            const data = this.worldData.get(key);
            if (!data?.objects?.length) continue;

            const [chunkX, chunkY] = key.split(',').map(Number);
            this.objectSystem.refreshChunkObjects(chunk, data, chunkX, chunkY);
        }
    }

    /** Returns all objects from all chunks. */
    public getAllObjects(): MapObject[] {
        return getAllObjects(this.worldData);
    }

    /** Returns the object at the given world position, or null if none. */
    public getObjectAt(x: number, y: number): MapObject | null {
        return getObjectAt(this.worldData, x, y);
    }

    /**
     * Moves an object from old position to new position.
     * Returns true if the move succeeded.
     */
    public moveObject(oldX: number, oldY: number, newX: number, newY: number): boolean {
        const obj = this.getObjectAt(oldX, oldY);
        if (!obj) return false;
        this._skipEditCallback = true;
        this.removeObjectAt(oldX, oldY);
        this.addObject(newX, newY, obj.id);
        this._skipEditCallback = false;
        this.onMapEdit?.('MAP_OBJECT_MOVE', {
            id: obj.id,
            oldX,
            oldY,
            newX,
            newY
        });
        return true;
    }

    /**
     * Update observable chunks based on viewport.
     * @param viewRect The visible area in WORLD coordinates
     */
    public update(
        viewRect: { x: number; y: number; width: number; height: number },
        zoom: number
    ): void {
        if (this.worldData.size === 0 && !MapEditorConfig.USE_POLYGON_MAP_AS_GROUND) {
            const keysToUnload = Array.from(this.loadedChunks.keys());
            keysToUnload.forEach((k) => unloadChunkFn(this.getLoaderContext(), k));
            this.loadingChunks.clear();
            this.container.visible = false;
            return;
        }
        this.container.visible = true;
        updateHeroSpawnMarkerScale(this.heroSpawnMarker, zoom);

        const ctx = this.getLoaderContext();
        updateChunkViewport(
            {
                ...ctx,
                loadingChunks: this.loadingChunks,
                loadChunk: (key, x, y) => loadChunkFn(ctx, key, x, y),
                unloadChunk: (key) => unloadChunkFn(ctx, key),
                getDebugGraphics
            },
            viewRect,
            zoom
        );
    }

    private loadChunkSync(key: string, x: number, y: number): void {
        loadChunkSyncFn(this.getLoaderContext(), key, x, y);
    }

    private async loadChunk(key: string, x: number, y: number): Promise<void> {
        await loadChunkFn(this.getLoaderContext(), key, x, y);
    }

    public refreshZones(): void {
        refreshZonesFn(this.getZoneContext());
    }

    public serialize(): { version: number; chunks: ChunkData[]; heroSpawn?: HeroSpawnPosition } {
        return serialize(this.worldData, this.heroSpawn);
    }

    /** Load map data from a serialized payload. Clears current world and repopulates. */
    public deserialize(data: { version?: number; chunks?: ChunkData[]; heroSpawn?: HeroSpawnPosition }): void {
        deserializeInto(data, {
            worldData: this.worldData,
            loadingChunks: this.loadingChunks,
            groundSystem: this.groundSystem,
            zoneSystem: this.zoneSystem,
            setHeroSpawn: (hs) => {
                this.heroSpawn = hs;
                this.updateHeroSpawnMarker();
            },
            unloadAll: () => {
                const loaderCtx = this.getLoaderContext();
                Array.from(this.loadedChunks.keys()).forEach((k) => unloadChunkFn(loaderCtx, k));
            }
        });
    }
}
