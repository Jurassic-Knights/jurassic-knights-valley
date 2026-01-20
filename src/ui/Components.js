/**
 * UI Components
 * Reusable UI component templates - SINGLE SOURCE OF TRUTH
 * All UIs should use these builders for consistency
 *
 * Owner: UI Artist
 */

const Components = {
    /**
     * Create an image element with fallback
     * @param {string} assetId - Asset registry ID
     * @param {string} fallback - Fallback text if image fails
     */
    img(assetId, fallback = '') {
        const path = AssetLoader.getImagePath(assetId);
        if (!path) {
            return `<span class="icon-fallback">${fallback}</span>`;
        }
        return `<img src="${path}" alt="" class="icon" onerror="this.outerHTML='<span class=\\'icon-fallback\\'>${fallback}</span>'">`;
    },

    /**
     * Create a button component
     * @param {string} text - Button text
     * @param {string} className - Additional CSS classes
     * @param {string} id - Optional ID attribute
     * @param {object} data - Optional data attributes
     */
    button(text, className = 'btn-primary', id = '', data = {}) {
        const idAttr = id ? `id="${id}"` : '';
        const dataAttrs = Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(' ');
        return `<button class="btn ${className}" ${idAttr} ${dataAttrs}>${text}</button>`;
    },

    /**
     * Create a close button (✕)
     */
    closeButton(id = '', className = '') {
        return `<button class="btn btn-close ${className}" ${id ? `id="${id}"` : ''}>✕</button>`;
    },

    /**
     * Create a back button (← Back)
     */
    backButton(id = '', className = '') {
        return `<button class="btn btn-back ${className}" ${id ? `id="${id}"` : ''}>← Back</button>`;
    },

    /**
     * Create a footer action button with icon
     * @param {string} iconId - Asset ID for icon
     * @param {string} label - Button label
     * @param {string} id - Button ID  
     * @param {object} data - Data attributes
     */
    footerButton(iconId, label, id = '', data = {}) {
        const dataAttrs = Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(' ');
        return `
            <button class="action-btn" ${id ? `id="${id}"` : ''} ${dataAttrs}>
                <span class="action-icon" data-icon-id="${iconId}"></span>
                <span class="action-label">${label}</span>
            </button>
        `;
    },

    /**
     * Create a tab button for category filtering
     */
    tabButton(label, category, isActive = false) {
        return `<button class="equip-tab ${isActive ? 'active' : ''}" data-category="${category}">${label}</button>`;
    },

    /**
     * Create a card component
     */
    card(content, className = '') {
        return `<div class="card ${className}">${content}</div>`;
    },

    /**
     * Create a modal container with backdrop
     * @param {string} id - Modal ID
     * @param {string} title - Modal title
     * @param {string} content - Modal body content
     * @param {boolean} showClose - Whether to show close button
     */
    modal(id, title, content, showClose = true) {
        return `
            <div id="${id}" class="modal-overlay">
                <div class="modal-backdrop"></div>
                <div class="modal-container">
                    ${showClose ? '<button class="modal-close">✕</button>' : ''}
                    <div class="modal-title">${title}</div>
                    <div class="modal-content">${content}</div>
                </div>
            </div>
        `;
    },

    /**
     * Create a grid of selectable items
     */
    selectableGrid(items, selectedId = null) {
        return `
            <div class="selectable-grid">
                ${items.map(item => `
                    <div class="selectable-item ${item.id === selectedId ? 'selected' : ''}" data-id="${item.id}">
                        <div class="item-image" data-icon-id="${item.id}"></div>
                        <div class="item-name">${item.name || item.id}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

window.Components = Components;

// ES6 Module Export
export { Components };
