export const IslandUpgrades = {
    init: () => {},
    getIsland: (): object | null => null,
    calculateRespawnTime: (baseSeconds: number) => baseSeconds,
    getUpgradeCost: () => ({ iron: 0, copper: 0, silver: 0, gold: 0, coal: 0 }),
    applyUpgrade: () => false,
    getRespawnTime: (_gc: object, _cx: number, _cy: number, _type: string) => 30
};
