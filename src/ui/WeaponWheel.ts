/**
 * WeaponWheel.ts
 * "Square Tree" Filter Menu.
 * Vertical stack of horizontal option bars.
 * Replacing Radial Wheel for better vertical screen utilization.
 */

import { AssetLoader } from '@core/AssetLoader';
import { DOMUtils } from '@core/DOMUtils';

export interface WheelItem {
    id: string;
    label: string;
    iconId?: string;
    children?: WheelItem[];
}

export class WeaponWheel {
    private container: HTMLElement | null = null;
    private treeContainer: HTMLElement | null = null;

    private options: WheelItem[] = []; // Root options
    private activePath: WheelItem[] = []; // Selected chain

    private onSelect: ((path: WheelItem[]) => void) | null = null;
    private anchor: HTMLElement | null = null;
    private isOpen = false;

    constructor() {
        this.injectStyles();
        this.createContainer();
    }

    private injectStyles() {
        if (document.getElementById('weapon-wheel-styles')) return;
        const style = DOMUtils.create('style', {
            id: 'weapon-wheel-styles',
            text: `
            .weapon-wheel-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 2000;
                display: none;
                touch-action: none; /* Prevent scroll */
            }
            .weapon-wheel-overlay.open {
                display: block;
            }
            .wheel-backdrop {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.1); 
            }
            .wheel-tree-container {
                position: absolute;
                display: flex;
                flex-direction: column-reverse; /* Bottom-up stacking */
                align-items: center;
                gap: 4px; /* Reduced from 12px */
                z-index: 2001;
                pointer-events: none; /* Let pointer pass through to detect elements via JS */
                transform: translateX(-50%);
                padding-bottom: 4px; /* Reduced from 20px */
                width: auto;
                min-width: 100px;
            }
            .tree-row {
                display: flex;
                gap: 8px;
                background: rgba(20, 18, 10, 0.95);
                padding: 6px;
                border: 2px solid #5a4d33;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                animation: slideUp 0.1s ease-out;
                pointer-events: auto; /* Re-enable pointer events for buttons */
                justify-content: center;
                position: relative; /* Ensure ::after is relative to this row */
            }
            /* Connecting line (pseudo-element) */
            .tree-row::after {
                content: '';
                position: absolute;
                top: 100%; /* Start at bottom of row */
                margin-top: 2px; /* Skip border (2px) */
                left: 50%;
                width: 2px;
                height: 4px; /* Match gap size exactly */
                background: #ffd700;
                transform: translateX(-50%);
                opacity: 0.6;
            }
            /* No connector for the bottom-most row */
            .tree-row:first-child::after { 
                display: none; 
            }

            .tree-btn {
                width: 68px; height: 68px;
                background: #2a251b;
                border: 2px solid #5a4d33;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.1s, background 0.1s;
                position: relative;
            }
            .tree-btn[data-hover="true"], .tree-btn.active {
                background: #4e4430;
                border-color: #ffd700;
                transform: scale(1.05);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
                z-index: 10;
            }
            .tree-btn-icon {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background-size: cover; /* Fill the frame */
                background-position: center;
                background-repeat: no-repeat;
                margin: 0;
                pointer-events: none;
                z-index: 1;
            }
            .tree-btn-label {
                position: absolute;
                bottom: 2px;
                left: 0;
                width: 100%;
                font-size: 14px; /* Specific to this component sizing */
                text-align: center;
                z-index: 2;
                pointer-events: none;
                white-space: nowrap;
                overflow: hidden;
            }
            .tree-btn.active .tree-btn-label {
                color: #ffd700;
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `
        });
        document.head.appendChild(style);
    }

    private createContainer() {
        this.container = DOMUtils.create('div', {
            id: 'weapon-wheel-overlay',
            className: 'weapon-wheel-overlay'
        });

        // Backdrop for clicking off
        const backdrop = DOMUtils.create('div', { className: 'wheel-backdrop' });
        this.container.appendChild(backdrop);

        // Actual Tree Container
        this.treeContainer = DOMUtils.create('div', { className: 'wheel-tree-container' });
        this.container.appendChild(this.treeContainer);

        document.body.appendChild(this.container);

        // Global pointer tracking
        this.container.addEventListener('pointerdown', (e) => this.handlePointerMove(e));
        this.container.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        this.container.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        this.container.addEventListener('click', (e) => {
            if (e.target === backdrop) this.close();
        });
    }

    private handlePointerMove(e: PointerEvent) {
        if (!this.isOpen) return;

        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const btn = target?.closest('.tree-btn') as HTMLElement;

        if (btn) {
            const itemId = btn.dataset.id;
            const depth = parseInt(btn.dataset.depth || '0');

            // Visual hover feedback via attribute to avoid style recycling
            document.querySelectorAll('.tree-btn').forEach((b) => b.removeAttribute('data-hover'));
            btn.setAttribute('data-hover', 'true');

            // Find item object
            const item = this.findItemById(itemId, depth);

            // Update selection only if it effectively changes the path at this depth
            if (item && item !== this.activePath[depth]) {
                this.handleItemSelection(item, depth);
            }
        } else {
            document.querySelectorAll('.tree-btn').forEach((b) => b.removeAttribute('data-hover'));
        }
    }

    private handlePointerUp(e: PointerEvent) {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const btn = target?.closest('.tree-btn') as HTMLElement;

        if (btn && this.onSelect) {
            const itemId = btn.dataset.id;
            const depth = parseInt(btn.dataset.depth || '0');
            const item = this.findItemById(itemId, depth);

            if (item) {
                // Determine full path to this item
                // If it's the active path, use it. If triggered via tap, it might not be in activePath yet if pointerMove didn't fire?
                // pointerMove usually fires before up.
                // Safest to construct path: activePath up to depth-1 + item

                const path = [...this.activePath.slice(0, depth), item];
                this.onSelect(path);
                this.close();
            }
        } else if (target && target.classList.contains('wheel-backdrop')) {
            this.close();
        }
    }

