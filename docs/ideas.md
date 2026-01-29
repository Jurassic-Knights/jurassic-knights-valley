# Jurassic Knights: Valley - Ideas Document

**Purpose:** A living document to capture game ideas, feature concepts, and creative sparks for future development.

---

## Ideas Backlog

### The Ironclad Express (Train System) - 2026-01-28
**Category:** Gameplay Loop / Economy / Content
**Priority:** High
**Status:** 💡 New

**Summary:**
A rail-based travel system connecting key outposts that serves as both fast travel and a logistic transport layer. Players must physically transport "Heavy" resources between bases while defending the train in a turret-based rail shooter minigame.

**Details:**
- **Hybrid Economy:** 
  - Basic resources (Wood, Stone) remain global/magic.
  - **Heavy/Rare Resources** (Dino Carcasses, Refined Alloys, High-Tier Tech) are **local** to the outpost where they were harvested. They must be transported via train to the main base to be used.
- **Rail Shooter Combat:** 
  - Player mans a mounted turret to defend the train while it moves through the world.
  - **Exclusive Enemies:** Unique "Chaser" variants (fast raptors, flyers) that only spawn to attack the train.
- **Logistics & Risk:** 
  - **Fuel Cost:** Trips require fuel (Coal, Oil) to start.
  - **Cargo Integrity:** Taking damage doesn't stop the train, but it destroys a percentage of the cargo. Arriving safely = 100% profit.
- **Rewards & Mastery:**
  - **Performance Grade:** Runs are graded (S/A/B) based on Cargo Integrity and Enemies Killed.
  - **S-Rank Bonus:** Grants a "Supply Drop" crate containing rare train upgrade parts or high-tier fuel.
  - **Reliability Streak:** Consecutive successful deliveries to an outpost apply a temporary "Boom Town" buff, lowering shop prices and increasing passive resource generation at that outpost.
- **Progression:**
  - **Train Equipment:** Craftable turret upgrades (Heavy Barrels, Rapid Receivers, Cooling Systems) using the standard crafting system.

**Related Systems:**
- Economy/Inventory (Inventory splitting logic)
- Fast Travel
- Crafting (Vehicle parts)
- Enemy AI (Chaser behavior)

---

### Pterodactyl Hunt - 2026-01-22
**Category:** Combat / Content
**Priority:** High
**Status:** 💡 New

**Summary:**
Transform the randomly spawning pterodactyl into a huntable herbivore prey creature. It flees when attacked, requiring the player to chase it across the world through potentially dangerous zones. Killing it rewards significant, special loot.

**Details:**
- **Scaling Difficulty:** Health/defense scales relative to player stats so it always takes a fair number of hits to kill
- **Wandering Behavior:** Always randomly flying around the world (not reactive to attacks); you first notice it when it randomly flies past you
- **Persistent State:** If it escapes view, it continues existing in the world until killed or despawned
- **Tracking System:** Leaves a trail (feathers, droppings, environmental marks) that updates as it moves; oldest trail markers despawn so you can track its latest location
- **Spawn Rules:** 
  - Truly random spawn timing
  - Max 4 can exist in the world at once
  - Despawns after a set time limit if not killed; new one spawns later following random logic
- **Death Persistence:** If player dies mid-chase, the pterodactyl remains in the world
- **Special Loot:** Drops unique/significant rewards on kill

**Related Systems:**
- Entity spawning system
- AI pathfinding / flee behavior
- Trail/tracking VFX system
- Loot drop system
- Entity persistence / state saving

---

### Elite Species Loot & Set Crafting - 2026-01-22
**Category:** Combat / Progression / Content
**Priority:** High
**Status:** 💡 New

**Summary:**
Elite enemies (existing system with stat modifiers and distinct visual display) always drop species-specific loot materials. These materials are used to craft species-specific equipment sets that grant set bonuses when all pieces are equipped.

**Details:**
- **Guaranteed Drops:** Elites always drop their species-specific loot (not RNG)
- **Tangible Materials:** Real dinosaur parts - Stegosaurus plates, Raptor claws, T-Rex fangs, etc.
- **Species Equipment Sets:** Each species has a craftable equipment set requiring its specific materials
- **Set Bonuses:** Equipping all pieces of a species set grants a unique bonus
- **Crafting Focus:** This is a crafting system, not a modification/upgrade system

**Related Systems:**
- Elite enemy spawning (existing)
- Loot drop system
- Crafting system
- Equipment/inventory system
- Set bonus tracking

---

### Fishing Mini-Game (Stardew Style) - 2026-01-22
**Category:** Content / UI
**Priority:** Medium
**Status:** 💡 New

