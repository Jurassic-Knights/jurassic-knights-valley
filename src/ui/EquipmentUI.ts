/**
 * EquipmentUI - Fullscreen equipment management screen (Core)
 * 
 * Delegates to:
 * - EquipmentUIRenderer: All HTML/template rendering
 * - EquipmentSlotManager: Equip/unequip/slot logic
 * 
 * Owner: UI Engineer
 */

// Ambient declarations for global dependencies
declare const GameConstants: any;
declare const UIManager: any;
declare const Logger: any;
declare const EquipmentSlotManager: any;
declare const GameInstance: any;
declare const EventBus: any;
declare const EntityLoader: any;
declare const EquipmentUIRenderer: any;
declare const AssetLoader: any;
declare const EntityRegistry: any;
declare const HeroRenderer: any;
declare const Registry: any;

class EquipmentUI {
    // Property declarations
    isOpen: boolean;
    selectedMode: string;
    selectedCategory: string;
    selectedItem: any;
    container: HTMLElement | null;
    cachedEquipment: any[];
    lastClickedItemId: string | null;
    lastClickTime: number;
    slotSelectionMode: boolean;
    pendingEquipItem: any;
    targetEquipSet: number;
    originalFooterConfigs: any;
    slots: string[];
    toolSlots: string[];
    modeCategories: Record<string, { id: string; label: string }[]>;

    constructor() {
        this.isOpen = false;
        this.selectedMode = 'armor';  // armor, weapon, tool
        this.selectedCategory = 'all';
        this.selectedItem = null;
        this.container = null;
        this.cachedEquipment = [];

        // Double-click detection (manual because DOM rebuilds break native dblclick)
        this.lastClickedItemId = null;
        this.lastClickTime = 0;

        // Slot selection mode (when both weapon slots are full)
        this.slotSelectionMode = false;
        this.pendingEquipItem = null;

        // Target weapon set for equipping (1 or 2)
        this.targetEquipSet = 1;

        // Original footer button configs (saved on open, restored on close)
        this.originalFooterConfigs = null;

        // Use centralized slot definitions from GameConstants
        const equipCfg = GameConstants?.Equipment || {};
        this.slots = equipCfg.ALL_SLOTS || ['head', 'body', 'hands', 'legs', 'accessory', 'hand1', 'hand2', 'accessory2'];
        this.toolSlots = equipCfg.TOOL_SLOTS || ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'];

        // Mode-specific category filters
        this.modeCategories = {
            armor: [
                { id: 'all', label: 'ALL' },
                { id: 'head', label: 'HEAD' },
                { id: 'body', label: 'BODY' },
                { id: 'hands', label: 'HANDS' },
                { id: 'legs', label: 'LEGS' },
                { id: 'accessory', label: 'ACCESSORY' }
            ],
            weapon: [
                { id: 'all', label: 'ALL' },
                { id: 'melee', label: 'MELEE' },
                { id: 'ranged', label: 'RANGED' },
                { id: 'shield', label: 'SHIELD' },
                { id: '1-hand', label: '1-HAND' },
                { id: '2-hand', label: '2-HAND' }
            ],
            tool: [
                { id: 'all', label: 'ALL' },
                { id: 'mining', label: '?? MINING' },
                { id: 'woodcutting', label: '?? WOODCUT' },
                { id: 'harvesting', label: '?? HARVEST' },
                { id: 'fishing', label: '?? FISHING' }
            ]
        };

        // Defer init until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        // Bind to EQUIP button
        const btnEquip = document.getElementById('btn-equip');
        if (btnEquip) {
            btnEquip.addEventListener('click', () => {
                // Skip if footer is in override mode (equipment/inventory screen has taken over)
                if (btnEquip.dataset.footerOverride) return;
                this.toggle();
            });
        }

        // Create container
        this._createContainer();

        // Register with UIManager for fullscreen exclusivity
        if (UIManager && UIManager.registerFullscreenUI) {
            UIManager.registerFullscreenUI(this);
        }

        Logger.info('[EquipmentUI] Initialized');
    }

    _createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'equipment-screen';
        this.container.className = 'equipment-screen';
        this.container.style.display = 'none';

