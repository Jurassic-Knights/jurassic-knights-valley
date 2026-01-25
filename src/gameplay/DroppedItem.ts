/**
 * DroppedItem - Collectible loot entity spawned when resources are destroyed
 *
 * Hero must walk near to pick up.
 *
 * Owner: Director (engine), Gameplay Designer (values)
 */
import { Entity } from '../core/Entity';
import { Tween } from '../animation/Tween';
import { VFXController } from '../vfx/VFXController';
import { ResourceRenderer } from '../rendering/ResourceRenderer';
import { EntityConfig } from '../config/EntityConfig';
import { Resource } from './Resource';
import { EntityTypes } from '../config/EntityTypes';
import { GameConstants, getConfig } from '../data/GameConstants';
import { Registry } from '../core/Registry';


// Unmapped modules - need manual import


class DroppedItem extends Entity {
    // Item identity
    resourceType: string = 'scraps_t1_01';
    amount: number = 1;
    pickupRadius: number = 140;
    customIcon: any = null;
    rarity: string = 'common';
    rarityColor: string = '#BDC3C7';

    // Visual state
    pulseTime: number = 0;

    // Flight animation
    isFlying: boolean = false;
    flightProgress: number = 0;
    z: number = 0;
    maxHeight: number = 40;

    // Magnet behavior
    isMagnetized: boolean = false;
    magnetTarget: any = null;
    magnetSpeed: number = 100;
    magnetAcceleration: number = 500;

    // Trail effect
    trailHistory: any[] = [];
    maxTrailLength: number = 15;

    // Pickup timing
    age: number = 0;
    landedTime: number | null = null;
    postLandDelay: number = 0.5;
    minPickupTime: number = 0.8;

    constructor(config: any = {}) {
        // 1. Load Config
        const defaults = EntityConfig ? EntityConfig.droppedItem.defaults : {};
        const finalConfig = { ...defaults, ...config };

        super({
            entityType: EntityTypes.DROPPED_ITEM,
            width: finalConfig.width || 108,
            height: finalConfig.height || 108,
            ...config
        });

        this.resourceType = config.resourceType || 'scraps_t1_01';
        this.amount = config.amount || 1;
        this.pickupRadius =
            finalConfig.pickupRadius || getConfig().Interaction?.DROPPED_ITEM_PICKUP_RADIUS || 50;
        this.customIcon = config.customIcon || null;

        // Visual pulse timer
        this.pulseTime = 0;

        // Set color based on type (same as resource)
        this.color =
            Resource && Resource.COLORS ? Resource.COLORS[this.resourceType] : '#888888';

        // Determine rarity
        const typeConfig = EntityConfig.resources?.[this.resourceType] || {};
        this.rarity = typeConfig.rarity || 'common';

        this.rarityColor =
            Resource && Resource.RARITY_COLORS
                ? Resource.RARITY_COLORS[this.rarity]
                : '#BDC3C7';

        // Flight animation props
        this.isFlying = false;
        this.flightProgress = 0; // 0 to 1
        this.z = 0; // Height off ground
        this.maxHeight = 40; // Peak flight height

        // Magnet behavior
        this.isMagnetized = false;
        this.magnetTarget = null;

        // REWRITE: Gentle pull (visual collect)
        this.magnetSpeed = finalConfig.magnetSpeed || 100;
        this.magnetAcceleration = finalConfig.magnetAcceleration || 500;

        this.trailHistory = []; // [ {x, y, z} ]
        this.maxTrailLength = 15;

        // Pickup Delay
        this.age = 0;
        this.landedTime = null; // Set when flight finishes
        this.postLandDelay = 0.5; // Wait 0.5s after landing
        // Use config (SpawnManager) or default
        this.minPickupTime = config.minPickupTime !== undefined ? config.minPickupTime : 0.8;
    }

    /**
     * Start flying towards a target (magnet effect)
     * @param {Entity} target
     */
    magnetize(target) {
        if (!this.active || this.isMagnetized) return;
        this.isMagnetized = true;
        this.magnetTarget = target;
        // visual pop - lift off ground immediately
        this.z = 20;
        this.trailHistory = []; // Reset trail
    }

    /**
     * Start flight animation from current pos to target
     * @param {number} targetX
     * @param {number} targetY
     */
    flyTo(targetX, targetY) {
        this.isFlying = true;
        this.flightProgress = 0;

        // Tween position and progress
        if (Tween) {
            Tween.to(
                this,
                {
                    x: targetX,
                    y: targetY,
                    flightProgress: 1
                },
                500,
                {
                    easing: 'linear',
                    onComplete: () => this.onLand()
                }
            );
        } else {
            // Fallback if no tween system (snap to end)
            this.x = targetX;
            this.y = targetY;
            this.onLand();
        }
    }

