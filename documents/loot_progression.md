# Loot & Resource Progression Design
**Version:** 1.0 | **Date:** 2026-01-10

---

## 1. System Constants

```javascript
// Quality System (Equipment Only)
QUALITY: {
    MIN: 25,        // Floor quality (junk)
    MAX: 200,       // Ceiling quality (masterwork)
    BASE: 100,      // Normal quality
    ELITE_FLOOR: 80,    // Elites drop at least 80%
    BOSS_FLOOR: 120     // Bosses drop at least 120%
}

// Node Upgrade Chance (% chance a higher tier node spawns)
NODE_UPGRADE_CHANCE: 0.05  // 5%

// Categories for Inventory Filtering
CATEGORIES: ['food', 'minerals', 'scraps', 'items', 'equipment']
```

---

## 2. Zone Progression (8 Zones + Home)

| Zone | Tier | Theme | Primary Resources | Enemies |
|------|------|-------|-------------------|---------|
| **Home Outpost** | 0 | Safe Zone | None (Forge only) | None |
| **Quarry Fields** | 1 | Grey stone, dust | Stone, Rough Gravel | Feral Compy |
| **Scrap Yard** | 1 | Salvage depot | Scrap Metal, Copper Wire | Scavenger Soldier |
| **Iron Ridge** | 2 | Rust, red clay | Iron Ore, Coal | Feral Raptor, Trench Deserter |
| **Dead Woods** | 2 | Fog, twisted trees | Petrified Wood, Resin, Bone | Feral Spitter, Forest Marauder |
| **Crossroads** | 2 | Trade hub | Mixed (trade) | Rogue Bandits |
| **Mud Flats** | 3 | Swamp, tar pits | Fossil Fuel, Tar, Hide | Feral Rex, Swamp Infantry |
| **Bone Valley** | 3 | Fossils, bleached sand | Ancient Bone, Obsidian, Sinew | Alpha Raptor (Boss), Bone Collectors |
| **The Ruins** | 4 | Ancient mystery | Ancient Gear, Relic Shards | Ancient Guardian (Boss), Ruin Wardens |

---

## 3. Resources

### Food (From Dinosaurs/Animals)

| ID | Display Name | Tier | Source | Zone | Rarity |
|----|--------------|------|--------|------|--------|
| `raw_meat` | Raw Meat | 1 | Compy, Small Dinos | Quarry | Common |
| `primal_meat` | Primal Meat | 2 | Raptor, Medium Dinos | Iron Ridge, Dead Woods | Common |
| `prime_cut` | Prime Cut | 3 | Rex, Large Dinos | Mud Flats | Uncommon |
| `apex_flesh` | Apex Flesh | 4 | Alpha Raptor, Bosses | Bone Valley | Rare |

### Minerals (From Resource Nodes)

| ID | Display Name | Tier | Source Node | Zone | Rarity |
|----|--------------|------|-------------|------|--------|
| `stone` | Rough Stone | 1 | Stone Pile | Quarry | Common |
| `iron_ore` | Iron Ore | 2 | Iron Deposit | Iron Ridge | Common |
| `coal` | Coal | 2 | Coal Seam | Iron Ridge | Uncommon |
| `gold_ore` | Gold Ore | 3 | Gold Vein | Mud Flats | Rare |
| `obsidian` | Obsidian | 3 | Obsidian Cluster | Bone Valley | Uncommon |
| `ancient_ore` | Ancient Ore | 4 | Relic Deposit | The Ruins | Rare |

### Scraps (Non-Mineral Crafting Resources)

