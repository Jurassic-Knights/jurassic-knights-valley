/**
 * BodyTypeConfig - Scale multipliers for different body types
 * 
 * Used by entity renderers to apply consistent scaling based on bodyType field.
 * shadowScale and hitboxScale automatically derive from scale.
 */

export const BodyTypeConfig: Record<string, { scale: number }> = {
    muscle: { scale: 1.25 },
    medium: { scale: 1.0 },
    skinny: { scale: 0.9 },
    fat: { scale: 1.3 }
};

/**
 * Get scale for a body type
 * @param bodyType - The body type string
 * @returns Scale multiplier (defaults to 1.0 if not found)
 */
export function getBodyTypeScale(bodyType: string | undefined): number {
    if (!bodyType) return 1.0;
    return BodyTypeConfig[bodyType]?.scale ?? 1.0;
}
