/**
 * Ruins Props - Grouped
 * 
 * Environmental props for The Ruins biome.
 */

const RuinsProps = {
    ruins_slab: {
        id: 'prop_ruins_slab',
        name: 'Stone Slab',
        sprite: 'prop_ruins_slab',
        collision: true,
        spawnBiomes: ['the_ruins']
    },
    ruins_pillar: {
        id: 'prop_ruins_pillar',
        name: 'Broken Pillar',
        sprite: 'prop_ruins_pillar',
        collision: true,
        spawnBiomes: ['the_ruins']
    }
};

window.EntityRegistry.props = window.EntityRegistry.props || {};
Object.assign(window.EntityRegistry.props, RuinsProps);
