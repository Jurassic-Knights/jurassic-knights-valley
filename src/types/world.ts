/**
 * World TypeScript Interfaces
 * 
 * Types for islands, bridges, bounds, and world geometry.
 */

// ============================================
// GEOMETRY PRIMITIVES
// ============================================

/**
 * Rectangular bounds
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 2D point
 */
export interface Point {
    x: number;
    y: number;
}

// ============================================
// BIOME TYPES
// ============================================

export interface BiomeDef {
    id: string;
    name: string;
    description: string;
    color: string;
    tier: number;
    polygon: Point[];
}

export interface RoadDef {
    id: string;
    tier: number;
    name: string;
    points: Point[];
    width: number;
}


import { ISystem } from './core';

export interface IWorldManager extends ISystem {
    getHeroSpawnPosition(): { x: number; y: number };
}
