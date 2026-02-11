declare module 'delaunator' {
    export default class Delaunator {
        constructor(coords: Float64Array | number[]);
        static from(
            points: unknown[],
            getX?: (p: unknown) => number,
            getY?: (p: unknown) => number
        ): Delaunator;
        triangles: Uint32Array;
        halfedges: Int32Array;
    }
}