| ID | Display Name | Tier | Source | Zone | Rarity |
|----|--------------|------|--------|------|--------|
| `scrap_metal` | Scrap Metal | 1 | Debris Pile | Scrap Yard | Common |
| `copper_wire` | Copper Wire | 1 | Scrap Pile | Scrap Yard | Uncommon |
| `petrified_wood` | Petrified Wood | 2 | Dead Tree | Dead Woods | Common |
| `resin` | Tree Resin | 2 | Resin Node | Dead Woods | Uncommon |
| `bone` | Weathered Bone | 2 | Bone Pile, Dino Kills | Dead Woods, Bone Valley | Common |
| `sinew` | Tough Sinew | 3 | Large Dinos | Mud Flats | Uncommon |
| `raptor_hide` | Raptor Hide | 2 | Raptor Kills | Iron Ridge | Common |
| `rex_hide` | Rex Hide | 3 | Rex Kills | Mud Flats | Uncommon |
| `fossil_fuel` | Fossil Fuel | 2 | Tar Pit, Triceratops | Mud Flats | Common |
| `ancient_gear` | Ancient Gear | 4 | Ruin Mechanism | The Ruins | Rare |
| `relic_shard` | Relic Shard | 4 | Ruin Fragment | The Ruins | Epic |

---

## 4. Items (Crafted Intermediates)

Recipes: `Resources → Items` via Forge

| ID | Display Name | Recipe | Time | Tier |
|----|--------------|--------|------|------|
| `iron_ingot` | Iron Ingot | 3x Iron Ore + 1x Coal | 20s | 2 |
| `steel_ingot` | Steel Ingot | 2x Iron Ingot + 2x Coal | 40s | 3 |
| `hardened_steel` | Hardened Steel | 2x Steel Ingot + 1x Obsidian | 60s | 4 |
| `scrap_plate` | Scrap Plate | 3x Scrap Metal + 1x Petrified Wood | 15s | 1 |
| `reinforced_plate` | Reinforced Plate | 2x Scrap Plate + 1x Iron Ingot | 30s | 2 |
| `leather` | Cured Leather | 2x Raptor Hide + 1x Resin | 25s | 2 |
| `thick_leather` | Thick Leather | 2x Rex Hide + 2x Resin | 45s | 3 |
| `bone_charm` | Bone Charm | 3x Bone + 1x Sinew | 20s | 2 |
| `mechanism` | Basic Mechanism | 2x Scrap Metal + 1x Copper Wire | 30s | 1 |
| `precision_mech` | Precision Mechanism | 1x Mechanism + 2x Iron Ingot | 45s | 3 |
| `ancient_mechanism` | Ancient Mechanism | 1x Ancient Gear + 2x Ancient Ore | 90s | 4 |
| `gunpowder` | Black Powder | 2x Coal + 1x Fossil Fuel | 15s | 2 |

---

## 5. Equipment

### Slots & Hand System

| Slot | Description | Slot Type |
|------|-------------|-----------|
| Head | Helmets, hoods, masks | Armor/Clothes |
| Chest | Vests, coats, armor | Armor/Clothes |
| Legs | Pants, greaves | Armor/Clothes |
| Hands | Gloves, gauntlets | Armor |
| Left Hand | 1H weapon, shield, or empty | Weapon |
| Right Hand | 1H/2H weapon | Weapon |
| Tool | Mining pick, hatchet | Tool |

### Quality Formula
```
finalStat = baseStat * (quality / 100)
```
- 50% quality = 0.5x stats
- 100% quality = 1.0x stats (normal)
- 150% quality = 1.5x stats

---

### Equipment Tables

#### Head Slot

| ID | Name | Tier | Stats (Base) | Recipe | Set |
|----|------|------|--------------|--------|-----|
| `trench_hood` | Trench Hood | 1 | +3 Armor | 2x Leather | Trench |
| `iron_helm` | Iron Helm | 2 | +8 Armor | 2x Iron Ingot + 1x Leather | Vanguard |
| `gas_mask` | Gas Mask | 2 | +5 Armor, +Poison Resist | 1x Leather + 1x Mechanism | - |
| `bone_crown` | Bone Crown | 3 | +10 Armor, +5% Crit | 3x Bone Charm + 1x Sinew | Primal |
| `storm_helm` | Storm Helm | 4 | +18 Armor | 3x Hardened Steel + 1x Thick Leather | Siege |

#### Chest Slot

