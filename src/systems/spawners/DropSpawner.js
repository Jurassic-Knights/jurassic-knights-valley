/**
 * DropSpawner - Handles dropped item spawning
 *
 * Extracted from SpawnManager.js for modularity.
 * Manages resource drops and crafted item spawning.
 *
 * Owner: Loot System
 */

class DropSpawner {
    constructor(spawnManager) {
        this.spawnManager = spawnManager;
    }

    /**
     * Spawn a dropped item at a location
     */
    spawnDrop(x, y, resourceType, amount = 1) {
        if (!window.DroppedItem) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 40;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: resourceType,
            amount: amount,
            minPickupTime: 2.0
        });

        drop.flyTo(targetX, targetY);

        if (window.EntityManager) EntityManager.add(drop);

        Logger.info(`[DropSpawner] Spawned drop: ${resourceType} x${amount} at ${x},${y}`);
    }

    /**
     * Spawn an item crafted by the player (flying out from Forge)
     */
    spawnCraftedItem(x, y, type, options = {}) {
        if (!window.DroppedItem || !window.EntityManager) return;

        const { amount = 1, icon = null } = options;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: type,
            amount: amount,
            customIcon: icon,
            minPickupTime: 0.5
        });

        EntityManager.add(drop);

        let tx, ty;

        if (options.targetX !== undefined && options.targetY !== undefined) {
            tx = options.targetX;
            ty = options.targetY;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = 150 + Math.random() * 100;
            tx = x + Math.cos(angle) * dist;
            ty = y + Math.sin(angle) * dist;
        }

        if (window.IslandManager && IslandManager.clampToPlayableArea) {
            const clamped = IslandManager.clampToPlayableArea(tx, ty);
            tx = clamped.x;
            ty = clamped.y;
        }

        drop.flyTo(tx, ty);
        Logger.info(`[DropSpawner] Spawned crafted item: ${type}`);
    }
}

window.DropSpawner = DropSpawner;

// ES6 Module Export
export { DropSpawner };
