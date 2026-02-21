export const IslandUpgrades = {
    init: () => { },
    getIsland: () => null,
    calculateRespawnTime: (baseSeconds: number) => baseSeconds,
    getUpgradeCost: () => ({ iron: 0, copper: 0, silver: 0, gold: 0, coal: 0 }),
    applyUpgrade: () => false,
    getRespawnTime: (_gc: any, _cx: any, _cy: any, _type: any) => 30
};
