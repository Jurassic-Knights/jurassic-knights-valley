/**
 * RailroadMeshRenderer — Renders railroad as one continuous Pixi mesh with UV-mapped tiling texture.
 *
 * One mesh per path segment; texture tiles along the spline via UVs (U = arc length / 512).
 * Used when Pixi is available (map editor).
 */

import * as PIXI from 'pixi.js';
import { buildRailroadSplineMeshData } from './Mapgen4Generator';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { AssetLoader } from '@core/AssetLoader';

const DIRT_ID = 'ground_base_gravel_grasslands_01';
const METAL_ID = 'arch_railtrack_metal_grasslands_clean';

function getTexture(id: string, repeat: boolean): PIXI.Texture | null {
    const img = AssetLoader.getImage(id);
    if (img?.complete && img.naturalWidth) {
        const tex = PIXI.Texture.from(img);
        if (repeat && tex.source?.style) tex.source.style.addressMode = 'repeat';
        return tex;
    }
    const path = AssetLoader.getImagePath(id);
    if (!path) return null;
    const tex = PIXI.Texture.from(path);
    if (repeat && tex.source?.style) tex.source.style.addressMode = 'repeat';
    return tex;
}

/**
 * Create Pixi meshes for railroad. One continuous mesh per path segment; texture tiles via UVs.
 */
export function createRailroadMeshes(
    mesh: Mesh,
    _map: Mapgen4Map,
    path: number[],
    parent: PIXI.Container
): PIXI.Mesh[] {
    const meshes: PIXI.Mesh[] = [];
    const meshData = buildRailroadSplineMeshData(mesh, path);
    if (meshData.length === 0) return meshes;

    const dirtTex = getTexture(DIRT_ID, true);
    const metalTex = getTexture(METAL_ID, true);

    for (const { positions, uvs, indices } of meshData) {
        if (dirtTex) {
            const dirtMesh = new PIXI.MeshSimple({
                texture: dirtTex,
                vertices: new Float32Array(positions),
                uvs: new Float32Array(uvs),
                indices: new Uint32Array(indices)
            });
            dirtMesh.zIndex = -1.5;
            dirtMesh.eventMode = 'none';
            parent.addChild(dirtMesh);
            meshes.push(dirtMesh);
        }

        if (metalTex) {
            const metalMesh = new PIXI.MeshSimple({
                texture: metalTex,
                vertices: new Float32Array(positions),
                uvs: new Float32Array(uvs),
                indices: new Uint32Array(indices)
            });
            metalMesh.zIndex = -1.4;
            metalMesh.eventMode = 'none';
            parent.addChild(metalMesh);
            meshes.push(metalMesh);
        }
    }

    return meshes;
}
