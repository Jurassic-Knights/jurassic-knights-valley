import { buildMeshAndMap } from './src/tools/map-editor/Mapgen4Generator';
import { makeDefaultConstraints } from './src/tools/map-editor/mapgen4/buildMesh';

const param: any = {
    spacing: 5,
    mountainSpacing: 15,
    meshSeed: 1234,
    elevation: makeDefaultConstraints(1234, 1.0),
    biomes: {},
    rivers: {}
};

try {
    const meshAndMap = buildMeshAndMap(param);
    console.log("Mesh and map generated.");

    // Simulate structured clone
    const mapData = {
        seed: meshAndMap.map.seed,
        t_peaks: meshAndMap.map.t_peaks,
        wind_sort_r: meshAndMap.map.wind_sort_r
    };

    console.log("Map data mapped. Testing structured clone.");
    structuredClone(mapData);
    console.log("Structured clone successful!");
} catch (e) {
    console.error("Failed:", e);
}
