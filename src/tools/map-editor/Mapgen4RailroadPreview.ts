/**
 * Mapgen4RailroadPreview — Draw railroad to canvas for preview.
 * One continuous strip polygon per layer; textured via clip + drawImage along the path.
 */

import { AssetLoader } from '@core/AssetLoader';
import { positionToBiome } from './Mapgen4BiomeConfig';
import { buildCellRegions, findRegionAt } from './Mapgen4RegionUtils';
import {
    RAILROAD_TILE_MESH,
    buildRailroadSplineSamples,
    type RailroadSplineSample
} from './RailroadSplineBuilder';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import type { RailroadCrossing } from './Mapgen4Param';

export function drawRailroadSpline(
    ctx: CanvasRenderingContext2D,
    mesh: Mesh,
    map: Mapgen4Map,
    path: number[],
    crossings: RailroadCrossing[],
    meshSeed: number,
    toCanvas: (x: number, y: number) => { x: number; y: number },
    scale: number,
    tileWidthCanvas: number,
    vpMinX: number,
    vpMaxX: number,
    vpMinY: number,
    vpMaxY: number,
    railroadStationIds?: number[]
): void {
    if (path.length < 2) return;

    const samples = buildRailroadSplineSamples(mesh, path, railroadStationIds);
    if (samples.length < 2) return;

    const cellRegions = buildCellRegions(mesh);
    const getBiome = (x: number, y: number) => {
        const r = findRegionAt(mesh, x, y, cellRegions);
        const elev = map.elevation_r[r] ?? 0;
        return positionToBiome(x, y, meshSeed, elev);
    };

    const getDirtId = (biome: string) => `ground_base_gravel_${biome}_01`;
    const getMetalId = (biome: string) => `arch_railtrack_metal_${biome}_clean`;

    const halfW = RAILROAD_TILE_MESH / 2;

    const dirtImg = AssetLoader.getImage(getDirtId('grasslands'));
    const hasTextures = !!(dirtImg?.complete && dirtImg.naturalWidth);

    // Always draw brown base first so railroad is visible even when textures are loading
    const { left, right } = _buildStripEdges(samples, halfW, 1);
    _drawBaseRailroadLayer(ctx, left, right, toCanvas);

    if (hasTextures) {
        if (hasTextures) {
            _drawTexturedStrip(ctx, left, right, samples, (cumLen) => {
                const idx = samples.findIndex((s) => s.cumLen >= cumLen);
                const s = samples[Math.min(idx >= 0 ? idx : samples.length - 1, samples.length - 1)];
                return AssetLoader.getImage(getDirtId(getBiome(s.x, s.y)));
            }, RAILROAD_TILE_MESH, tileWidthCanvas, scale, toCanvas);

            _drawTexturedStrip(ctx, left, right, samples, (cumLen) => {
                const idx = samples.findIndex((s) => s.cumLen >= cumLen);
                const s = samples[Math.min(idx >= 0 ? idx : samples.length - 1, samples.length - 1)];
                return AssetLoader.getImage(getMetalId(getBiome(s.x, s.y)));
            }, RAILROAD_TILE_MESH, tileWidthCanvas, scale, toCanvas);
        }

        _drawCrossings(ctx, crossings, mesh, toCanvas);
    }

    function _drawTexturedStrip(
        ctx: CanvasRenderingContext2D,
        left: { x: number; y: number }[],
        right: { x: number; y: number }[],
        samples: any[],
        getImg: (cumLen: number) => HTMLImageElement | null,
        tileLenMesh: number,
        wCanvas: number,
        scale: number,
        toCanvas: (x: number, y: number) => { x: number; y: number }
    ) {
        let cumLen = 0;
        for (let i = 0; i < samples.length - 1; i++) {
            const segLen = samples[i + 1].cumLen - samples[i].cumLen;
            const tileCount = Math.max(1, Math.ceil(segLen / tileLenMesh));

            for (let k = 0; k < tileCount; k++) {
                const t0 = k / tileCount;
                const t1 = (k + 1) / tileCount;
                const left0 = {
                    x: left[i]!.x + t0 * (left[i + 1]!.x - left[i]!.x),
                    y: left[i]!.y + t0 * (left[i + 1]!.y - left[i]!.y)
                };
                const right0 = {
                    x: right[i]!.x + t0 * (right[i + 1]!.x - right[i]!.x),
                    y: right[i]!.y + t0 * (right[i + 1]!.y - right[i]!.y)
                };
                const right1 = {
                    x: right[i]!.x + t1 * (right[i + 1]!.x - right[i]!.x),
                    y: right[i]!.y + t1 * (right[i + 1]!.y - right[i]!.y)
                };
                const left1 = {
                    x: left[i]!.x + t1 * (left[i + 1]!.x - left[i]!.x),
                    y: left[i]!.y + t1 * (left[i + 1]!.y - left[i]!.y)
                };

                const img = getImg(cumLen);
                if (!img?.complete || !img.naturalWidth) {
                    cumLen += segLen / tileCount;
                    continue;
                }

                const tileLenMeshActual = segLen / tileCount;
                const lenCanvas = tileLenMeshActual * scale;
                const midX = (left0.x + right0.x + left1.x + right1.x) / 4;
                const midY = (left0.y + right0.y + left1.y + right1.y) / 4;
                const angle = Math.atan2(
                    (left1.y + right1.y) / 2 - (left0.y + right0.y) / 2,
                    (left1.x + right1.x) / 2 - (left0.x + right0.x) / 2
                );

                ctx.save();
                ctx.beginPath();
                const overlap = 0.05;
                const ot0 = Math.max(0, t0 - overlap);
                const ot1 = Math.min(1, t1 + overlap);

                const ol0 = {
                    x: left[i]!.x + ot0 * (left[i + 1]!.x - left[i]!.x),
                    y: left[i]!.y + ot0 * (left[i + 1]!.y - left[i]!.y)
                };
                const or0 = {
                    x: right[i]!.x + ot0 * (right[i + 1]!.x - right[i]!.x),
                    y: right[i]!.y + ot0 * (right[i + 1]!.y - right[i]!.y)
                };
                const or1 = {
                    x: right[i]!.x + ot1 * (right[i + 1]!.x - right[i]!.x),
                    y: right[i]!.y + ot1 * (right[i + 1]!.y - right[i]!.y)
                };
                const ol1 = {
                    x: left[i]!.x + ot1 * (left[i + 1]!.x - left[i]!.x),
                    y: left[i]!.y + ot1 * (left[i + 1]!.y - left[i]!.y)
                };

                const l0 = toCanvas(ol0.x, ol0.y);
                ctx.moveTo(l0.x, l0.y);
                ctx.lineTo(toCanvas(or0.x, or0.y).x, toCanvas(or0.x, or0.y).y);
                ctx.lineTo(toCanvas(or1.x, or1.y).x, toCanvas(or1.x, or1.y).y);
                ctx.lineTo(toCanvas(ol1.x, ol1.y).x, toCanvas(ol1.x, ol1.y).y);
                ctx.closePath();
                ctx.clip();

                const midCanvas = toCanvas(midX, midY);
                ctx.translate(midCanvas.x, midCanvas.y);
                ctx.rotate(angle);
                ctx.drawImage(img, 0, 0, img.width, img.height, -lenCanvas / 2, -wCanvas / 2, lenCanvas, wCanvas);
                ctx.restore();

                cumLen += tileLenMeshActual;
            }
        }
    }
}

