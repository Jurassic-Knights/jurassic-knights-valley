/**
 * HeroSkinSelector - Modal UI for selecting hero skins
 * 
 * Extracted from EquipmentUI for better modularity.
 * 
 * Owner: UI Engineer
 */

import { EventBus } from '../core/EventBus';
import { GameInstance } from '../core/Game';
import { HeroRenderer } from '../rendering/HeroRenderer';
import { EntityRegistry } from '../entities/EntityLoader';

/**
 * Hero skin selector modal manager
 */
class HeroSkinSelectorClass {
    private container: HTMLElement | null = null;

    /**
     * Set the parent container for mounting the modal
     */
    setContainer(container: HTMLElement | null) {
        this.container = container;
    }

    /**
     * Open the hero skin selector modal
     */
    open() {
        if (!this.container) return;

        const heroSkins = this.getAvailableSkins();
        const currentSkin = this.getCurrentSkin();

        const modalHtml = `
            <div class="hero-skin-modal-backdrop"></div>
            <div class="hero-skin-modal">
                <button class="hero-skin-modal-close">×</button>
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

        const modalContainer = document.createElement('div');
        modalContainer.id = 'hero-skin-selector';
        modalContainer.className = 'hero-skin-selector-overlay';
        modalContainer.innerHTML = modalHtml;
        this.container.appendChild(modalContainer);

        this._loadSkinImages(modalContainer);
    }

    /**
     * Close the hero skin selector modal
     */
    close() {
        if (!this.container) return;
        const modal = this.container.querySelector('#hero-skin-selector');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Select a hero skin
     */
    selectSkin(skinId: string, charSprite?: HTMLElement | null) {
        const hero = GameInstance?.hero;
        if (hero) {
            hero.selectedSkin = skinId;
        }
        localStorage.setItem('heroSelectedSkin', skinId);

        // Update character sprite if provided
        if (charSprite) {
            const skinData = EntityRegistry?.hero?.[skinId];
            let path = null;
            if (skinData?.files?.clean) {
                path = 'assets/' + skinData.files.clean;
            } else if (skinData?.files?.original) {
                path = 'assets/' + skinData.files.original;
            }
            if (path) {
                charSprite.style.backgroundImage = `url(${path})`;
                charSprite.style.backgroundSize = 'cover';
                charSprite.style.backgroundPosition = 'center';
            }
        }

        // Update HeroRenderer
        if (HeroRenderer) {
            HeroRenderer.setSkin(skinId);
        }

        // Emit event
        if (EventBus) {
            EventBus.emit('HERO_SKIN_CHANGED', { skinId });
        }

        this.close();
    }

    /**
     * Get available hero skins from EntityRegistry
     */
    getAvailableSkins(): Array<{ id: string; name: string; files: any }> {
        if (EntityRegistry?.hero) {
            return Object.values(EntityRegistry.hero).map((skin: any) => ({
                id: skin.id,
                name: skin.name || skin.id,
                files: skin.files
            }));
        }
        return [];
    }

    /**
     * Get the currently selected hero skin
     */
    getCurrentSkin(): string {
        const hero = GameInstance?.hero;
        if (hero?.selectedSkin) {
            return hero.selectedSkin;
        }
        return localStorage.getItem('heroSelectedSkin') || 'hero_t1_01';
    }

    /**
     * Load hero skin images in the modal
     */
    private _loadSkinImages(container: HTMLElement) {
        const skinImages = container.querySelectorAll('.hero-skin-image[data-icon-id]');
        skinImages.forEach((el: any) => {
            const iconId = el.dataset.iconId;
            const skinData = EntityRegistry?.hero?.[iconId];
            let path = null;
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

// Singleton instance
const HeroSkinSelector = new HeroSkinSelectorClass();

export { HeroSkinSelectorClass, HeroSkinSelector };