        // Event delegation handlers
        this.container.addEventListener('click', (e) => this._handleClick(e));
        this.container.addEventListener('dblclick', (e) => this._handleDoubleClick(e));

        // Append to #ui-overlay to constrain to game view
        const uiOverlay = document.getElementById('ui-overlay');
        (uiOverlay || document.body).appendChild(this.container);
    }

    // Event delegation - handles ALL clicks in the container
    _handleClick(e) {
        const target = e.target;

        // Close button
        if (target.closest('#equip-close') || target.closest('#equip-back')) {
            this.close();
            return;
        }

        // Hero portrait click - open skin selector
        if (target.closest('.equip-character')) {
            this._openHeroSkinSelector();
            return;
        }

        // Hero skin selector modal - select skin
        const skinOption = target.closest('.hero-skin-option');
        if (skinOption?.dataset.skinId) {
            this._selectHeroSkin(skinOption.dataset.skinId);
            return;
        }

        // Hero skin selector close
        if (target.closest('.hero-skin-modal-close') || target.closest('.hero-skin-modal-backdrop')) {
            this._closeHeroSkinSelector();
            return;
        }

        // Category tabs
        const tab = target.closest('.equip-tab');
        if (tab?.dataset.category) {
            this.selectedCategory = tab.dataset.category;
            this._render();
            return;
        }

        // Mode buttons (footer)
        const modeBtn = target.closest('.action-btn[data-mode]');
        if (modeBtn?.dataset.mode) {
            this.selectedMode = modeBtn.dataset.mode;
            this.selectedCategory = 'all';
            this.selectedItem = null;
            this._loadEquipment();
            this._render();
            return;
        }

        // Weapon set toggle buttons - also sets active weapon set in game
        const setToggle = target.closest('.set-toggle-btn');
        if (setToggle?.dataset.targetSet) {
            const targetSet = parseInt(setToggle.dataset.targetSet);
            this.targetEquipSet = targetSet;

            // Also set as active weapon set in the game
            const hero = GameInstance?.hero;
            if (hero?.equipment) {
                hero.equipment.activeWeaponSet = targetSet;
                Logger.info(`[EquipmentUI] Active weapon set changed to Set ${targetSet}`);

                // Emit event for stats update
                if (EventBus) {
                    EventBus.emit('WEAPON_SET_CHANGED', { activeSet: targetSet });
                }
            }

            this._render();
            return;
        }

        // Inventory items - manual double-click detection
        const invItem = target.closest('.inventory-item');
        if (invItem?.dataset.id) {
            const itemId = invItem.dataset.id;
            const now = Date.now();
            const DOUBLE_CLICK_THRESHOLD = 400;

            if (itemId === this.lastClickedItemId && (now - this.lastClickTime) < DOUBLE_CLICK_THRESHOLD) {
                // Double-click - EQUIP
                EquipmentSlotManager.equipItem(this, itemId);
                this.lastClickedItemId = null;
                this.lastClickTime = 0;
            } else {
                // First click - SELECT
                this.lastClickedItemId = itemId;
                this.lastClickTime = now;
                this._selectItemNoRender(itemId);
            }
            return;
        }

        // Equipped slots
        const slot = target.closest('.equip-slot');
        if (slot?.dataset.slot) {
            const slotId = slot.dataset.slot;

            // Handle slot selection mode first
            if (EquipmentSlotManager.handleSlotSelection(this, slotId)) return;

            const now = Date.now();
            const DOUBLE_CLICK_THRESHOLD = 400;
            const slotKey = `slot_${slotId}`;

            if (slotKey === this.lastClickedItemId && (now - this.lastClickTime) < DOUBLE_CLICK_THRESHOLD) {
                // Double-click - UNEQUIP
                EquipmentSlotManager.unequipSlot(this, slotId);
                this.lastClickedItemId = null;
                this.lastClickTime = 0;
            } else {
                // First click - SELECT
                this.lastClickedItemId = slotKey;
                this.lastClickTime = now;
                this._selectEquippedSlot(slotId);
            }
        }
    }

    _handleDoubleClick(e) {
        const invItem = e.target.closest('.inventory-item');
        if (invItem?.dataset.id) {
            EquipmentSlotManager.equipItem(this, invItem.dataset.id);
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        // Close other fullscreen UIs first
        if (UIManager && UIManager.closeOtherFullscreenUIs) {
            UIManager.closeOtherFullscreenUIs(this);
        }

        // Sync targetEquipSet with hero's active weapon set
        const hero = GameInstance?.hero;
        if (hero?.equipment?.activeWeaponSet) {
            this.targetEquipSet = hero.equipment.activeWeaponSet;
        }

        // Swap footer buttons to equipment mode
        this._swapFooterToEquipmentMode();

        this.isOpen = true;
        this._loadEquipment();
        this._render();
        this.container.style.display = 'flex';
        Logger.info('[EquipmentUI] Opened');
    }

    close() {
        this.isOpen = false;
        this.container.style.display = 'none';

        // Restore original footer buttons
        this._restoreFooterButtons();

        Logger.info('[EquipmentUI] Closed');
    }

    /**
     * Swap footer buttons to equipment mode
     * ARMOR | WEAPON | (center disabled) | TOOL | BACK
     */
    _swapFooterToEquipmentMode() {
        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');
        const btnMagnet = document.getElementById('btn-magnet');
        const btnContext = document.getElementById('btn-context-action');

        // Save original configs if not already saved
        if (!this.originalFooterConfigs) {
            this.originalFooterConfigs = {
                inventory: {
                    label: btnInventory?.querySelector('.btn-label')?.textContent,
                    iconId: (btnInventory?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnInventory?.onclick
                },
                equip: {
                    label: btnEquip?.querySelector('.btn-label')?.textContent,
                    iconId: (btnEquip?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnEquip?.onclick
                },
                map: {
                    label: btnMap?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMap?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnMap?.onclick
                },
                magnet: {
                    label: btnMagnet?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMagnet?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnMagnet?.onclick
                }
            };
        }

        // Swap to ARMOR button
        if (btnInventory) {
            btnInventory.dataset.footerOverride = 'equipment'; // Block original handler
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = 'ARMOR';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_armor';
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath('ui_icon_armor') || ''}')`;
            }
            btnInventory.classList.toggle('active', this.selectedMode === 'armor');
            btnInventory.onclick = () => { this.selectedMode = 'armor'; this.selectedCategory = 'all'; this._loadEquipment(); this._render(); this._updateFooterActiveStates(); };
        }

        // Swap to WEAPON button
        if (btnEquip) {
            btnEquip.dataset.footerOverride = 'equipment'; // Block original handler
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = 'WEAPON';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_sword';
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath('ui_icon_sword') || ''}')`;
            }
            btnEquip.classList.toggle('active', this.selectedMode === 'weapon');
            btnEquip.onclick = () => { this.selectedMode = 'weapon'; this.selectedCategory = 'all'; this._loadEquipment(); this._render(); this._updateFooterActiveStates(); };
        }

        // Swap to TOOL button
        if (btnMap) {
            btnMap.dataset.footerOverride = 'equipment'; // Block original handler
            const label = btnMap.querySelector('.btn-label');
            const icon = btnMap.querySelector('.btn-icon');
            if (label) label.textContent = 'TOOL';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_pickaxe';
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath('ui_icon_pickaxe') || ''}')`;
            }
            btnMap.classList.toggle('active', this.selectedMode === 'tool');
            btnMap.onclick = () => { this.selectedMode = 'tool'; this.selectedCategory = 'all'; this._loadEquipment(); this._render(); this._updateFooterActiveStates(); };
        }

        // Swap to BACK button
        if (btnMagnet) {
            btnMagnet.dataset.footerOverride = 'equipment'; // Block original handler
            const label = btnMagnet.querySelector('.btn-label');
            const icon = btnMagnet.querySelector('.btn-icon');
            if (label) label.textContent = 'BACK';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_close';
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath('ui_icon_close') || ''}')`;
            }
            btnMagnet.classList.remove('active');
            btnMagnet.onclick = () => this.close();
        }

        // Disable context button while in equipment mode
        if (btnContext) {
            btnContext.classList.remove('active');
            btnContext.classList.add('inactive');
        }

        // Hide weapon swap button while in equipment mode
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = 'none';
    }

    /**
     * Update footer button active states based on selected mode
     */
    _updateFooterActiveStates() {
        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');

        btnInventory?.classList.toggle('active', this.selectedMode === 'armor');
        btnEquip?.classList.toggle('active', this.selectedMode === 'weapon');
        btnMap?.classList.toggle('active', this.selectedMode === 'tool');
    }

    /**
     * Restore footer buttons to original state
     */
    _restoreFooterButtons() {
        if (!this.originalFooterConfigs) return;

        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');
        const btnMagnet = document.getElementById('btn-magnet');
        const btnContext = document.getElementById('btn-context-action');

        // Restore inventory button
        if (btnInventory && this.originalFooterConfigs.inventory) {
            delete btnInventory.dataset.footerOverride; // Re-enable original handler
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.inventory.label;
            if (icon && this.originalFooterConfigs.inventory.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.inventory.iconId;
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.inventory.iconId) || ''}')`;
            }
            btnInventory.classList.remove('active');
            btnInventory.onclick = null; // Event listener handles it
        }

        // Restore equip button
        if (btnEquip && this.originalFooterConfigs.equip) {
            delete btnEquip.dataset.footerOverride; // Re-enable original handler
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.equip.label;
            if (icon && this.originalFooterConfigs.equip.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.equip.iconId;
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.equip.iconId) || ''}')`;
            }
            btnEquip.classList.remove('active');
            btnEquip.onclick = null; // Original toggle() is via addEventListener
        }

        // Restore map button
        if (btnMap && this.originalFooterConfigs.map) {
            delete btnMap.dataset.footerOverride; // Re-enable original handler
            const label = btnMap.querySelector('.btn-label');
            const icon = btnMap.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.map.label;
            if (icon && this.originalFooterConfigs.map.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.map.iconId;
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.map.iconId) || ''}')`;
            }
            btnMap.classList.remove('active');
            btnMap.onclick = null;
        }

        // Restore magnet button
        if (btnMagnet && this.originalFooterConfigs.magnet) {
            delete btnMagnet.dataset.footerOverride; // Re-enable original handler
            const label = btnMagnet.querySelector('.btn-label');
            const icon = btnMagnet.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.magnet.label;
            if (icon && this.originalFooterConfigs.magnet.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.magnet.iconId;
                (icon as HTMLElement).style.backgroundImage = `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.magnet.iconId) || ''}')`;
            }
            btnMagnet.classList.remove('active');
            btnMagnet.onclick = null;
        }

        // Re-enable context button
        if (btnContext) {
            btnContext.classList.remove('inactive');
        }

        // Show weapon swap button again
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = '';

        this.originalFooterConfigs = null;
    }

    _loadEquipment() {
        const allEquipment = EntityLoader?.getAllEquipment?.() || [];

        if (this.selectedMode === 'armor') {
            this.cachedEquipment = allEquipment.filter(e =>
                e.sourceFile === 'head' || e.sourceFile === 'chest' ||
                e.sourceFile === 'hands' || e.sourceFile === 'feet' ||
                e.sourceFile === 'accessory' ||
                e.slot === 'head' || e.slot === 'body' || e.slot === 'hands' ||
                e.slot === 'legs' || e.slot === 'accessory'
            );
        } else if (this.selectedMode === 'weapon') {
            this.cachedEquipment = allEquipment.filter(e =>
                e.weaponType !== undefined || e.sourceFile === 'weapon' || e.slot === 'weapon'
            );
        } else if (this.selectedMode === 'tool') {
            this.cachedEquipment = allEquipment.filter(e =>
                e.sourceFile === 'tool' || e.slot === 'tool'
            );
        } else {
            this.cachedEquipment = allEquipment;
        }

        Logger.info(`[EquipmentUI] Loaded ${this.cachedEquipment.length} items for mode: ${this.selectedMode}`);
    }

    _render() {
        this.container.innerHTML = EquipmentUIRenderer.renderPanel(this);
        EquipmentUIRenderer.loadIcons(this.container);
    }

    _selectItemNoRender(itemId) {
        const item = this.cachedEquipment.find(e => e.id === itemId);
        this.selectedItem = item || null;

        // Update visual selection without DOM rebuild
        this.container.querySelectorAll('.inventory-item').forEach(el => {
            el.classList.toggle('selected', (el as HTMLElement).dataset.id === itemId);
        });

        // Update summary bar
        const nameEl = this.container.querySelector('.item-preview-name');
        const statsRow = this.container.querySelector('.item-stats-row');
        if (item && nameEl) {
            nameEl.textContent = item.name;
            if (statsRow) {
                let statsHtml = '';
                if (item.stats?.damage) statsHtml += `<div class="summary-stat"><span class="stat-icon">??</span> DMG <span>+${item.stats.damage}</span></div>`;
                if (item.stats?.armor) statsHtml += `<div class="summary-stat"><span class="stat-icon">???</span> ARM <span>+${item.stats.armor}</span></div>`;
                if (item.stats?.speed) statsHtml += `<div class="summary-stat"><span class="stat-icon">??</span> SPD <span>+${item.stats.speed}</span></div>`;
                statsRow.innerHTML = statsHtml || '<div class="summary-stat empty">Double-tap to equip</div>';
            }
            this.container.querySelector('.equip-summary-bar')?.classList.add('has-item');
            this.container.querySelector('.equip-summary-bar')?.classList.remove('empty');
        }
    }

    _selectItem(itemId) {
        const item = this.cachedEquipment.find(e => e.id === itemId);
        this.selectedItem = item || null;
        this._render();
    }

    _selectEquippedSlot(slotId) {
        const hero = GameInstance?.hero;
        const equippedItem = hero?.equipment?.getSlot(slotId);

        if (equippedItem) {
            this.selectedItem = equippedItem;

            // Update slot selection highlight
            this.container.querySelectorAll('.equip-slot').forEach(el => {
                el.classList.toggle('selected', (el as HTMLElement).dataset.slot === slotId);
            });

            // Clear inventory selections
            this.container.querySelectorAll('.inventory-item').forEach(el => {
                el.classList.remove('selected');
            });

            // Update summary bar
            const nameEl = this.container.querySelector('.item-preview-name');
            const statsRow = this.container.querySelector('.item-stats-row');
            if (nameEl) {
                nameEl.textContent = equippedItem.name;
                if (statsRow) {
                    let statsHtml = '';
                    if (equippedItem.stats?.damage) statsHtml += `<div class="summary-stat"><span class="stat-icon">??</span> DMG <span>+${equippedItem.stats.damage}</span></div>`;
                    if (equippedItem.stats?.armor) statsHtml += `<div class="summary-stat"><span class="stat-icon">???</span> ARM <span>+${equippedItem.stats.armor}</span></div>`;
                    if (equippedItem.stats?.speed) statsHtml += `<div class="summary-stat"><span class="stat-icon">??</span> SPD <span>+${equippedItem.stats.speed}</span></div>`;
                    statsRow.innerHTML = statsHtml || '<div class="summary-stat empty">Double-tap to unequip</div>';
                }
                this.container.querySelector('.equip-summary-bar')?.classList.add('has-item');
                this.container.querySelector('.equip-summary-bar')?.classList.remove('empty');
            }
        }
    }

    // ============================================
    // HERO SKIN SELECTOR
    // ============================================

    /**
     * Open the hero skin selector modal
     */
    _openHeroSkinSelector() {
        // Get available hero skins from EntityRegistry
        const heroSkins = this._getAvailableHeroSkins();
        const currentSkin = this._getCurrentHeroSkin();

        // Create modal HTML
        const modalHtml = `
            <div class="hero-skin-modal-backdrop"></div>
            <div class="hero-skin-modal">
                <button class="hero-skin-modal-close">?</button>
                <div class="hero-skin-modal-title">Select Hero Skin</div>
                <div class="hero-skin-grid">
                    ${heroSkins.map(skin => `
                        <div class="hero-skin-option ${skin.id === currentSkin ? 'selected' : ''}" data-skin-id="${skin.id}">
                            <div class="hero-skin-image" data-icon-id="${skin.id}"></div>
                            <div class="hero-skin-name">${skin.name}</div>
                        </div>
                    `).join('')}
                    ${heroSkins.length === 0 ? '<div class="hero-skin-empty">No hero skins available</div>' : ''}
                </div>
            </div>
        `;

        // Append to container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'hero-skin-selector';
        modalContainer.className = 'hero-skin-selector-overlay';
        modalContainer.innerHTML = modalHtml;
        this.container.appendChild(modalContainer);

        // Load skin images
        this._loadHeroSkinImages(modalContainer);
    }

    /**
     * Close the hero skin selector modal
     */
    _closeHeroSkinSelector() {
        const modal = this.container.querySelector('#hero-skin-selector');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Select a hero skin
     * @param {string} skinId - The skin ID to select
     */
    _selectHeroSkin(skinId) {
        // Save to hero or localStorage
        const hero = GameInstance?.hero;
        if (hero) {
            hero.selectedSkin = skinId;
        }
        // Also save to localStorage for persistence
        localStorage.setItem('heroSelectedSkin', skinId);

        // Update the character sprite in the UI
        const charSprite = this.container.querySelector('.character-sprite');
        if (charSprite) {
            // Get the image path from EntityRegistry
            const skinData = EntityRegistry?.hero?.[skinId];
            let path = null;
            if (skinData?.files?.clean) {
                path = 'assets/' + skinData.files.clean;
            } else if (skinData?.files?.original) {
                path = 'assets/' + skinData.files.original;
            }
            if (path) {
                (charSprite as HTMLElement).style.backgroundImage = `url(${path})`;
                (charSprite as HTMLElement).style.backgroundSize = 'cover';
                (charSprite as HTMLElement).style.backgroundPosition = 'center';
            }
        }

        // Update HeroRenderer to use new skin
        if (HeroRenderer) {
            HeroRenderer.setSkin(skinId);
        }

        // Emit event for other systems
        if (EventBus) {
            EventBus.emit('HERO_SKIN_CHANGED', { skinId });
        }

        // Close modal
        this._closeHeroSkinSelector();
    }

    /**
     * Get available hero skins from EntityRegistry
     * @returns {Array} Array of {id, name, files} objects
     */
    _getAvailableHeroSkins() {
        // Try to get from EntityRegistry
        if (EntityRegistry?.hero) {
            return Object.values(EntityRegistry.hero).map((skin: any) => ({
                id: skin.id,
                name: skin.name || skin.id,
                files: skin.files
            }));
        }
        // Fallback: just return empty array
        return [];
    }

    /**
     * Get the currently selected hero skin
     * @returns {string} Current skin ID
     */
    _getCurrentHeroSkin() {
        // Check hero first
        const hero = GameInstance?.hero;
        if (hero?.selectedSkin) {
            return hero.selectedSkin;
        }
        // Check localStorage
        return localStorage.getItem('heroSelectedSkin') || 'hero_t1_01';
    }

    /**
     * Load hero skin images in the modal
     * @param {HTMLElement} container - Modal container
     */
    _loadHeroSkinImages(container) {
        const skinImages = container.querySelectorAll('.hero-skin-image[data-icon-id]');
        skinImages.forEach(el => {
            const iconId = el.dataset.iconId;
            // Get image path from EntityRegistry (no leading slash)
            let path = null;
            const skinData = EntityRegistry?.hero?.[iconId];
            if (skinData?.files?.clean) {
                path = 'assets/' + skinData.files.clean;
            } else if (skinData?.files?.original) {
                path = 'assets/' + skinData.files.original;
            }
            if (path) {
                el.style.backgroundImage = `url(${path})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
        });
    }
}

// Create singleton instance
const equipmentUIInstance = new EquipmentUI();
if (Registry) Registry.register('EquipmentUI', equipmentUIInstance);

// ES6 Module Export
export { EquipmentUI, equipmentUIInstance };