**Summary:**
Implement a fishing mini-game at fishing nodes using Stardew Valley's proven mechanics. Player clicks fish button at a node, then plays a catch mini-game to land fish.

**Details:**
- **Core Mechanic:** 1:1 Stardew Valley fishing
  - Vertical bar with a "catch zone" (green section) that you control
  - Fish icon moves erratically up and down
  - Hold button = catch zone rises; release = it falls
  - Keep fish inside catch zone to fill progress bar
  - Fish escapes if progress empties before full
- **Fish Behavior Variety:** Different fish move at different speeds/patterns (easy fish = slow smooth, hard fish = twitchy and fast)
- **Skill Curve:** Difficulty scales with fish rarity
- **Progression:** Better rods = larger catch zone, slower fall speed

**Related Systems:**
- Fishing node world objects
- Inventory/loot system
- UI overlay system
- Fish species data config

---

### Squad & Base Management System - 2026-01-22
**Category:** Progression / Content / Combat
**Priority:** High
**Status:** 💡 New

**Summary:**
A soldier recruitment and base management system inspired by MGSV's Mother Base. Build an army of soldiers, assign them to base departments for passive bonuses, and select up to 3 to follow you in the field. Soldiers can be equipped with one weapon each, giving old weapons continued value.

**Details:**

**Field Squad (3 Soldiers Max):**
- Up to 3 soldiers follow you in combat
- Each soldier can be equipped with 1 weapon (swappable anytime)
- Soldiers do not take damage - they're invulnerable companions
- Solves "old weapons become obsolete" problem

**Soldier Recruitment:**
- Rescue POWs / defeated enemy knights during missions
- Random volunteers join over time
- Expedition rewards can include new soldiers
- Each soldier has a tier: Bronze / Silver / Gold (affects effectiveness)

**Base Departments:**
Assign soldiers to departments for passive bonuses:

| Department | Bonus |
|------------|-------|
| **Forge** | Faster crafting, unlocks advanced recipes |
| **Stables** | Dino care, mount bonuses, breeding |
| **Armory** | Gear maintenance, damage bonuses |
| **Scouts** | Intel on map, reveals resources/enemies |
| **Barracks** | Increases soldier capacity |

**Expeditions (Combat Deployment):**
- Send soldiers on timed offline missions
- Return with resources, loot, or new recruits
- Higher department levels = better expedition success

**Morale System:**
- Visit outpost and interact with soldiers to boost morale
- High morale = productivity bonuses
- Low morale = reduced output, potential conflicts

**Related Systems:**
- Outpost/base building
- Inventory/equipment system
- Recruitment events
- Expedition timer system
- Department leveling

---

### Raptor Pack AI - 2026-01-22
**Category:** Combat / AI
**Priority:** High
**Status:** 💡 New

**Summary:**
Raptors spawn as pre-formed pack units with coordinated hunting behavior. The pack fights as a cohesive group with flanking tactics and an alpha leader.

**Details:**
- **Pre-formed Packs:** Raptors spawn as a "pack" entity (3-5 raptors) rather than individuals
- **Alpha Raptor:** One larger raptor leads; killing it causes the pack to scatter or become disorganized
- **Flanking AI:** Pack members circle and flank while one distracts from the front
- **Hunt Calls:** Audio cues (screeches) telegraph when a pack is coordinating an attack
- **Pack Aggro:** Attacking one raptor alerts the entire pack

**Related Systems:**
- AI System (pack coordination logic)
- Enemy spawning system (spawn as group entity)
- Audio system (hunt call SFX)

---

### Territorial Clash Events - 2026-01-22
**Category:** Combat / World Events
**Priority:** High
**Status:** 💡 New

**Summary:**
Random world events where two apex mega bosses spawn and fight each other. Players can spectate, intervene, or opportunistically attack the weakened survivor.

**Details:**
- **Random World Event:** Triggers randomly, spawning two different mega bosses in proximity
- **Mega Boss Tier:** Uses a new tier above regular bosses - apex predators with massive health pools
- **AI Fight:** The mega bosses fight each other automatically, dealing real damage to one another
- **Spectator Mode:** If player stays hidden/distant, they can watch the fight unfold
- **Opportunistic Strike:** Attacking mid-clash draws aggro from both (high risk)
- **Scavenge Window:** The winner is briefly exhausted (lower stats) - easier to kill
- **Rare Drops:** Mega bosses drop "battle-scarred" trophy materials and unique loot

**Related Systems:**
- World event system (random event triggers)
- Boss AI system (mega boss tier)
- Enemy spawning system
- Loot drop system

---

## Archived Ideas (Implemented or Rejected)

*None yet.*
