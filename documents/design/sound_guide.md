# Jurassic Knights: Valley — Sound Design Guide

**Single source of truth for audio ("Mud & Steel Sounds").**

---

## Core Aesthetic

Low-frequency, analog, grounded. No bright 8-bit bleeps.
**Reference**: `restMelody()` in `SFX_Core.ts` - the benchmark for thematic audio.

---

## Synthesis Principles

| Guideline | Do | Don't |
| :--- | :--- | :--- |
| **Waveforms** | Triangle, Sawtooth (warm, analog) | Pure Sine (too clean) |
| **Frequency Range** | Low (60-300Hz base), Mid (300-800Hz accents) | High-pitched (>1000Hz lead) |
| **Key/Mode** | Minor, Dorian, Pentatonic (somber) | Major (too cheerful) |
| **Tempo** | Slow, deliberate (300-500ms gaps) | Fast arpeggios (<150ms) |
| **Layering** | Drone + Melody + Noise texture | Single isolated tones |

---

## Sound Categories

### UI Sounds
- **Clicks**: Mechanical switches, not blips. Low thud (60-150Hz drop).
- **Unlocks**: Hydraulic hiss + servo sweep. Industrial.
- **Errors**: Dull clunk. Low square wave (55Hz).

### Combat Sounds
- **Impacts**: Material-specific (Wood thud, Stone crack, Metal clang).
- **Swings**: Filtered noise whoosh (200→600Hz sweep).
- **Shots**: Deep thump (120→40Hz) + muzzle blast noise.

### Ambient/Weather
- **Rain/Storm**: Filtered white noise, very subtle (0.015 gain).
- **Thunder**: Deep rumble (400→100Hz filter sweep), loud (0.4 gain).
- **Wind**: Bandpass noise (400Hz) with LFO modulation.

### Melodic (Rest, Victory, etc.)
- **Reference**: `restMelody()` - D minor pentatonic, triangle waves, 350ms note gaps.
- **Always include**: Low drone underneath (D2/73Hz), soft noise texture.
- **Chord resolution**: Minor or modal (avoid major triads).

---

## Technical Standards

- **Ambient Loops**: 0.015 gain (subtle background).
- **One-shots**: 0.1-0.3 gain (action feedback).
- **Dramatic events**: 0.4+ gain (thunder, impacts).
- **Always guard** for `this.ctx === null` before synthesis.