function _drawCrossings(
    ctx: CanvasRenderingContext2D,
    crossings: RailroadCrossing[],
    mesh: Mesh,
    toCanvas: (x: number, y: number) => { x: number; y: number }
) {
    for (const cross of crossings) {
        const x = (mesh.x_of_r(cross.r1) + mesh.x_of_r(cross.r2)) / 2;
        const y = (mesh.y_of_r(cross.r1) + mesh.y_of_r(cross.r2)) / 2;
        const c = toCanvas(x, y);
        if (cross.crossesRiver) {
            ctx.fillStyle = '#6b8e9e';
            ctx.strokeStyle = '#4a6b7a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function _buildStripEdges(samples: RailroadSplineSample[], halfW: number, widthFactor: number) {
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];
    for (const s of samples) {
        const px = Math.cos(s.angle + Math.PI / 2) * halfW * widthFactor;
        const py = Math.sin(s.angle + Math.PI / 2) * halfW * widthFactor;
        left.push({ x: s.x - px, y: s.y - py });
        right.push({ x: s.x + px, y: s.y + py });
    }
    return { left, right };
}

function _drawBaseRailroadLayer(
    ctx: CanvasRenderingContext2D,
    left: { x: number; y: number }[],
    right: { x: number; y: number }[],
    toCanvas: (x: number, y: number) => { x: number; y: number }
) {
    ctx.beginPath();
    const l0 = toCanvas(left[0]!.x, left[0]!.y);
    ctx.moveTo(l0.x, l0.y);
    for (let i = 1; i < left.length; i++) {
        const c = toCanvas(left[i]!.x, left[i]!.y);
        ctx.lineTo(c.x, c.y);
    }
    for (let i = right.length - 1; i >= 0; i--) {
        const c = toCanvas(right[i]!.x, right[i]!.y);
        ctx.lineTo(c.x, c.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#5c4033';
    ctx.fill();
}
