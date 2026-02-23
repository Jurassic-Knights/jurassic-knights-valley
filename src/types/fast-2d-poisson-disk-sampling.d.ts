declare module 'fast-2d-poisson-disk-sampling' {
    export default class FastPoissonDiskSampling {
        constructor(
            options: {
                shape: [number, number];
                radius: number;
                tries?: number;
            },
            rng?: () => number
        );
        addPoint(p: [number, number]): boolean;
        fill(): [number, number][];
    }
}
