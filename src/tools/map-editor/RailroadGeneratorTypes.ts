/**
 * RailroadGeneratorTypes — Shared types for railroad generation.
 */

export interface RailroadCrossing {
    r1: number;
    r2: number;
    /** When true, edge crosses a river; bridge zone painted. */
    crossesRiver?: boolean;
}
