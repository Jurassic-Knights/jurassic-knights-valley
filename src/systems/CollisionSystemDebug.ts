/**
 * CollisionSystemDebug – Debug rendering for collision hitboxes and terrain blocks.
 */
import { Logger } from '../core/Logger';
import { Entity } from '../core/Entity';
import { GameConstants } from '../data/GameConstants';
import { EntityTypes } from '../config/EntityTypes';
import { CollisionLayers } from '../components/CollisionComponent';
import { WorldManager } from '../world/WorldManager';

import type { IEntity } from '../types/core';

export interface CollisionDebugData {
    debugMode: boolean;
    entities: Entity[];
    getCollisionBounds: (entity: Entity) => { x: number; y: number; width: number; height: number };
}

function drawTerrainDebug(ctx: CanvasRenderingContext2D): void {
    if (!WorldManager?.collisionBlocks) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';

    for (const block of WorldManager.collisionBlocks) {
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeRect(block.x, block.y, block.width, block.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
    if (WorldManager.walkableZones) {
        for (const zone of WorldManager.walkableZones) {
            if (zone.type === 'bridge') {
                ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            }
        }
    }
}

/**
 * Render collision debug info (terrain blocks + entity hitboxes).
 * Context should already be translated to World View.
 */
export function renderCollisionDebug(ctx: CanvasRenderingContext2D, data: CollisionDebugData): void {
    if (!data.debugMode) return;

    const logRate = GameConstants.CollisionDebug.LOG_SAMPLE_RATE;
    if (Math.random() < logRate) {
        const activeWithCol = data.entities.filter((e) => e.active && e.collision).length;
        Logger.info(`[CollisionSystem] Rendering... Entities: ${data.entities.length}, Drawable: ${activeWithCol}`);
        if (activeWithCol > 0) {
            const sample = data.entities.find((e) => e.active && e.collision);
            if (sample) Logger.info(`[CollisionSystem] Sample: ${sample.id} at ${sample.x},${sample.y}`);
        }
    }

    drawTerrainDebug(ctx);

    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2;
    let loggedOne = false;

    for (const entity of data.entities) {
        if (!entity.active) continue;

        const col = entity.collision;
        if (!col || !col.enabled) continue;

        const bounds = data.getCollisionBounds(entity);

        if (!loggedOne && Math.random() < logRate) {
            Logger.info(`[CollisionSystem] Drawing ${entity.id} at [${Math.floor(bounds.x)}, ${Math.floor(bounds.y)}] size [${bounds.width}x${bounds.height}] color: ${entity.entityType === EntityTypes.HERO ? 'GREEN' : 'OTHER'}`);
            loggedOne = true;
        }

        if (entity.entityType === EntityTypes.HERO) {
            ctx.strokeStyle = '#00FF00';
        } else if (col.layer === CollisionLayers.ENEMY) {
            ctx.strokeStyle = '#FF0000';
        } else if (col.isTrigger) {
            ctx.strokeStyle = '#FFFF00';
        } else {
            ctx.strokeStyle = '#FFFFFF';
        }

        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        if ('inputMove' in entity) {
            const move = (entity as IEntity & { inputMove?: { x: number; y: number } }).inputMove;
            if (move && (move.x !== 0 || move.y !== 0)) {
                ctx.beginPath();
                ctx.moveTo(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
                const scale = GameConstants.CollisionDebug.DIRECTION_VECTOR_SCALE;
                ctx.lineTo(bounds.x + bounds.width / 2 + move.x * scale, bounds.y + bounds.height / 2 + move.y * scale);
                ctx.strokeStyle = 'cyan';
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}