| ID | Name | Tier | Stats (Base) | Recipe | Set |
|----|------|------|--------------|--------|-----|
| `trench_coat` | Trench Coat | 1 | +5 Armor | 3x Leather | Trench |
| `flak_vest` | Flak Vest | 2 | +12 Armor | 3x Reinforced Plate + 2x Leather | Vanguard |
| `raptor_vest` | Raptor-Hide Vest | 2 | +8 Armor, +5% Speed | 4x Leather + 1x Sinew | Primal |
| `siege_plate` | Siege Plate | 4 | +25 Armor | 4x Hardened Steel + 2x Thick Leather | Siege |

#### Ranged Weapons (1H or 2H)

| ID | Name | Hands | Tier | Stats (Base) | Recipe |
|----|------|-------|------|--------------|--------|
| `pistol` | Trench Pistol | 1H | 1 | 8 Damage, 2.0 Rate | 2x Scrap Plate + 1x Mechanism |
| `revolver` | Service Revolver | 1H | 2 | 12 Damage, 1.5 Rate | 2x Iron Ingot + 1x Precision Mech |
| `rifle` | Bolt Rifle | 2H | 2 | 18 Damage, 1.0 Rate | 3x Iron Ingot + 2x Mechanism + 1x Petrified Wood |
| `shotgun` | Trench Sweeper | 2H | 3 | 25 Damage, 0.7 Rate | 3x Steel Ingot + 1x Precision Mech |
| `ancient_rifle` | Relic Rifle | 2H | 4 | 35 Damage, 1.2 Rate | 2x Hardened Steel + 1x Ancient Mechanism |

#### Melee Weapons (1H or 2H)

| ID | Name | Hands | Tier | Stats (Base) | Recipe |
|----|------|-------|------|--------------|--------|
| `trench_knife` | Trench Knife | 1H | 1 | 6 Damage, 3.0 Rate | 1x Scrap Plate |
| `combat_sword` | Combat Sword | 1H | 2 | 12 Damage, 2.0 Rate | 2x Iron Ingot + 1x Leather |
| `raptor_blade` | Raptor-Tooth Blade | 1H | 2 | 10 Damage, 2.5 Rate, +10% Crit | 2x Bone + 2x Sinew + 1x Iron Ingot |
| `shield` | Trench Shield | 1H (Off) | 2 | +15 Block | 3x Reinforced Plate + 1x Leather |
| `war_club` | War Club | 2H | 2 | 20 Damage, 1.2 Rate | 3x Petrified Wood + 2x Iron Ingot |
| `greatsword` | Knight's Greatsword | 2H | 3 | 28 Damage, 1.0 Rate | 4x Steel Ingot + 1x Thick Leather |
| `apex_blade` | Apex Predator | 2H | 4 | 40 Damage, 1.3 Rate, +15% Crit | 3x Hardened Steel + 1x Apex Flesh |

#### Tools

| ID | Name | Tier | Stats (Base) | Recipe |
|----|------|------|--------------|--------|
| `trench_shovel` | Trench Shovel | 1 | 5 Mining Power | 2x Scrap Metal + 1x Petrified Wood |
| `iron_pick` | Iron Pick | 2 | 12 Mining Power | 2x Iron Ingot + 1x Petrified Wood |
| `steel_pick` | Steel Pick | 3 | 20 Mining Power | 2x Steel Ingot + 1x Hardened Steel |
| `ancient_pick` | Ancient Pick | 4 | 35 Mining Power, +10% Rare Node | 1x Hardened Steel + 1x Ancient Mechanism |

---

## 6. Equipment Sets

| Set ID | Name | 2pc Bonus | 3pc Bonus | 4pc Bonus |
|--------|------|-----------|-----------|-----------|
| `trench` | Trench Gear | +5% Speed | +10 Armor | - |
| `vanguard` | Vanguard Armor | +10 Armor | +10% HP | +5% Damage Resist |
| `primal` | Primal Hunter | +10% Crit | +15% Speed | +20% Damage to Dinos |
| `siege` | Siege Plate | +15 Armor | +20 Armor | Immune to Stagger |

---

## 7. Loot Tables (Enemy Drops)

### Dinosaurs (Passive Zone Dinos - killed for resources)

