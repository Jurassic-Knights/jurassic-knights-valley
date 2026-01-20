/**
 * ForgePanel - Manages the Forge (Crafting) UI
 */
class ForgePanel extends UIPanel {
    constructor() {
        super('modal-forge', {
            dockable: true,
            defaultDock: 'ui-hud-right'
        });
        this.currentView = null;
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        const btnForge = document.getElementById('btn-open-craft');
        if (btnForge) {
            btnForge.addEventListener('click', () => {
                this.render('dashboard');
                this.toggle(); // Toggle instead of force open
            });
        }
        const btnCloseForge = document.getElementById('btn-close-forge');
        if (btnCloseForge) {
            btnCloseForge.addEventListener('click', () => {
                this.close();
            });
        }
    }

    /**
     * Override Update Loop
     */
    update(dt) {
        if (this.isOpen && this.currentView && this.currentView.view === 'dashboard') {
            this.updateActiveSlots();
        }
    }

    updateActiveSlots() {
        if (!window.CraftingManager) return;
        const grid = document.querySelector('.forge-grid');
        if (!grid) return;

        CraftingManager.slots.forEach((slot) => {
            if (slot.status === 'crafting') {
                const el = grid.children[slot.id];
                if (el) {
                    const recipe = CraftingManager.getRecipe(slot.recipeId);
                    const percent = Math.floor(
                        ((Date.now() - slot.startTime) / slot.duration) * 100
                    );
                    const timeLeft = Math.ceil(
                        (slot.duration - (Date.now() - slot.startTime)) / 1000
                    );
                    const iconPath = window.AssetLoader
                        ? AssetLoader.getImagePath(recipe.outputIcon)
                        : '';

                    el.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between; padding: 4px;">
                            <div style="display: flex; align-items: center; width: 100%;">
                                <div class="slot-icon" style="flex-shrink: 0; width: 64px; height: 64px; display: block; background-image: url('${iconPath}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: none; background-color: transparent;"></div>
                                <div style="margin-left: 4px; font-size: 14px; font-weight: bold; color: #fff; text-shadow: 1px 1px 0 #000;">x${slot.quantity}</div>
                            </div>
                            <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
                                    <div class="slot-name" style="font-size: 8px; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center;">${recipe.name}</div>
                                    <div class="slot-progress" style="width: 100%; height: 20px; background: #111; border: 1px solid #444; border-radius: 4px; position: relative; overflow: hidden; margin-bottom: 2px;">
                                        <div class="fill" style="width: ${percent}%; background: var(--gradient-brass); height: 100%; transition: width 0.2s linear;"></div>
                                        <span style="position: absolute; top: 0; left: 0; width: 100%; text-align: center; font-size: 9px; line-height: 20px; color: #fff; text-shadow: 0 1px 2px #000;">${timeLeft}s</span>
                                    </div>
                            </div>
                        </div>
                    `;
                }
            }
        });
    }

    render(view = 'dashboard', context = {}) {
        if (!window.CraftingManager) return;
        const grid = document.querySelector('.forge-grid');
        if (!grid) return;

        grid.innerHTML = '';
        grid.className = 'forge-grid';
        this.currentView = { view, context };

        if (view === 'dashboard') {
            grid.classList.add('forge-dashboard-compact');
            CraftingManager.slots.forEach((slot) => {
                const slotEl = document.createElement('div');
                slotEl.className = `forge-slot ${slot.unlocked ? '' : 'locked'} ${slot.status === 'crafting' ? 'active' : ''}`;

                if (!slot.unlocked) {
                    slotEl.innerHTML = `
                         <div style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between; padding: 2px;">
                            <div style="display: flex; align-items: center; width: 100%;">
                                <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🔒</div>
                            </div>
                            <div style="width: 100%; display: flex; flex-direction: column; gap: 2px;">
                                 <div class="slot-name" style="font-size: 9px; color: #888;">Locked</div>
                                 <div class="locked-cost" style="width: 100%; text-align: right; color: #F39C12; font-size: 10px; font-weight: bold;">1000g</div>
                            </div>
                        </div>
                    `;
                    slotEl.onclick = () => {
                        if (CraftingManager.unlockSlot(slot.id)) {
                            if (window.AudioManager) AudioManager.playSFX('sfx_ui_unlock');
                            this.render('dashboard');
                        } else {
                            if (window.AudioManager) AudioManager.playSFX('sfx_ui_error');
                            slotEl.style.borderColor = 'red';
                            setTimeout(() => (slotEl.style.borderColor = ''), 200);
                        }
                    };
                } else if (slot.status === 'crafting') {
                    // Active Slot (Initial paint)
                    const recipe = CraftingManager.getRecipe(slot.recipeId);
                    const iconPath = window.AssetLoader
                        ? AssetLoader.getImagePath(recipe.outputIcon)
                        : '';
                    slotEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between; padding: 4px;">
                            <div style="display: flex; align-items: center; width: 100%;">
                                <div class="slot-icon" style="flex-shrink: 0; width: 64px; height: 64px; display: block; background-image: url('${iconPath}'); background-size: contain; background-repeat: no-repeat; background-position: center; border: none; background-color: transparent;"></div>
                                <div style="margin-left: 4px; font-size: 14px; font-weight: bold; color: #fff; text-shadow: 1px 1px 0 #000;">x${slot.quantity}</div>
                            </div>
                             <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
                                  <div class="slot-name" style="font-size: 8px; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center;">${recipe.name}</div>
                                  <div class="slot-progress" style="width: 100%; height: 20px; background: #111; border: 1px solid #444; border-radius: 4px; position: relative; overflow: hidden; margin-bottom: 2px;">
                                       <div class="fill" style="width: 0%; background: var(--gradient-brass); height: 100%;"></div>
                                       <span style="position: absolute; top: 0; left: 0; width: 100%; text-align: center; font-size: 9px; line-height: 20px; color: #fff; text-shadow: 0 1px 2px #000;">...</span>
                                  </div>
                             </div>
                        </div>
                     `;
                } else {
                    slotEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between; padding: 2px;">
                            <div style="display: flex; align-items: center; width: 100%;">
                                <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 32px; opacity: 0.5;">⚒️</div>
                            </div>
                            <div style="width: 100%; display: flex; flex-direction: column; gap: 2px;">
                                 <div class="slot-name" style="font-size: 9px; color: #666;">Empty Slot</div>
                                 <div class="slot-status" style="width: 100%; text-align: right; color: #888; font-size: 10px;">Idle</div>
                            </div>
                        </div>
                    `;
                    slotEl.onclick = () => this.render('recipes', { slotId: slot.id });
                }
                grid.appendChild(slotEl);
            });
        } else if (view === 'recipes') {
            // ... Recipe View (Keep existing logic mostly as is, just method wrapper)
            const header = document.createElement('div');
            header.className = 'nav-header';
            header.innerHTML = `<button class="back-btn">< Back</button> <span>Select Blueprint (Slot ${context.slotId + 1})</span>`;
            header.querySelector('.back-btn').onclick = () => this.render('dashboard');
            grid.appendChild(header);

            CraftingManager.recipes.forEach((recipe) => {
                const item = document.createElement('div');
                item.className = 'forge-item';
                const iconPath = AssetLoader.getImagePath(recipe.outputIcon);
                item.innerHTML = `
                    <div class="forge-icon" style="background-image: url('${iconPath || ''}')"></div>
                    <div class="forge-details">
                        <div class="forge-name">${recipe.name}</div>
                        <div class="forge-cost">
                            <span class="cost-item">Wood: ${recipe.fuelCost}</span>
                           ${Object.entries(recipe.ingredients)
                        .map(
                            ([k, v]) =>
                                `<span class="cost-item">${k.replace('_', ' ')}: ${v}</span>`
                        )
                        .join('')}
                        </div>
                    </div>
                `;
                const btn = document.createElement('button');
                btn.className = 'forge-btn';
                btn.textContent = 'SELECT';
                if (!CraftingManager.canAfford(recipe, 1)) {
                    btn.disabled = true;
                    btn.textContent = 'LOCKED';
                }
                btn.onclick = () =>
                    this.render('batch', { slotId: context.slotId, recipeId: recipe.id });
                item.appendChild(btn);
                grid.appendChild(item);
            });
        } else if (view === 'batch') {
            const recipe = CraftingManager.getRecipe(context.recipeId);
            const max = CraftingManager.getMaxCraftable(recipe);

            const header = document.createElement('div');
            header.className = 'nav-header';
            header.innerHTML = `<button class="back-btn">< Back</button> <span>Configuring ${recipe.name} (Slot ${context.slotId + 1})</span>`;
            header.querySelector('.back-btn').onclick = () =>
                this.render('recipes', { slotId: context.slotId });
            grid.appendChild(header);

            const container = document.createElement('div');
            container.className = 'batch-control';
            container.innerHTML = `
                <div class="batch-amount" id="batch-display">1</div>
                <div class="batch-slider-container">
                    <span>1</span>
                    <input type="range" min="1" max="${Math.max(1, max)}" value="1" class="batch-slider" id="batch-slider">
                    <span>${max}</span>
                </div>
                <div class="forge-cost">Total Fuel: <span id="total-fuel">${recipe.fuelCost}</span> Wood</div>
                <button class="forge-btn" id="confirm-craft">START FORGING</button>
            `;
            grid.appendChild(container);

            const slider = document.getElementById('batch-slider');
            const display = document.getElementById('batch-display');
            const fuelDisplay = document.getElementById('total-fuel');
            const confirmBtn = document.getElementById('confirm-craft');

            if (max === 0) {
                slider.disabled = true;
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'INSUFFICIENT RESOURCES';
            }

            slider.oninput = (e) => {
                const val = e.target.value;
                display.textContent = val;
                fuelDisplay.textContent = val * recipe.fuelCost;
            };

            confirmBtn.onclick = () => {
                const qty = parseInt(slider.value);
                const result = CraftingManager.startCrafting(context.slotId, recipe.id, qty);
                if (result) {
                    if (window.AudioManager) AudioManager.playSFX('sfx_ui_click');
                    this.render('dashboard');
                } else {
                    confirmBtn.textContent = 'FAILED';
                    setTimeout(() => (confirmBtn.textContent = 'START FORGING'), 1000);
                }
            };
        }
    }
}

// Global hook
window.ForgeController = new ForgePanel();
if (window.Registry) Registry.register('ForgeController', window.ForgeController);

