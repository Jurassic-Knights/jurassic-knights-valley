/**
 * IslandManager - Main barrel export for IslandManager singleton
 *
 * The singleton is created from the consolidated IslandManagerService class
 * which now contains all methods directly (no prototype patching needed).
 */

import { IslandManagerService } from './IslandManagerCore';
import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';

// Create the singleton instance
const IslandManager = new IslandManagerService();

// Register globally
if (Registry) Registry.register('IslandManager', IslandManager);

Logger.info('[IslandManager] Singleton created');

// ES6 Module Export
export { IslandManager, IslandManagerService };
