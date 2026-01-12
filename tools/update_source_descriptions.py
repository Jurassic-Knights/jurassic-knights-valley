import json
import os

base_dir = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"

# Map of IDs to their updated sourceDescriptions based on the prompts used
updates = {
    # Dinosaurs - with decline feedback applied
    "dinosaur_t1_02": "chibi Dilophosaurus, war-beast appearance, skinny slender body, prominent large neck frills displayed, light plate armor on back, facing left, side profile",
    "dinosaur_t2_02": "chibi Velociraptor pack alpha, war-beast appearance, larger and more scarred than normal, feathered crest, medium plate armor, veteran battle scars, NO tribal markings, facing left, side profile",
    "dinosaur_t4_01": "chibi Velociraptor with snow, war-beast appearance, realistic velociraptor with snow dusted on its body, frost on feathers, heavy plate armor, breath visible in cold, NOT ice-themed just cold and snowy, facing left, side profile",
    
    # Herbivores
    "herbivore_t2_03": "chibi Pachycephalosaurus, natural appearance, no armor, no gear, thick dome skull, bipedal stance, olive-brown coloring, facing left, side profile",
    "herbivore_t4_01": "chibi Diplodocus, natural appearance, no armor, no gear, extremely long neck and tail, massive sauropod body, grey-brown hide, facing left, side profile",
    
    # Humans
    "human_t4_02": "Leutnant officer, medieval and WWI fusion aesthetic, wearing military officer uniform with medieval pauldrons, ornate steel helmet with plume, wielding a pistol, facing left, side profile",
    "human_t2_02": "Crossbowman soldier, medieval and WWI fusion aesthetic, wearing trench coat with chainmail underneath, sallet helmet, wielding a crossbow, facing left, side profile",
    "human_t3_03": "Field Medic soldier, medieval and WWI fusion aesthetic, wearing medical officer uniform with light armor, welding mask covering face, medical supplies pouch, wielding a pistol, facing left, side profile",
    
    # Saurians
    "saurian_t1_01": "anthropomorphic Velociraptor rider, medieval and WWI fusion aesthetic, armored warrior appearance, wearing light plate armor, wielding a sword, facing left, side profile",
    "saurian_t2_01": "anthropomorphic Deinonychus lancer, medieval and WWI fusion aesthetic, armored warrior appearance, wearing medium plate armor, wielding a lance, NO SADDLE, bipedal stance, facing left, side profile",
    "saurian_t3_01": "anthropomorphic Allosaurus gunner, medieval and WWI fusion aesthetic, armored warrior appearance, stocky muscular build, wearing heavy plate armor, wielding a machine gun, facing left, side profile",
    "saurian_t4_01": "anthropomorphic Tyrannosaurus Rex warlord, medieval and WWI fusion aesthetic, armored warrior appearance, massive muscular build, wearing ornate heavy plate armor, wielding a greatsword, facing left, side profile",
    "saurian_t2_02": "anthropomorphic Parasaurolophus herald, medieval and WWI fusion aesthetic, armored warrior appearance, distinctive head crest, wearing medium plate armor, wielding a war horn and mace, facing left, side profile",
    "saurian_t3_04": "anthropomorphic Carnotaurus striker, medieval and WWI fusion aesthetic, armored warrior appearance, distinctive bull-like horns above eyes, short muscular arms, wearing heavy plate armor, wielding dual blades, facing left, side profile",
    "saurian_t4_02": "anthropomorphic Spinosaurus commander, medieval and WWI fusion aesthetic, armored warrior appearance, distinctive sail on back, massive build, wearing ornate heavy plate armor, wielding a halberd, facing left, side profile",
}

# Group by JSON file
json_files = {
    "tools/enemies/dinosaur.json": ["dinosaur_t1_02", "dinosaur_t2_02", "dinosaur_t4_01"],
    "tools/enemies/herbivore.json": ["herbivore_t2_03", "herbivore_t4_01"],
    "tools/enemies/human.json": ["human_t4_02", "human_t2_02", "human_t3_03"],
    "tools/enemies/saurian.json": ["saurian_t1_01", "saurian_t2_01", "saurian_t3_01", "saurian_t4_01", "saurian_t2_02", "saurian_t3_04", "saurian_t4_02"],
}

for json_rel_path, ids in json_files.items():
    json_path = os.path.join(base_dir, json_rel_path)
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    for item in data:
        if item['id'] in ids:
            old_desc = item.get('sourceDescription', '')[:50]
            item['sourceDescription'] = updates[item['id']]
            print(f"Updated {item['id']}: '{old_desc}...' -> '{updates[item['id']][:50]}...'")
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)

print(f"\nUpdated sourceDescriptions for {len(updates)} enemies.")
