---
description: How to add new procedural sounds to SFX_Core
---

# Adding New Sounds to SFX

## Rules
1. **Always use `this.TARGET_VOLUME`** for peak gain values - never hardcode 0.3, 0.5, etc.
2. Use `playNoise()` and `playTone()` helpers when possible - they auto-apply TARGET_VOLUME
3. For creature sounds, use the unique sound system with type/tier/seed

## Adding a New Creature Sound Type

1. Update regex in `parseCreatureSoundId()`:
   ```js
   const match = id.match(/^sfx_(aggro|hurt|death|spawn|flee|NEW_TYPE)_...$/);
   ```

2. Add case in `play()` switch:
   ```js
   case 'NEW_TYPE': this.uniqueCreatureNewType(creatureType, tier, seed); return;
   ```

3. Create function using TARGET_VOLUME:
   ```js
   uniqueCreatureNewType(creatureType, tier, seed) {
       const gain = this.ctx.createGain();
       gain.gain.setValueAtTime(this.TARGET_VOLUME, this.ctx.currentTime);
       // ... rest of sound
   }
   ```

## Adding a New UI/Generic Sound

1. Add handler in `play()` handlers object
2. Create function using TARGET_VOLUME for all gain peaks
