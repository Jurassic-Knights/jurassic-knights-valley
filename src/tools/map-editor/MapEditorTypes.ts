export interface MapObject {
    id: string; // Asset ID
    x: number; // World X
    y: number; // World Y
}

/** Map-level hero spawn position. Stored in serialized payload alongside chunks. */
export interface HeroSpawnPosition {
    x: number;
    y: number;
}

export interface ChunkData {
    id: string; // x,y
    objects: MapObject[];
    zones?: Record<string, Record<string, string>>; // "localX,localY" -> { [Category]: zoneId }
    splatMap?: number[]; // Flattened Array (0-255) of size (ChunkSize*4)^2
}

/** Dashboard -> Editor initialization payload. Replaces generic 'any' casting. */
export interface MapEditorDataPayload {
    version?: number;
    chunks: ChunkData[];
    heroSpawn?: HeroSpawnPosition;
    mapgen4Param?: unknown; // Defined fully in Mapgen4Generator, but kept generic here to avoid circular dependencies if needed
    manualTowns?: number[];
    manualStations?: Array<{ regionId: number; name?: string; order: number }>;
    railroadWaypoints?: Array<{ legIndex: number; regionId: number }>;
}
