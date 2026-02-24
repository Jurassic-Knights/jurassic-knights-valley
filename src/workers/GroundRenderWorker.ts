// GroundRenderWorker.ts
// Handles CPU intense pixel manipulation for ground blending

self.onmessage = async (e: MessageEvent) => {
    const {
        jobId,
        width,
        height: _height,
        splatWeights,
        baseBuffer,
        midBuffer,
        overlayBuffer,
        // heightBuffer,
        // noiseBuffer,
        // _config,
        baseWidth,
        midWidth,
        overlayWidth,
        // heightWidth,
        // noiseWidth,
        tileSize
    } = e.data;

    try {
        const TILE_SIZE = tileSize || 128;
        const totalPixels = TILE_SIZE * TILE_SIZE;
        const outBuffer = new ArrayBuffer(totalPixels * 4);
        const out32 = new Uint32Array(outBuffer);

        const base32 = new Uint32Array(baseBuffer);
        const mid32 = new Uint32Array(midBuffer);
        const overlay32 = new Uint32Array(overlayBuffer);
        // const h32 = new Uint32Array(heightBuffer);
        // const n32 = new Uint32Array(noiseBuffer);

        const calcDim = (buf: Uint32Array, passed: number | undefined) => {
            if (passed && passed > 64) return passed;
            if (buf.length > 1024) return Math.floor(Math.sqrt(buf.length));
            return 128;
        };

        const bw = calcDim(base32, baseWidth || width);
        const mw = calcDim(mid32, midWidth || width);
        const ow = calcDim(overlay32, overlayWidth || width);
        // const _hw = calcDim(h32, heightWidth || width); // Renamed from hw
        // const _nw = calcDim(n32, noiseWidth || width); // Renamed from nw

        const mh = mw;
        const oh = ow;

        const weightData =
            typeof splatWeights === 'number'
                ? null
                : upscaleWeights(splatWeights, TILE_SIZE, TILE_SIZE);

        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const outIdx = y * TILE_SIZE + x;

                const srcX_Base = Math.floor((x / TILE_SIZE) * bw);
                const srcY_Base = Math.floor((y / TILE_SIZE) * bw);
                const baseIdx = srcY_Base * bw + srcX_Base;

                const srcX_Mid = Math.floor((x / TILE_SIZE) * mw);
                const srcY_Mid = Math.floor((y / TILE_SIZE) * mh);
                const midIdx = srcY_Mid * mw + srcX_Mid;

                const srcX_Overlay = Math.floor((x / TILE_SIZE) * ow);
                const srcY_Overlay = Math.floor((y / TILE_SIZE) * oh);
                const overlayIdx = srcY_Overlay * ow + srcX_Overlay;

                let normWeight = 0;
                if (typeof splatWeights === 'number') {
                    normWeight = splatWeights / 255.0;
                } else if (weightData) {
                    normWeight = weightData[outIdx] / 255.0;
                }

                if (normWeight <= 0.01) {
                    out32[outIdx] = base32[baseIdx];
                    continue;
                }
                if (normWeight >= 0.99) {
                    out32[outIdx] = overlay32[overlayIdx];
                    continue;
                }

                // 3-layer blend: weight 0→0.5 lerp base→mid, 0.5→1.0 lerp mid→overlay (weight alone drives visual)
                let blendVal: number;
                if (normWeight < 0.5) {
                    const t = normWeight * 2;
                    blendVal = lerp32(base32[baseIdx], mid32[midIdx], t);
                } else {
                    const t = (normWeight - 0.5) * 2;
                    blendVal = lerp32(mid32[midIdx], overlay32[overlayIdx], t);
                }
                out32[outIdx] =
                    (255 << 24) |
                    (((blendVal >> 16) & 0xff) << 16) |
                    (((blendVal >> 8) & 0xff) << 8) |
                    (blendVal & 0xff);
            }
        }

        (self as unknown as any).postMessage({ jobId, success: true, buffer: outBuffer }, [outBuffer]);
    } catch (err: unknown) {
        (self as unknown as any).postMessage({ jobId, success: false, error: (err as Error).message });
    }
};

function lerp32(a: number, b: number, t: number): number {
    const aR = a & 0xff,
        aG = (a >> 8) & 0xff,
        aB = (a >> 16) & 0xff;
    const bR = b & 0xff,
        bG = (b >> 8) & 0xff,
        bB = (b >> 16) & 0xff;
    const r = (aR + (bR - aR) * t) | 0;
    const g = (aG + (bG - aG) * t) | 0;
    const bl = (aB + (bB - aB) * t) | 0;
    return (255 << 24) | (bl << 16) | (g << 8) | r;
}

function upscaleWeights(
    weights: Uint8ClampedArray,
    width: number,
    height: number
): Uint8ClampedArray {
    // Bilinear interpolation from 6x6 grid (positions -1..4) to WxH for symmetric tile-edge blending
    const out = new Uint8ClampedArray(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Map pixel (0,0) -> grid -1, pixel (width, height) -> grid 4
            const u = -1 + (x / width) * 5;
            const v = -1 + (y / height) * 5;

            const px0 = Math.floor(u);
            const px1 = Math.min(4, px0 + 1);
            const py0 = Math.floor(v);
            const py1 = Math.min(4, py0 + 1);

            const ix0 = Math.max(0, Math.min(5, px0 + 1));
            const ix1 = Math.max(0, Math.min(5, px1 + 1));
            const iy0 = Math.max(0, Math.min(5, py0 + 1));
            const iy1 = Math.max(0, Math.min(5, py1 + 1));

            const uRatio = u - px0;
            const vRatio = v - py0;

            const w00 = weights[iy0 * 6 + ix0];
            const w10 = weights[iy0 * 6 + ix1];
            const w01 = weights[iy1 * 6 + ix0];
            const w11 = weights[iy1 * 6 + ix1];

            const wTop = w00 + (w10 - w00) * uRatio;
            const wBot = w01 + (w11 - w01) * uRatio;
            const w = wTop + (wBot - wTop) * vRatio;

            out[y * width + x] = w;
        }
    }
    return out;
}

function _clamp(value: number, min: number, max: number): number {
    // Renamed from clamp
    return Math.max(min, Math.min(max, value));
}
