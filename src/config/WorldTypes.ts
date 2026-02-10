/**
 * WorldTypes - Constants for world geometry and island/zone/bridge type checks.
 * Use these instead of string literals to avoid typos and document intent.
 */
export const IslandType = {
    HOME: 'home'
} as const;

export const BridgeOrientation = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
} as const;

export const ZoneType = {
    BRIDGE: 'bridge'
} as const;
