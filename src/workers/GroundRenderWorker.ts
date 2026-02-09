
// GroundRenderWorker.ts
// Handles CPU intense pixel manipulation for ground blending

self.onmessage = async (e: MessageEvent) => {
    const {
        jobId,
        width, // Legacy/Fallback
        height,
        splatWeights, // Uint8ClampedArray (16 values or single number)
        baseBuffer,   // ArrayBuffer (RGBA)
        overlayBuffer,// ArrayBuffer (RGBA)
        heightBuffer, // ArrayBuffer (RGBA)
        noiseBuffer,  // ArrayBuffer (RGBA)
        config,        // { thresholdBias, noiseScale }
        // New Dimensions
        baseWidth,
        overlayWidth,
        heightWidth,
        noiseWidth,
        tileSize // New Dynamic Tile Size
    } = e.data;

    try {
        // Initialize Output Buffer
        const TILE_SIZE = tileSize || 128; // Default to 128 (GameConstants)
        const totalPixels = TILE_SIZE * TILE_SIZE;
        // Verify buffer size matches if reusing? For now assume new buffer returned every time
        const outBuffer = new ArrayBuffer(totalPixels * 4);
        const out32 = new Uint32Array(outBuffer);

        const base32 = new Uint32Array(baseBuffer);
        const overlay32 = new Uint32Array(overlayBuffer);
        const h32 = new Uint32Array(heightBuffer);
        const n32 = new Uint32Array(noiseBuffer);

        // Resolve Dimensions (Robust Check)
        // If passed width is small (32) but buffer is huge, use buffer size.
        const calcDim = (buf: Uint32Array, passed: number | undefined) => {
            if (passed && passed > 64) return passed; // Trust explicit large values
            if (buf.length > 1024) return Math.floor(Math.sqrt(buf.length)); // Trust buffer size
            return 128; // Fallback to 128
        };

        const bw = calcDim(base32, baseWidth || width);
        const ow = calcDim(overlay32, overlayWidth || width);
        const hw = calcDim(h32, heightWidth || width);
        const nw = calcDim(n32, noiseWidth || width);

        // Assume squares
        const bh = bw;
        const oh = ow;
        const hh = hw;
        const nh = nw;

        const tileX = e.data.tileX || 0;
        const tileY = e.data.tileY || 0;
        const worldX = tileX * TILE_SIZE;
        const worldY = tileY * TILE_SIZE;

        // Parse Splat Weights... (Assume 4x4 input)
        const weightData = (typeof splatWeights === 'number') ? null : upscaleWeights(splatWeights, TILE_SIZE, TILE_SIZE);

        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const outIdx = y * TILE_SIZE + x;

                // Local UV Mapping (Downscale to Fit Tile) - Nearest Neighbor

                const srcX_Base = Math.floor((x / TILE_SIZE) * bw);
                const srcY_Base = Math.floor((y / TILE_SIZE) * bh);
                const baseIdx = srcY_Base * bw + srcX_Base;

                const srcX_Overlay = Math.floor((x / TILE_SIZE) * ow);
                const srcY_Overlay = Math.floor((y / TILE_SIZE) * oh);
                const overlayIdx = srcY_Overlay * ow + srcX_Overlay;

                const srcX_Height = Math.floor((x / TILE_SIZE) * hw);
                const srcY_Height = Math.floor((y / TILE_SIZE) * hh);
                const hIdx = srcY_Height * hw + srcX_Height;

                // Use World Space for Noise to ensure seamless tiling across boundaries
                const globalX = worldX + x;
                const globalY = worldY + y;

                // Wrap texture coordinates (Repeat)
                const srcX_Noise = Math.floor(globalX % nw);
                const srcY_Noise = Math.floor(globalY % nh);
                const nIdx = srcY_Noise * nw + srcX_Noise;

                // Extract Height 
                const hVal = (h32[hIdx] & 0xFF) / 255.0;
                // Noise usually samples differently (often full scale), but let's sync for now
                const nVal = ((n32[nIdx] & 0xFF) / 255.0) * config.noiseScale;
                const effHeight = hVal + (nVal - (config.noiseScale * 0.5));

                let normWeight = 0;
                if (typeof splatWeights === 'number') {
                    normWeight = splatWeights / 255.0;
                } else if (weightData) {
                    normWeight = weightData[outIdx] / 255.0;
                }

                // Strict Zero Check to prevent "Ghost Overlay" on unpainted tiles
                if (normWeight <= 0.01) {
                    out32[outIdx] = base32[baseIdx];
                    continue; // Skip blending math
                }
                // Strict One Check
                if (normWeight >= 0.99) {
                    out32[outIdx] = overlay32[overlayIdx];
                    continue;
                }

                // --- Variable Depth Blend Algorithm ---
                // "Variable Height Mix"
                // 1. Get Base Properties
                // hVal = Height from HeightMap (0.0 to 1.0)
                // nVal = Noise Value (0.0 to 1.0)
                // config.thresholdBias = Global Depth Contrast (e.g. 0.15)

                // 2. Modulate Softness via Noise
                // This makes the blending "tight" in some spots (cracks) and "loose" in others
                // Base softness + (Noise * Variation)
                // We want softness to be roughly 0.01 to 0.3 range.
                const baseSoftness = config.thresholdBias;
                const noiseInfluence = (nVal - 0.5) * config.noiseScale; // +/- variance
                const softness = Math.max(0.01, baseSoftness + noiseInfluence);

                // 3. Modulate Transition Point
                // We want the noise to also shift *where* the transition happens, effectively warping the weight.
                // effectiveWeight = weight + (Noise * Scale)
                const noisyWeight = clamp(normWeight + ((nVal - 0.5) * config.noiseScale * 2.0), 0, 1);

                // 4. Depth Comparison
                // Does the overlay height (assumed uniform "top layer") exceed base height?
                // Actually with a single height map, we assume height map = Base Height structure.
                // Overlay is "filling" it. 
                // So Overlay appears when (Weight > Height).

                // standard depth blend: alpha = smoothstep(height - softness, height + softness, weight)
                // Here we use the noisy weight vs the physical height.

                const edge0 = hVal - softness;
                const edge1 = hVal + softness;

                // Smoothstep
                const xVal = (noisyWeight - edge0) / (edge1 - edge0);
                const t = xVal < 0 ? 0 : (xVal > 1 ? 1 : xVal * xVal * (3 - 2 * xVal));

                let alpha = t;

                // Preserve full opacity at high weights regardless of height (force cover)
                // If Splat Weight > 0.9, we force alpha to 1.0 to ensure top of mountains get covered.
                if (normWeight > 0.95) alpha = 1.0;

                // Standard Alpha Blend: Out = Base * (1-a) + Overlay * a
                // Using Uint32 makes byte access tricky (Little Endian: AABBGGRR)
                // Let's unpack RGBA

                const baseVal = base32[baseIdx];
                const overVal = overlay32[overlayIdx];

                const bR = (baseVal) & 0xFF;
                const bG = (baseVal >> 8) & 0xFF;
                const bB = (baseVal >> 16) & 0xFF;
                // const bA = (baseVal >> 24) & 0xFF; // Unused

                const oR = (overVal) & 0xFF;
                const oG = (overVal >> 8) & 0xFF;
                const oB = (overVal >> 16) & 0xFF;
                const oA = (overVal >> 24) & 0xFF;

                // Mix colors with respect to Source Alpha (Decal Blending)
                const sAlpha = oA / 255.0;
                const netAlpha = alpha * sAlpha;

                const r = (bR * (1 - netAlpha)) + (oR * netAlpha);
                const g = (bG * (1 - netAlpha)) + (oG * netAlpha);
                const b = (bB * (1 - netAlpha)) + (oB * netAlpha);
                const a = 255; // Output tile itself is always opaque substrate

                // Repack Uint32 (AABBGGRR)
                out32[outIdx] = (a << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
            }
        }

        self.postMessage({ jobId, success: true, buffer: outBuffer }, [outBuffer]);

    } catch (err: unknown) {
        self.postMessage({ jobId, success: false, error: err.message });
    }
};

function upscaleWeights(weights: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    // Bilinear Interpolation from 5x5 -> WxH for seamless tiling
    // We expect 25 weights (5x5 grid)
    const out = new Uint8ClampedArray(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Map 0..Width to 0..4 (Grid Space)
            // Note: We want pixel 0 to be exactly index 0
            // and pixel Width (theoretical) to be index 4.
            const u = (x / width) * 4;
            const v = (y / height) * 4;

            const x0 = Math.floor(u);
            const x1 = Math.min(4, x0 + 1); // Clamp to 4
            const y0 = Math.floor(v);
            const y1 = Math.min(4, y0 + 1);

            const uRatio = u - x0;
            const vRatio = v - y0;

            const w00 = weights[y0 * 5 + x0];
            const w10 = weights[y0 * 5 + x1];
            const w01 = weights[y1 * 5 + x0];
            const w11 = weights[y1 * 5 + x1];

            const wTop = w00 + (w10 - w00) * uRatio;
            const wBot = w01 + (w11 - w01) * uRatio;
            const w = wTop + (wBot - wTop) * vRatio;

            out[y * width + x] = w;
        }
    }
    return out;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
