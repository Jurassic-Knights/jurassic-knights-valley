export interface MapObject {
    id: string; // Asset ID
    x: number; // World X
    y: number; // World Y
}

export interface ChunkData {
    id: string; // x,y
    objects: MapObject[];
    zones?: Record<string, Record<string, string>>; // "localX,localY" -> { [Category]: zoneId }
    splatMap?: number[]; // Flattened Array (0-255) of size (ChunkSize*4)^2
}
