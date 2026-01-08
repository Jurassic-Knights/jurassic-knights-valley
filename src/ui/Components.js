/**
 * UI Components
 * Reusable UI component templates
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
     */
    button(text, className = 'btn-primary', id = '') {
        const idAttr = id ? `id="${id}"` : '';
        return `<button class="btn ${className}" ${idAttr}>${text}</button>`;
    },

    /**
     * Create a card component
     */
    card(content, className = '') {
        return `<div class="card ${className}">${content}</div>`;
    }
};

window.Components = Components;
