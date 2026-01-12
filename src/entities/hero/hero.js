/**
 * Hero Entity Definition
 * 
 * The player character. Extends BaseHero.
 * Only one hero instance exists per game.
 */

const HeroEntity = {
    ...window.BaseHero,

    id: 'hero',
    name: 'Knight Commander',
    description: 'A seasoned warrior of the Jurassic Knights.',

    // All defaults from BaseHero
    // Override specific values here if needed
};

// Register with EntityRegistry
window.EntityRegistry = window.EntityRegistry || { hero: null };
window.EntityRegistry.hero = HeroEntity;
