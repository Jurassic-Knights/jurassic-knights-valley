/*
 * From https://www.redblobgames.com/x/2312-dual-mesh/
 * Copyright 2017, 2023 Red Blob Games
 * License: Apache v2.0
 */

export type Point = [number, number];

export type Delaunator = {
    triangles: Int32Array;
    halfedges: Int32Array;
};

export type MeshInitializer = {
    points: Point[];
    delaunator: Delaunator;
    numBoundaryPoints?: number;
    numSolidSides?: number;
};

export class TriangleMesh {
    static t_from_s(s: number): number {
        return (s / 3) | 0;
    }
    static s_prev_s(s: number): number {
        return s % 3 === 0 ? s + 2 : s - 1;
    }
    static s_next_s(s: number): number {
        return s % 3 === 2 ? s - 2 : s + 1;
    }

    numSides!: number;
    numSolidSides!: number;
    numRegions!: number;
    numSolidRegions!: number;
    numTriangles!: number;
    numSolidTriangles!: number;
    numBoundaryRegions!: number;

    _halfedges!: Int32Array;
    _triangles!: Int32Array;
    _s_of_r!: Int32Array;
    _vertex_t!: Array<[number, number]>;
    _vertex_r!: Array<[number, number]>;

    constructor(init: MeshInitializer | TriangleMesh) {
        if ('points' in init) {
            this.numBoundaryRegions = init.numBoundaryPoints ?? 0;
            this.numSolidSides = init.numSolidSides ?? 0;
            this._vertex_t = [];
            this.update(init);
        } else {
            Object.assign(this, init);
        }
    }

    update(init: MeshInitializer): void {
        this._vertex_r = init.points;
        this._triangles = init.delaunator.triangles;
        this._halfedges = init.delaunator.halfedges;
        this._update();
    }

    _update(): void {
        const { _triangles, _halfedges, _vertex_r } = this;
        let _vertex_t = this._vertex_t;

        this.numSides = _triangles.length;
        this.numRegions = _vertex_r.length;
        this.numSolidRegions = this.numRegions - 1;
        this.numTriangles = this.numSides / 3;
        this.numSolidTriangles = this.numSolidSides / 3;

        if (_vertex_t.length < this.numTriangles) {
            const numOldTriangles = _vertex_t.length;
            const numNewTriangles = this.numTriangles - numOldTriangles;
            _vertex_t = _vertex_t.concat(
                Array.from({ length: numNewTriangles }, () => [0, 0] as [number, number])
            );
            this._vertex_t = _vertex_t;
        }

        this._s_of_r = new Int32Array(this.numRegions);
        for (let s = 0; s < _triangles.length; s++) {
            const endpoint = _triangles[TriangleMesh.s_next_s(s)];
            if (this._s_of_r[endpoint] === 0 || _halfedges[s] === -1) {
                this._s_of_r[endpoint] = s;
            }
        }

        for (let s = 0; s < _triangles.length; s += 3) {
            const t = s / 3;
            const a = _vertex_r[_triangles[s]];
            const b = _vertex_r[_triangles[s + 1]];
            const c = _vertex_r[_triangles[s + 2]];
            if (this.is_ghost_s(s)) {
                const dx = b[0] - a[0];
                const dy = b[1] - a[1];
                const scale = 10 / Math.sqrt(dx * dx + dy * dy);
                this._vertex_t[t][0] = 0.5 * (a[0] + b[0]) + dy * scale;
                this._vertex_t[t][1] = 0.5 * (a[1] + b[1]) - dx * scale;
            } else {
                this._vertex_t[t][0] = (a[0] + b[0] + c[0]) / 3;
                this._vertex_t[t][1] = (a[1] + b[1] + c[1]) / 3;
            }
        }
    }

