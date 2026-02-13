/**
 * IslandManager - Re-exports WorldManager for backward compatibility
 *
 * WorldManager replaces IslandManager. All systems that use IslandManager
 * get WorldManager (mapgen4 polygon map, walk everywhere).
 */

export { WorldManager as IslandManager, WorldManagerService } from './WorldManager';
