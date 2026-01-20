# Stat Mechanics Design Document

## Overview
This document defines the intended mechanics for all equipment and combat stats.

---

## Combat Stats

### Damage
- **Type**: Number
- **Effect**: Base damage dealt per hit
- **Formula**: `finalDamage = (weaponDamage + bonusDamage) * critMultiplier - targetArmor`

### Attack Rate
- **Type**: Number (attacks per second)
- **Effect**: How fast the entity attacks
- **Default**: 1.0

### Attack Speed
- **Type**: Number (percentage bonus)
- **Effect**: Multiplies attack rate
- **Formula**: `effectiveRate = attackRate * (1 + attackSpeed/100)`

### Crit Chance
- **Type**: Number (0-100%)
- **Effect**: Chance for critical hit (2x damage)
- **Roll**: On each attack, roll 1-100. If roll ≤ critChance, crit

### Range
- **Type**: Number (pixels)
- **Effect**: Attack reach distance - ALL weapons have range
- **Melee Examples**:
  - Dagger/Knife: 50px
  - Sword: 80px
  - Spear/Polearm: 120px
- **Ranged Examples**:
  - Pistol: 300px
  - Rifle: 500px
  - Sniper: 800px

---

## Defense Stats

### Armor
- **Type**: Number
- **Effect**: Flat damage reduction
- **Formula**: `damageTaken = max(1, incomingDamage - armor)`
- **Note**: Minimum 1 damage always applies

### Block
- **Type**: Number
- **Effect**: Shield-specific damage absorption
- **Mechanic**: When blocking, absorb up to `block` damage before health is affected
- **Cooldown**: Block recharges over 3 seconds after being depleted

---

## Utility Stats

### Speed
- **Type**: Number (pixels/second or % bonus)
- **Effect**: Movement speed modifier
- **Formula**: `effectiveSpeed = baseSpeed * (1 + speed/100)`
- **Can be negative**: Heavy armor may have -10 speed

### Mining Power
- **Type**: Number
- **Effect**: Harvesting efficiency for resource nodes
- **Formula**: `harvestTime = nodeBaseTime / miningPower`

---

## Resistances

### Cold Resist
- **Type**: Number (0-100%)
- **Effect**: Reduces cold damage/slow duration
- **Formula**: `coldDamage = baseDamage * (1 - coldResist/100)`

### Heat Resist
- **Type**: Number (0-100%)
- **Effect**: Reduces fire damage
- **Formula**: `fireDamage = baseDamage * (1 - heatResist/100)`

### Poison Resist
- **Type**: Number (0-100%)
- **Effect**: Reduces poison damage, shortens poison duration
- **Formula**: `poisonDuration = baseDuration * (1 - poisonResist/100)`

---

## Special Effects

### Stagger
- **Type**: Boolean
- **Effect**: On hit, interrupts target's attack animation
- **Duration**: Target stunned for 0.5 seconds
- **Cooldown**: Can only proc once every 3 seconds per target

### Bleed
- **Type**: Boolean
- **Effect**: On hit, applies bleed DoT
- **Damage**: 20% of hit damage over 3 seconds (tick every 0.5s)
- **Stacks**: Up to 3 bleed stacks

### Armor Pierce
- **Type**: Boolean
- **Effect**: Attack ignores 50% of target's armor
- **Formula**: `effectiveArmor = targetArmor * 0.5`

### Spread
- **Type**: Boolean
- **Effect**: Attack hits multiple targets in a cone
- **Angle**: 30° cone, hits up to 3 targets
- **Falloff**: Secondary targets take 70% damage

### Double Strike
- **Type**: Boolean
- **Effect**: Chance to attack twice
- **Proc Chance**: 25%
- **Second hit**: Deals 50% damage

### Execute Bonus
- **Type**: Boolean
- **Effect**: Bonus damage to low HP targets
- **Threshold**: Target below 25% HP
- **Bonus**: +50% damage

---

## Implementation Priority

1. **Phase 1** (Core): damage, armor, attackRate, speed
2. **Phase 2** (Combat): critChance, block, stagger
3. **Phase 3** (DoT/Effects): bleed, armorPierce, thorns
4. **Phase 4** (Utility): resistances, miningPower, spread, doubleStrike, executeBonus, authority