    static addGhostStructure(init: MeshInitializer): MeshInitializer {
        const { triangles, halfedges } = init.delaunator;
        const numSolidSides = triangles.length;

        let numUnpairedSides = 0;
        let firstUnpairedEdge = -1;
        const s_unpaired_r: number[] = [];
        for (let s = 0; s < numSolidSides; s++) {
            if (halfedges[s] === -1) {
                numUnpairedSides++;
                s_unpaired_r[triangles[s]] = s;
                firstUnpairedEdge = s;
            }
        }

        const r_ghost = init.points.length;
        const newpoints = init.points.concat([[NaN, NaN]]);
        const r_newstart_s = new Int32Array(numSolidSides + 3 * numUnpairedSides);
        r_newstart_s.set(triangles);
        const s_newopposite_s = new Int32Array(numSolidSides + 3 * numUnpairedSides);
        s_newopposite_s.set(halfedges);

        for (
            let i = 0, s = firstUnpairedEdge;
            i < numUnpairedSides;
            i++, s = s_unpaired_r[r_newstart_s[TriangleMesh.s_next_s(s)]]
        ) {
            const s_ghost = numSolidSides + 3 * i;
            s_newopposite_s[s] = s_ghost;
            s_newopposite_s[s_ghost] = s;
            r_newstart_s[s_ghost] = r_newstart_s[TriangleMesh.s_next_s(s)];
            r_newstart_s[s_ghost + 1] = r_newstart_s[s];
            r_newstart_s[s_ghost + 2] = r_ghost;
            const k = numSolidSides + ((3 * i + 4) % (3 * numUnpairedSides));
            s_newopposite_s[s_ghost + 2] = k;
            s_newopposite_s[k] = s_ghost + 2;
        }

        return {
            numSolidSides,
            numBoundaryPoints: init.numBoundaryPoints,
            points: newpoints,
            delaunator: { triangles: r_newstart_s, halfedges: s_newopposite_s }
        };
    }

    x_of_r(r: number): number {
        return this._vertex_r[r][0];
    }
    y_of_r(r: number): number {
        return this._vertex_r[r][1];
    }
    x_of_t(t: number): number {
        return this._vertex_t[t][0];
    }
    y_of_t(t: number): number {
        return this._vertex_t[t][1];
    }
    r_begin_s(s: number): number {
        return this._triangles[s];
    }
    r_end_s(s: number): number {
        return this._triangles[TriangleMesh.s_next_s(s)];
    }
    t_inner_s(s: number): number {
        return TriangleMesh.t_from_s(s);
    }
    t_outer_s(s: number): number {
        return TriangleMesh.t_from_s(this._halfedges[s]);
    }
    s_next_s(s: number): number {
        return TriangleMesh.s_next_s(s);
    }
    s_prev_s(s: number): number {
        return TriangleMesh.s_prev_s(s);
    }
    s_opposite_s(s: number): number {
        return this._halfedges[s];
    }
    r_around_t(t: number, r_out: number[] = []): number[] {
        r_out.length = 3;
        for (let i = 0; i < 3; i++) r_out[i] = this._triangles[3 * t + i];
        return r_out;
    }
    s_around_r(r: number, s_out: number[] = []): number[] {
        const s0 = this._s_of_r[r];
        let incoming = s0;
        s_out.length = 0;
        do {
            s_out.push(this._halfedges[incoming]);
            const outgoing = TriangleMesh.s_next_s(incoming);
            incoming = this._halfedges[outgoing];
        } while (incoming !== -1 && incoming !== s0);
        return s_out;
    }
    r_around_r(r: number, r_out: number[] = []): number[] {
        const s0 = this._s_of_r[r];
        let incoming = s0;
        r_out.length = 0;
        do {
            r_out.push(this.r_begin_s(incoming));
            const outgoing = TriangleMesh.s_next_s(incoming);
            incoming = this._halfedges[outgoing];
        } while (incoming !== -1 && incoming !== s0);
        return r_out;
    }
    t_around_r(r: number, t_out: number[] = []): number[] {
        const s0 = this._s_of_r[r];
        let incoming = s0;
        t_out.length = 0;
        do {
            t_out.push(TriangleMesh.t_from_s(incoming));
            const outgoing = TriangleMesh.s_next_s(incoming);
            incoming = this._halfedges[outgoing];
        } while (incoming !== -1 && incoming !== s0);
        return t_out;
    }
    r_ghost(): number {
        return this.numRegions - 1;
    }
    is_ghost_s(s: number): boolean {
        return s >= this.numSolidSides;
    }
    is_ghost_r(r: number): boolean {
        return r === this.numRegions - 1;
    }
    is_ghost_t(t: number): boolean {
        return this.is_ghost_s(3 * t);
    }
    is_boundary_s(s: number): boolean {
        return this.is_ghost_s(s) && s % 3 === 0;
    }
    is_boundary_r(r: number): boolean {
        return r < this.numBoundaryRegions;
    }
}