| Dino | Zone | Drops |
|------|------|-------|
| Compy | Quarry | 80% Raw Meat (1-2) |
| Velociraptor | Iron Ridge | 100% Primal Meat (1), 40% Raptor Hide (1), 15% Bone (1) |
| Triceratops | Mud Flats | 100% Fossil Fuel (2), 30% Rex Hide (1) |
| Ankylosaurus | Scrap Yard | 100% Scrap Metal (2-3), 20% Iron Ore (1) |
| T-Rex | Mud Flats | 100% Prime Cut (1-2), 60% Rex Hide (1), 25% Sinew (1) |

### Enemies (Hostile - drop combat loot)

| Enemy | Zone | Drops |
|-------|------|-------|
| **Feral Compy** | Quarry | 60% Raw Meat (1), 15% Bone (1) |
| **Scavenger Soldier** | Scrap Yard | 50% Scrap Metal (1), 30% Copper Wire (1), 10% Mechanism (50% quality) |
| **Feral Raptor** | Iron Ridge | 80% Primal Meat (1), 40% Raptor Hide (1), 10% Bone Charm (60% quality) |
| **Trench Deserter** | Iron Ridge | 40% Gunpowder (1), 30% Scrap Plate (1), 15% Trench Knife (50% quality) |
| **Forest Marauder** | Dead Woods | 50% Petrified Wood (1), 30% Leather (1), 10% Combat Sword (60% quality) |
| **Feral Spitter** | Dead Woods | 70% Resin (1), 40% Bone (1), 20% Primal Meat (1) |
| **Rogue Bandits** | Crossroads | 60% Mixed Resources (1-2), 20% Pistol (50% quality) |
| **Swamp Infantry** | Mud Flats | 50% Fossil Fuel (1), 30% Gunpowder (1), 15% Revolver (70% quality) |
| **Feral Rex** | Mud Flats | 100% Prime Cut (2), 50% Rex Hide (1), 30% Sinew (1) |
| **Bone Collectors** | Bone Valley | 70% Bone (2), 40% Obsidian (1), 20% Bone Charm (80% quality) |
| **Alpha Raptor** (Boss) | Bone Valley | 100% Apex Flesh (1), 100% Sinew (2), 50% Raptor-Tooth Blade (120% quality) |
| **Ruin Wardens** | Ruins | 60% Ancient Gear (1), 30% Relic Shard (1), 20% Precision Mech (1) |
| **Ancient Guardian** (Boss) | Ruins | 100% Ancient Mechanism (1), 100% Relic Shard (2), 50% Relic Rifle (130% quality) |

---

## 8. Progression Chart

```
TIER 1 (Quarry/Scrap)          TIER 2 (Iron/Woods)           TIER 3 (Mud/Bone)          TIER 4 (Ruins)
═══════════════════            ═══════════════════           ═══════════════════        ════════════════
Stone, Scrap Metal   ──────►   Iron Ore, Coal      ──────►   Gold, Obsidian   ──────►   Ancient Ore
Raw Meat, Copper     ──────►   Primal Meat, Hide   ──────►   Prime Cut, Sinew ──────►   Apex Flesh
       │                              │                             │                         │
       ▼                              ▼                             ▼                         ▼
Scrap Plate             ──────►   Iron Ingot        ──────►   Steel Ingot      ──────►   Hardened Steel
Mechanism               ──────►   Leather           ──────►   Thick Leather    ──────►   Ancient Mechanism
       │                              │                             │                         │
       ▼                              ▼                             ▼                         ▼
Trench Gear (T1)        ──────►   Vanguard Set (T2) ──────►   Primal Set (T3)  ──────►   Siege Set (T4)
Pistol, Knife           ──────►   Rifle, Sword      ──────►   Shotgun, Greatsword ──►   Relic Weapons
```

---

## Next Steps

1. **Review this document** for thematic and balance issues
2. **Approve** the progression structure
3. **Phase 2**: Create `LootConfig.js` with all data
4. **Phase 2**: Update crafting system with new recipes
5. **Phase 2**: Implement equipment quality system
