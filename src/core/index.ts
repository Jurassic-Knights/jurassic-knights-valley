/**
 * Core Module Index (Barrel Export)
 * 
 * This file provides ES6 module exports for the core layer.
 * 
 * Usage:
 *   import { Logger, EventBus, Registry } from '@core';
 */

// Core utilities
export { Logger } from './Logger';
export { Registry } from './Registry';
export { EventBus } from './EventBus';
export { Component } from './Component';
export type { IEntity } from './Component';

// Asset management
export { AssetLoader } from './AssetLoader';
export { SpriteLoader } from './SpriteLoader';

// Game core
export { Entity } from './Entity';
export { entityManager, EntityManagerService } from './EntityManager';
export { GameState, State } from './State';
export { GameRenderer } from './GameRenderer';

// Utilities
export { Quadtree } from './Quadtree';
export { ResponsiveManager } from './ResponsiveManager';
export { PlatformManager } from './PlatformManager';
export { Profiler } from './Profiler';
// export { AnalyticsManager } from './AnalyticsManager'; // TODO: Check export name
