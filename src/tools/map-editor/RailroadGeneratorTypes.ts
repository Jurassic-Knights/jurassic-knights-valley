/**
 * RailroadGeneratorTypes — Param and crossing types for RailroadGenerator.
 */

export interface RailroadGeneratorParam {
    slopeWeight: number;
    /** Penalty for sharp turns (0 = no penalty). Higher = prefer sweeping curves. */
    turnWeight?: number;
    /** Cost multiplier when crossing rivers (>1 = prefer land). Bridges added at river crossings. */
    riverCrossingCost?: number;
    seed?: number;
}

export interface RailroadCrossing {
    r1: number;
    r2: number;
    /** When true, edge crosses a river; bridge zone painted. */
    crossesRiver?: boolean;
}
