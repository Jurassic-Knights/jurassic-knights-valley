/**
 * EntityScaling - Standardized logic for entity dimension calculations
 *
 * Ensures consistent application of width, height, and scale from config/registry.
 * Used by Entity constructors and refreshConfig() methods.
 */
import { Logger } from '@core/Logger';

export const EntityScaling = {
    /**
     * Calculate final dimensions for an entity based on config and defaults.
     *
     * Priority:
     * 1. Instance Config (passed to constructor)
     * 2. Registry Config (from EntityLoader)
     * 3. Defaults
     *
     * Logic:
     * - Base Width/Height = instance.width || registry.width || default
     * - Scale = instance.sizeScale || instance.scale || registry.sizeScale || registry.scale || 1.0
     * - Final = Base * Scale
     *
     * @param {object} instanceConfig - The specific config for this entity instance
     * @param {object} registryConfig - The registry entry for this entity type
     * @param {object} defaults - Fallback values { width, height }
     * @returns {{ width: number, height: number, scale: number }}
     */
    calculateSize(instanceConfig: any = {}, registryConfig: any = {}, defaults: { width: number, height: number } = { width: 80, height: 80 }) {
        // Priority: Registry (Dashboard) > Instance (Save Data/Map) > Defaults
        // The User explicitly requested that Asset Dashboard settings must be the source of truth,
        // ignoring potential "baked" values in save files or map data.

        // 1. Determine Base Dimensions
        // Registry Config wins to ensure updates propagate to all instances
        const baseWidth = registryConfig.width || instanceConfig.width || defaults.width;
        const baseHeight = registryConfig.height || instanceConfig.height || defaults.height;

        // 2. Determine Scale
        // Registry Config wins.
        // We look for 'sizeScale' first, then 'scale'.
        const registryScale = registryConfig.sizeScale || registryConfig.scale;
        const instanceScale = instanceConfig.sizeScale || instanceConfig.scale;

        // Strict Priority: Registry > Instance > Default (1.0)
        // If Registry has a value, USE IT. Only fallback to instance if Registry is undefined.
        // This ensures "scale 4" in dashboard applies even if map data says "scale 1".
        const scale = (registryScale !== undefined) ? registryScale : (instanceScale || 1.0);

        // 3. Calculate Final Dimensions
        // We round to avoid sub-pixel blurring which looks bad in pixel art
        const finalWidth = Math.round(baseWidth * scale);
        const finalHeight = Math.round(baseHeight * scale);

        let source = 'default';
        if (registryScale !== undefined) source = 'registry';
        else if (instanceScale !== undefined) source = 'instance';

        return {
            width: finalWidth,
            height: finalHeight,
            scale: scale,
            baseWidth,
            baseHeight,
            source
        };
    },

    /**
     * Apply calculated dimensions to an entity instance
     * @param {Entity} entity - The entity to update
     * @param {object} config - Configuration used for logging context
     */
    applyToEntity(entity: any, instanceConfig: any = {}, registryConfig: any = {}, defaults: { width: number, height: number }) {
        const size = this.calculateSize(instanceConfig, registryConfig, defaults);

        entity.width = size.width;
        entity.height = size.height;
        entity.scale = size.scale; // Store scale for reference

        // Update collision bounds if they exist
        if (entity.collision && entity.collision.bounds) {
            // Check if bounds were manually overridden in config (don't overwrite custom bounds)
            // If bounds match previous dimensions (or are proportional), update them?
            // Safer strategy: Update bounds to match new width/height unless explicitly set to something else?
            // For now, simpler: Update bounds width/height to match entity width/height
            // (most entities have bounds matching their size)

            // OPTIONAL: Apply bounds scaling factor if defined (some entities have 0.8 collision box)
            // But usually collision.bounds.width IS the final width.
            entity.collision.bounds.width = size.width;
            entity.collision.bounds.height = size.height;
        }

        // Logger.info(`[EntityScaling] Applied size to ${entity.id || 'entity'}: ${size.width}x${size.height} (Scale: ${size.scale})`);
        return size;
    }
};