    /**
     * Handle landing logic
     */
    onLand() {
        this.isFlying = false;
        this.z = 0;
        this.landedTime = this.age; // Mark landing time

        if (VFXController) {
            // 1. Dust Cloud (Background)
            VFXController.playBackground(this.x, this.y, {
                color: '#B0A090',
                count: 8,
                lifetime: 700,
                speed: 3.5,
                drag: 0.9,
                gravity: -0.02,
                bias: 'up',
                size: 7
            });

            // 2. Resource Debris (Foreground)
            VFXController.playForeground(this.x, this.y, {
                color: this.color,
                type: 'debris',
                count: 10,
                lifetime: 600,
                speed: 5.5,
                drag: 0.96,
                gravity: 0.25,
                bias: 'up',
                size: 5
            });

            // 3. Small Spark/Highlight (Foreground)
            VFXController.playForeground(this.x, this.y, {
                color: '#FFFFFF',
                type: 'spark',
                count: 5,
                lifetime: 250,
                speed: 7,
                drag: 0.9,
                size: 4
            });
        }
    }

    /**
     * Update item (pulse animation)
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        super.update(dt); // Call parent update for active/inactive logic

        // REWRITE: Robust dt handling
        let safeDt = dt;
        if (!safeDt || isNaN(safeDt) || safeDt <= 0) safeDt = 16.6; // Fallback to 60fps
        if (safeDt > 100) safeDt = 100; // Cap lag spikes at 100ms

        const dtSec = safeDt / 1000;

        this.pulseTime += dtSec;
        this.age += dtSec;

        // Magnet Logic
        if (this.isMagnetized && this.magnetTarget) {
            const dx = this.magnetTarget.x - this.x;
            const dy = this.magnetTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Add current pos to history before moving
            this.trailHistory.push({ x: this.x, y: this.y, z: this.z });
            if (this.trailHistory.length > this.maxTrailLength) {
                this.trailHistory.shift();
            }

            if (dist < 20) {
                // Strict arrival threshold
                // Acknowledge arrival logic
                // Usually InteractionSystem collects it, but we snap here visually
                this.x = this.magnetTarget.x;
                this.y = this.magnetTarget.y;
            } else {
                // Move towards target
                const angle = Math.atan2(dy, dx);

                // REWRITE: Physics integration
                // v = v0 + a*t
                this.magnetSpeed += this.magnetAcceleration * dtSec;
                // d = v*t
                let moveDist = this.magnetSpeed * dtSec;

                // FIX: Cap movement to remaining distance to prevent overshooting
                if (moveDist > dist) {
                    moveDist = dist;
                }

                this.x += Math.cos(angle) * moveDist;
                this.y += Math.sin(angle) * moveDist;

                // REWRITE: Fixed Z height - no more hopping/bobbing
                // Smoothly lerp z to target height (20) if not there
                const targetZ = 20;
                this.z += (targetZ - this.z) * 10 * dtSec;
            }
            return; // Skip normal update flight logic if magnetized
        }

        // Calculate height arc if flying (parabolic spawn flight)
        if (this.isFlying) {
            // Parabolic arc: sin(0..PI) * maxHeight
            this.z = Math.sin(this.flightProgress * Math.PI) * this.maxHeight;
        } else {
            // Rest on ground
            this.z = 0;
        }
    }

    /**
     * Check if item should start flying to hero (auto-pickup range)
     * @param {Hero} hero
     */
    shouldAutoMagnetize(hero) {
        if (!this.active || !hero) return false;
        if (this.isMagnetized || this.isFlying) return false;

        // Passive pickup follows delay (player walking near)
        // Must be landed for at least postLandDelay
        if (this.landedTime === null || this.age < this.landedTime + this.postLandDelay)
            return false;

        return this.distanceTo(hero) < this.pickupRadius;
    }

    /**
     * Check if hero can finalize pickup (must be strictly close)
     * @param {Hero} hero
     * @returns {boolean}
     */
    canBePickedUpBy(hero) {
        if (!this.active || !hero) return false;

        // 1. Check flight status
        if (this.isFlying && !this.isMagnetized) return false; // Wait for initial fly animation

        // 2. Check minimum age (Manual pickup only)
        // Magnets bypass this delay
        if (
            !this.isMagnetized &&
            (this.landedTime === null || this.age < this.landedTime + this.postLandDelay)
        )
            return false;

        // Strict proximity
        return this.distanceTo(hero) < 20;
    }

    /**
     * Render dropped item
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.active) return;

        // Delegate to System
        if (ResourceRenderer && typeof ResourceRenderer.renderDroppedItem === 'function') {
            ResourceRenderer.renderDroppedItem(ctx, this);
        } else {
            // Fallback (Minimal) if System not ready
            ctx.save();
            ctx.fillStyle = this.color || '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ES6 Module Export
export { DroppedItem };
