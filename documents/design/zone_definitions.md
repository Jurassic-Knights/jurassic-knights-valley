# Zone System Definitions

**Project:** Jurassic Knights: Valley  
**Theme:** "The Great War with Teeth" (WW1 Technology + Prehistoric Biology)

This document defines the visual identities, gameplay mechanics, and procedural rules for the Map Editor's painted zones.

---

## 1. Civilization Zones (Faction & Infrastructure)

_Regions defined by human (or humanoid) modification of the terrain._

### 🏰 Outpost (`civ_outpost`)

**Concept**: A fortified forward operating base. The only relative safety in the valley.

- **Visual Identity**:
    - **Ground**: Packed dirt, gravel paths, wooden floorboards.
    - **Props**: Sandbag walls, canvas tents (khaki/green), weapon racks, lanterns.
    - **Lighting**: Warm campfire glow, electric spotlights.
- **Gameplay**:
    - **Spawning**: Friendly NPCs (Vendors, Quest Givers). No Hostiles.
    - **Music**: "Respite" / Acoustic Guitar + Distant Artillery.
    - **Rules**: Regeneration enabled. Fast Travel point.

### ⛓️ Trench Line (`civ_trench`)
**Concept**: A network of defensive earthworks carved into the land.
- **Visual Identity**:
  - **Ground**: `ground_damage_churned` (Deep Mud), duckboards.
  - **Props**: Barbed wire coils, corrugated iron walls, ammo crates.
  - **VFX**: Flies buzzing, occasional mud splashes.
- **Gameplay**:
  - **Movement**: Moving *along* the trench is normal. Moving *over* walls is slow/vaulting.
  - **Hazards**: Barbed Wire (DoT + Slow).
  - **Cover**: High defense against ranged attacks.
  - **Enemies**: Humanoid Soldiers (Riflemen with `ui_icon_rifle`).

### 💀 No Man's Land (`civ_noman`)

**Concept**: The blasted wasteland between fronts. Destruction incarnate.

- **Visual Identity**:
    - **Ground**: Ash-grey soil, black mud, scorched earth.
    - **Props**: Impact craters (water-filled), skeletal trees, destroyed tanks/mechs (ancient knight armor), bones.
    - **VFX**: Low-hanging grey mist, embers.
- **Gameplay**:
    - **Spawning**: High-Threat Roaming Monsters (T-Rex, Triceratops).
    - **Loot**: High quality salvage from destroyed war machines.
    - **Hazard**: "Shell Shock" (Screen shake/blur effect periodic).

### 🏛️ Ruins (`civ_ruins`)
**Concept**: Ancient structures from a previous era (The First Crusade against the Saurians).
- **Visual Identity**:
  - **Ground**: `ground_interior_cobblestone`, `ground_overgrown_moss`.
  - **Props**: Broken stone pillars, statues of knights fighting dragons, overgrown vines.
- **Gameplay**:
  - **Spawning**: Ambush predators (Raptors).
  - **Loot**: Relics, Lore items.
  - **Verticality**: High ground advantages.

### 📦 Supply Depot (`civ_supply`)
**Concept**: A logistics hub, likely abandoned or contested by the Iron Legion.
- **Visual Identity**:
  - **Ground**: `ground_interior_concrete`, `ground_interior_metal_plate`.
  - **Props**: `building_industrial_01`, fuel drums, crane arms, trucks.
- **Gameplay**:
  - **Loot**: High density of crafting materials (Steel, Oil, Gunpowder).
  - **Event**: "Sabotage" - Exploding barrels can chain reaction.

---

## 2. Weather Zones (Atmospheric Overrides)

_Zones that override the global weather state to create localized drama._

### 🌫️ Mustard Fog (`weather_fog`)

**Concept**: A lingering cloud of chemical warfare gas.

- **Visuals**: Thick, sickly yellow/green volumetric fog. Reduced draw distance.
- **Gameplay**:
    - **Debuff**: "Choking" (Stamina does not regenerate).
    - **Counter**: Gas Mask equipment negates debuff.
    - **Enemy**: "Gas-Masked Raptors" or mutated variations.

### 🏭 Artillery Smog (`weather_smog`)
**Concept**: Smoke from heavy bombardment or industrial machinery.
- **Visuals**: Dark grey haze, falling ash particles (snow-like but black).
- **Gameplay**:
  - **Stealth**: Player visibility reduced (Harder for enemies to spot you, harder for you to aim).
  - **Audio**: Muffled sounds, loud distant booms.
  
### 🌋 Ash Fall (`weather_ash`)
**Concept**: Volcanic debris or fallout from the "Scorch Front".
- **Visuals**: `ground_damage_scorched` terrain tint. Falling glowing embers.
- **Gameplay**:
  - **Heat**: Stamina drains faster while sprinting.
  - **Farming**: Impossible. Crops wither.

### ⛈️ Heavy Storm (`weather_storm`)

**Concept**: A primal tempest.

- **Visuals**: Heavy blue/grey rain, lightning flashes (screen whiteout), wind swaying trees violently.
- **Gameplay**:
    - **Noise Masking**: Running/Gunshots are quieter (masked by thunder).
    - **Lightning Strike**: Random chance to strike high ground or metal objects.

### ☀️ Forced Clear (`weather_clear`)

**Concept**: A protected area or "eye of the storm".

- **Visuals**: Bright sunlight, lens flares, vibrant colors.
- **Gameplay**:
    - **Visibility**: Maximum.
    - **Safety**: No weather hazards.

---

## 3. Tactical Zones (Invisible Logic)

_Meta-game zones for defining rules._

### 🚁 Extraction Zone (`tac_extraction`)

- **Logic**: Players must hold this position for X seconds to bank their loot.
- **UI**: "Extraction Signal Detected" HUD element appears.

### 🎯 Artillery Killbox (`tac_killbox`)

- **Logic**: Every 10-30 seconds, an explosion spawns at a random location within this zone.
- **Warning**: Red circle telegraphs impact 3s before hit.

### 🚫 No Build Zone (`tac_nobuild`)

- **Logic**: Disables the placement of structures (turrets, camps).
- **Use Case**: Around essential NPCs or boss arenas to prevent cheesing.
