/**
 * EnvironmentRendererLighting – Day/night lighting keyframes and shadow updates.
 */
export interface LightingKeyframe {
    time: number;
    color: { r: number; g: number; b: number };
    alpha: number;
}

export const LIGHTING_SCHEDULE: LightingKeyframe[] = [
    { time: 0.0, color: { r: 10, g: 10, b: 35 }, alpha: 0.85 },
    { time: 0.05, color: { r: 10, g: 10, b: 35 }, alpha: 0.7 },
    { time: 0.1, color: { r: 255, g: 100, b: 50 }, alpha: 0.3 },
    { time: 0.15, color: { r: 255, g: 255, b: 255 }, alpha: 0.0 },
    { time: 0.7, color: { r: 255, g: 255, b: 255 }, alpha: 0.0 },
    { time: 0.75, color: { r: 180, g: 100, b: 200 }, alpha: 0.25 },
    { time: 0.85, color: { r: 100, g: 50, b: 150 }, alpha: 0.5 },
    { time: 0.9, color: { r: 10, g: 10, b: 35 }, alpha: 0.75 },
    { time: 1.0, color: { r: 10, g: 10, b: 35 }, alpha: 0.85 }
];

export function computeLighting(dayTime: number): { ambientColor: string; overlayAlpha: number } {
    const schedule = LIGHTING_SCHEDULE;
    let k1 = schedule[0];
    let k2 = schedule[schedule.length - 1];

    for (let i = 0; i < schedule.length - 1; i++) {
        if (dayTime >= schedule[i].time && dayTime < schedule[i + 1].time) {
            k1 = schedule[i];
            k2 = schedule[i + 1];
            break;
        }
    }

    const duration = k2.time - k1.time;
    const progress = duration > 0 ? (dayTime - k1.time) / duration : 0;

    const r = Math.floor(k1.color.r + (k2.color.r - k1.color.r) * progress);
    const g = Math.floor(k1.color.g + (k2.color.g - k1.color.g) * progress);
    const b = Math.floor(k1.color.b + (k2.color.b - k1.color.b) * progress);
    const a = k1.alpha + (k2.alpha - k1.alpha) * progress;

    return { ambientColor: `rgba(${r}, ${g}, ${b}, ${a})`, overlayAlpha: a };
}

export function computeShadows(dayTime: number): { shadowScaleY: number; shadowAlpha: number; shadowSkew: number } {
    const distFromNoon = Math.abs(dayTime - 0.5);
    const t = distFromNoon * 2;

    const minScale = 0.1;
    const maxScale = 0.35;
    const shadowScaleY = minScale + (maxScale - minScale) * t;

    const maxAlpha = 0.3;
    const minAlpha = 0.2;
    const shadowAlpha = maxAlpha - (maxAlpha - minAlpha) * t;

    const skewStrength = 1.5;
    const shadowSkew = Math.sin(dayTime * Math.PI * 2) * skewStrength;

    return { shadowScaleY, shadowAlpha, shadowSkew };
}
