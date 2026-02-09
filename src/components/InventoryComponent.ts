/**
 * InventoryComponent - Data-only inventory state.
 * Callers (e.g. InteractionSystem) mutate via add/remove and emit INVENTORY_UPDATED.
 */
import { Component } from '@core/Component';
import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import type { IEntity } from '../types/core';

class InventoryComponent extends Component {
    items: Record<string, number> = {};
    capacity: number = 20;

    constructor(parent: IEntity | null, config: Record<string, unknown> = {}) {
        super(parent);
        this.items = {};
        this.capacity = (config.capacity as number) ?? GameConstants.Components.INVENTORY_CAPACITY;
        if (config.items) {
            for (const [key, qty] of Object.entries(config.items)) {
                if (!this.items[key]) this.items[key] = 0;
                this.items[key] += qty as number;
            }
        }
    }

    add(itemId: string, amount: number) {
        if (!this.items[itemId]) this.items[itemId] = 0;
        this.items[itemId] += amount;
    }

    remove(itemId: string, amount: number): boolean {
        if (!this.items[itemId] || this.items[itemId] < amount) return false;
        this.items[itemId] -= amount;
        return true;
    }

    has(itemId: string, amount: number) {
        return (this.items[itemId] || 0) >= amount;
    }
}

if (Registry) Registry.register('InventoryComponent', InventoryComponent);

export { InventoryComponent };
