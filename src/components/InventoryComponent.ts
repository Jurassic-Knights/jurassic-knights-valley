/**
 * InventoryComponent - Manages Entity Inventory
 */
class InventoryComponent extends Component {
    constructor(parent: any, config: any = {}) {
        super(parent);
        this.items = {};
        this.capacity = config.capacity || 20;

        if (config.items) {
            for (const [key, qty] of Object.entries(config.items)) {
                this.add(key, qty as number);
            }
        }
    }

    add(itemId: string, amount: number) {
        if (!this.items[itemId]) this.items[itemId] = 0;
        this.items[itemId] += amount;

        if (this.parent.id === 'hero' && GameState) {
            if (EventBus) {
                EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, this.items);
            }
        }
    }

    remove(itemId: string, amount: number) {
        if (!this.items[itemId] || this.items[itemId] < amount) return false;
        this.items[itemId] -= amount;

        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, this.items);
        }
        return true;
    }

    has(itemId: string, amount: number) {
        return (this.items[itemId] || 0) >= amount;
    }
}

if (Registry) Registry.register('InventoryComponent', InventoryComponent);

export { InventoryComponent };