    private findItemById(id: string | undefined, depth: number): WheelItem | undefined {
        if (!id) return undefined;
        let sourceList = this.options;
        if (depth > 0) {
            const parent = this.activePath[depth - 1];
            if (parent) sourceList = parent.children || [];
        }
        return sourceList.find((i) => i.id === id);
    }

    private handleItemSelection(item: WheelItem, depth: number) {
        // Update active path
        const newPath = this.activePath.slice(0, depth);
        newPath.push(item);
        this.activePath = newPath;
        this.render();
    }

    open(rootItems: WheelItem[], onSelect: (path: WheelItem[]) => void, anchor?: HTMLElement) {
        this.options = rootItems;
        this.onSelect = onSelect;
        this.activePath = [];
        this.anchor = anchor || null;
        this.isOpen = true;

        if (this.container) {
            this.container.classList.add('open');
            this.render(); // Initial render
            this.positionMenu();
        }
    }

    close() {
        if (this.container) {
            this.container.classList.remove('open');
            this.activePath = [];
            this.isOpen = false;
        }
    }

    private positionMenu() {
        if (!this.treeContainer) return;

        if (this.anchor) {
            const rect = this.anchor.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const bottomY = window.innerHeight - rect.top + 8; // Reduced from 20

            this.treeContainer.style.left = `${centerX}px`;
            this.treeContainer.style.bottom = `${bottomY}px`;
            this.treeContainer.style.top = 'auto';
        } else {
            this.treeContainer.style.left = '50%';
            this.treeContainer.style.bottom = '120px';
        }
    }

    private render() {
        if (!this.treeContainer) return;

        // INCREMENTAL RENDER STRATEGY
        // 1. Ensure Row 0 matches options
        this.renderRow(this.options, 0);

        // 2. For each active item, ensure subsequent child row exists
        for (let i = 0; i < this.activePath.length; i++) {
            const selectedItem = this.activePath[i];

            // Update active state in current row (i)
            this.updateRowState(i, selectedItem);

            // Render next row (i+1) if children exist
            if (selectedItem.children && selectedItem.children.length > 0) {
                this.renderRow(selectedItem.children, i + 1);
            }
        }

        // 3. Prune extra rows
        // Calculate expected row count.
        // Row 0 is base (1).
        // +1 for each active item that has children.
        let expectedRows = 1;
        for (let i = 0; i < this.activePath.length; i++) {
            if (this.activePath[i].children?.length) expectedRows++;
            else break; // Leaf node breaks the chain of rows
        }

        // Remove excess rows
        while (this.treeContainer.children.length > expectedRows) {
            this.treeContainer.lastChild?.remove();
        }
    }

    private updateRowState(depth: number, activeItem: WheelItem) {
        const row = this.treeContainer?.children[depth] as HTMLElement;
        if (!row) return;

        Array.from(row.children).forEach((child) => {
            const btn = child as HTMLElement;
            if (btn.dataset.id === activeItem.id) {
                if (!btn.classList.contains('active')) btn.classList.add('active');
            } else {
                if (btn.classList.contains('active')) btn.classList.remove('active');
            }
        });
    }

    private renderRow(items: WheelItem[], depth: number) {
        if (!this.treeContainer) return;

        let row = this.treeContainer.children[depth] as HTMLElement;

        // Verify if row matches these items
        if (row) {
            const children = Array.from(row.children) as HTMLElement[];

            // Check if lengths match
            if (children.length !== items.length) {
                row.remove();
                row = null as any;
            } else {
                // Check if ALL IDs match
                const allMatch = items.every((item, index) => {
                    return children[index].dataset.id === item.id;
                });

                if (!allMatch) {
                    row.remove();
                    row = null as any;
                }
            }
        }

        if (!row) {
            row = DOMUtils.create('div', { className: 'tree-row' });
            // Insert at correct index? Flex reverse handles visual order.
            // DOM order implies depth (Child 0 = Bottom/Row 0).

            items.forEach((item) => {
                const btn = DOMUtils.create('div', {
                    className: 'tree-btn',
                    attributes: {
                        'data-id': item.id,
                        'data-depth': depth.toString()
                    }
                });

                let iconUrl = '';
                if (item.iconId) {
                    iconUrl = AssetLoader.getImagePath(item.iconId) || '';
                } else if (item.id.includes('sword'))
                    iconUrl = AssetLoader.getImagePath('weapon_melee_sword_t1_01') || '';
                else if (item.id.includes('mace'))
                    iconUrl = AssetLoader.getImagePath('weapon_melee_mace_t1_01') || '';
                else if (item.id.includes('axe'))
                    iconUrl = AssetLoader.getImagePath('weapon_melee_war_axe_t1_01') || '';
                else if (item.id === 'shield')
                    iconUrl = AssetLoader.getImagePath('weapon_melee_shield_t1_01') || '';

                if (iconUrl) {
                    btn.innerHTML = `
                        <div class="tree-btn-icon" style="background-image: url('${iconUrl}')"></div>
                        <div class="tree-btn-label text-pixel-outline">${item.label}</div>
                     `;
                } else {
                    btn.innerHTML = `<div class="tree-btn-label text-pixel-outline">${item.label}</div>`;
                }
                row.appendChild(btn);
            });

            if (this.treeContainer.children[depth]) {
                this.treeContainer.replaceChild(row, this.treeContainer.children[depth]);
            } else {
                this.treeContainer.appendChild(row);
            }
        }
    }
}

export const WeaponWheelInstance = new WeaponWheel();
