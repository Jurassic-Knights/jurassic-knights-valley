/**
 * Core Module Index (Barrel Export)
 * 
 * This file provides ES6 module exports while maintaining backward
 * compatibility with the existing window.X global pattern.
 * 
 * Usage in new code:
 *   import { Logger, EventBus, Registry } from '@/core/index.js';
 * 
 * Legacy code continues to work via window.X globals.
 */

// Core utilities
export { Logger } from './Logger.js';
export { Registry } from './Registry.js';
export { EventBus } from './EventBus.js';

// Asset management
export { AssetLoader } from './AssetLoader.js';
export { SpriteLoader } from './SpriteLoader.js';

// Game core
export { Entity } from './Entity.js';
export { EntityManager } from './EntityManager.js';
export { GameState } from './GameState.js';
export { GameRenderer } from './GameRenderer.js';
export { GameInstance } from './Game.js';

// Utilities
export { Quadtree } from './Quadtree.js';
export { State } from './State.js';
export { ResponsiveManager } from './ResponsiveManager.js';
export { PlatformManager } from './PlatformManager.js';
export { Profiler } from './Profiler.js';
export { AnalyticsManager } from './AnalyticsManager.js';
