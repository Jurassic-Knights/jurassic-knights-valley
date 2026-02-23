/**
 * SpeciesScaleConfig - Species-to-Size Scale Mapping
 *
 * Central config for entity sizes based on species or body type.
 * Used at runtime by Dinosaur.js and EnemyCore.js to calculate
 * entity dimensions.
 *
 * Base sizes:
 * - Human: 96px
 * - Dinosaur: 128px
 * - Saurian: 128px
 * - Herbivore: 160px
 *
 * Final size = baseSize * scale * (isBoss ? 1.4 : 1.0)
 */

import { EntityConfig } from '../types/core';

const SpeciesScaleConfig = {
    // Base sizes by source file / category
    baseSizes: {
        human: 96,
        dinosaur: 128,
        saurian: 128,
        herbivore: 160
    },

    // Boss multiplier
    bossMultiplier: 1.4,

    // Species-to-scale mapping for dinosaurs (carnivores)
    dinosaur: {
        Compsognathus: 0.6,
        Microraptor: 0.5,
        Troodon: 0.7,
        Oviraptor: 0.8,
        Velociraptor: 0.9,
        Gallimimus: 1.0,
        Dilophosaurus: 1.0,
        Deinonychus: 1.0,
        Ceratosaurus: 1.2,
        Baryonyx: 1.3,
        Suchomimus: 1.3,
        Carnotaurus: 1.3,
        Allosaurus: 1.4,
        Utahraptor: 1.5,
        Therizinosaurus: 1.6,
        Acrocanthosaurus: 1.8,
        'Tyrannosaurus Rex': 2.0,
        Giganotosaurus: 2.0,
        Carcharodontosaurus: 2.0,
        Spinosaurus: 2.2
    },

    // Species-to-scale mapping for herbivores
    herbivore: {
        Pachycephalosaurus: 0.9,
        Stygimoloch: 0.8,
        Iguanodon: 1.0,
        Maiasaura: 1.0,
        Parasaurolophus: 1.1,
        Corythosaurus: 1.1,
        Edmontosaurus: 1.2,
        Lambeosaurus: 1.1,
        Centrosaurus: 1.2,
        Chasmosaurus: 1.3,
        Styracosaurus: 1.3,
        Pachyrhinosaurus: 1.3,
        Kentrosaurus: 1.2,
        Polacanthus: 1.3,
        Stegosaurus: 1.4,
        Ankylosaurus: 1.4,
        Triceratops: 1.5,
        Camarasaurus: 2.0,
        Apatosaurus: 2.2,
        Brontosaurus: 2.2,
        Diplodocus: 2.3,
        Brachiosaurus: 2.5,
        Argentinosaurus: 3.0
    },

    // Human body type scales
    human: {
        skinny: 0.9,
        medium: 1.0,
        fat: 1.15,
        muscle: 1.25
    } as Record<string, number>,

    /**
     * Get scale for an entity based on its config
     * @param {EntityConfig} entityConfig - Entity data with species/bodyType/sourceFile
     * @param {boolean} isBoss - Whether this is a boss entity
     * @returns {number} Scale multiplier
     */
    getScale(entityConfig: EntityConfig, isBoss = false) {
        const sourceFile = String(entityConfig.sourceFile || '');
        const species = String(entityConfig.species || '');
        const bodyType = String(entityConfig.bodyType || 'medium');

        let scale = 1.0;

        if (sourceFile === 'human') {
            scale = this.human[bodyType] || 1.0;
        } else if (sourceFile === 'dinosaur') {
            scale = this._lookupSpecies(species, this.dinosaur);
        } else if (sourceFile === 'herbivore') {
            scale = this._lookupSpecies(species, this.herbivore);
        } else if (sourceFile === 'saurian') {
            // Saurians use both dinosaur and herbivore species
            scale =
                this._lookupSpecies(species, this.dinosaur) ||
                this._lookupSpecies(species, this.herbivore) ||
                1.0;
        }

        // Apply boss multiplier
        if (isBoss) {
            scale *= this.bossMultiplier;
        }

        return scale;
    },

    /**
     * Look up species scale, handling compound names like "Velociraptor Rider"
     * Tries exact match first, then base species (first word)
     * @param {string} species - Species name
     * @param {object} lookup - Scale lookup table
     * @returns {number} Scale or 1.0 if not found
     */
    _lookupSpecies(species: string, lookup: Record<string, number>) {
        if (!species) return 1.0;
        // Try exact match first
        if (lookup[species]) {
            return lookup[species];
        }

        // Try base species (first word) for compound names like "Velociraptor Rider"
        const baseSpecies = species.split(' ')[0];
        if (lookup[baseSpecies]) {
            return lookup[baseSpecies];
        }

        // Special case: "Bull Triceratops" -> "Triceratops"
        const parts = species.split(' ');
        if (parts.length > 1) {
            const lastWord = parts[parts.length - 1];
            if (lookup[lastWord]) {
                return lookup[lastWord];
            }
        }

        return 1.0;
    },

    /**
     * Get final size for an entity
     * @param {EntityConfig} entityConfig - Entity data
     * @param {boolean} isBoss - Whether this is a boss
     * @returns {{width: number, height: number, scale: number}}
     */
    getSize(entityConfig: EntityConfig, isBoss = false) {
        // Priority: Explicit config > Species Scale
        if (entityConfig.width && entityConfig.height) {
            const explicitScale = Number(entityConfig.sizeScale) || 1.0;
            return {
                width: Math.round(Number(entityConfig.width) * explicitScale),
                height: Math.round(Number(entityConfig.height) * explicitScale),
                scale: explicitScale
            };
        }

        const sourceFile = entityConfig.sourceFile || 'dinosaur';
        const baseSize = (this.baseSizes as Record<string, number>)[sourceFile] || 128;
        const scale = this.getScale(entityConfig, isBoss);
        const finalSize = Math.round(baseSize * scale);

        return {
            width: finalSize,
            height: finalSize,
            scale: scale,
            source: sourceFile
        };
    }
};

export { SpeciesScaleConfig };
