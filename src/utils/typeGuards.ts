import { IEntity } from '../types/core';

export interface RenderableEntity extends IEntity {
    render(ctx: CanvasRenderingContext2D): void;
}

export interface ShadowCaster extends IEntity {
    drawShadow(ctx: CanvasRenderingContext2D, isDebug: boolean): void;
}

export function isRenderable(entity: IEntity): entity is RenderableEntity {
    return 'render' in entity && typeof (entity as unknown as RenderableEntity).render === 'function';
}

export function isShadowCaster(entity: IEntity): entity is ShadowCaster {
    return 'drawShadow' in entity && typeof (entity as unknown as ShadowCaster).drawShadow === 'function';
}

export interface DamageableEntity extends IEntity {
    takeDamage(amount: number, source?: IEntity | null): void;
}

export interface MortalEntity extends IEntity {
    die(killer?: IEntity | null): void;
}

export function isDamageable(entity: IEntity): entity is DamageableEntity {
    return 'takeDamage' in entity && typeof (entity as unknown as DamageableEntity).takeDamage === 'function';
}

export function isMortal(entity: IEntity): entity is MortalEntity {
    return 'die' in entity && typeof (entity as unknown as MortalEntity).die === 'function';
}
