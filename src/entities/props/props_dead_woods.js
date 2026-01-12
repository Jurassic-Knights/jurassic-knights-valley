/**
 * Dead Woods Props - Grouped
 * 
 * Environmental props for the Dead Woods biome.
 */

const DeadWoodsProps = {
    dead_stump: {
        id: 'prop_dead_stump',
        name: 'Dead Stump',
        sprite: 'prop_dead_stump',
        collision: true,
        spawnBiomes: ['dead_woods']
    },
    dead_roots: {
        id: 'prop_dead_roots',
        name: 'Twisted Roots',
        sprite: 'prop_dead_roots',
        collision: false,
        spawnBiomes: ['dead_woods']
    }
};

window.EntityRegistry.props = window.EntityRegistry.props || {};
Object.assign(window.EntityRegistry.props, DeadWoodsProps);
