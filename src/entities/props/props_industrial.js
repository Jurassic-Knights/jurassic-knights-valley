/**
 * Industrial Props - Grouped
 * 
 * Environmental props for Scrap Yard and Iron Ridge.
 */

const IndustrialProps = {
    scrap_tire: {
        id: 'prop_scrap_tire',
        name: 'Worn Tire',
        sprite: 'prop_scrap_tire',
        collision: true,
        spawnBiomes: ['scrap_yard']
    },
    scrap_cog: {
        id: 'prop_scrap_cog',
        name: 'Rusted Cog',
        sprite: 'prop_scrap_cog',
        collision: false,
        spawnBiomes: ['scrap_yard']
    },
    iron_pipe: {
        id: 'prop_iron_pipe',
        name: 'Iron Pipe',
        sprite: 'prop_iron_pipe',
        collision: true,
        spawnBiomes: ['iron_ridge']
    },
    iron_gear: {
        id: 'prop_iron_gear',
        name: 'Iron Gear',
        sprite: 'prop_iron_gear',
        collision: false,
        spawnBiomes: ['iron_ridge']
    }
};

window.EntityRegistry.props = window.EntityRegistry.props || {};
Object.assign(window.EntityRegistry.props, IndustrialProps);
