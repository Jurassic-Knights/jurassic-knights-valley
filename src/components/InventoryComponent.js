/**
 * InventoryComponent - Manages Entity Inventory
 */
class InventoryComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        this.items = {}; // { itemId: quantity }
        this.capacity = config.capacity || 20;

        // Pre-fill
        if (config.items) {
            for (const [key, qty] of Object.entries(config.items)) {
                this.add(key, qty);
            }
        }
    }

    /**
     * Add item to inventory
     * @param {string} itemId
     * @param {number} amount
     */
    add(itemId, amount) {
        if (!this.items[itemId]) this.items[itemId] = 0;
        this.items[itemId] += amount;

        // Sync to Global State if Hero
        if (this.parent.id === 'hero' && window.GameState) {
            // Update GameState (which triggers UI)
            // Or emit event directly?
            // Better: InventoryComponent emits 'INVENTORY_UPDATED' event
            // And GameState listens to it? Or GameState IS the source?

            // Design Choice: GameState holds the canonical data for the Hero?
            // OR GameState copies it for UI?
            // Let's have InventoryComponent emit event and GameState update itself.
            if (window.EventBus) {
                EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, this.items);
            }
        }
    }

    /**
     * Remove item from inventory
     * @param {string} itemId
     * @param {number} amount
     */
    remove(itemId, amount) {
        if (!this.items[itemId] || this.items[itemId] < amount) return false;

        this.items[itemId] -= amount;

        if (this.parent.id === 'hero' && window.EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, this.items);
        }
        return true;
    }

    /**
     * Check if has enough item
     */
    has(itemId, amount) {
        return (this.items[itemId] || 0) >= amount;
    }
}

window.InventoryComponent = InventoryComponent;
if (window.Registry) Registry.register('InventoryComponent', InventoryComponent);

