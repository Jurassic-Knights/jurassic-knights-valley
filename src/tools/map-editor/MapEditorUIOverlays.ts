/**
 * MapEditorUIOverlays - Zoom indicator and cursor coords display
 */
export function createZoomUI(
    container: HTMLElement | null,
    onResetZoom?: () => void
): void {
    let wrapEl = document.getElementById('map-editor-zoom-wrap');
    if (!wrapEl && container) {
        wrapEl = document.createElement('div');
        wrapEl.id = 'map-editor-zoom-wrap';
        wrapEl.style.cssText =
            'position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:6px;z-index:100;';
        container.appendChild(wrapEl);

        const zoomEl = document.createElement('div');
        zoomEl.id = 'map-editor-zoom';
        zoomEl.style.cssText =
            'background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;';
        wrapEl.appendChild(zoomEl);

        if (onResetZoom) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = 'Reset';
            btn.title = 'Reset zoom to game viewport scale (centers on current view)';
            btn.style.cssText =
                'background:rgba(0,0,0,0.7);color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onResetZoom();
            });
            wrapEl.appendChild(btn);
        }
    }
}

export function updateZoomUI(zoom: number): void {
    const el = document.getElementById('map-editor-zoom');
    if (el) {
        el.innerText = `Zoom: ${(zoom * 100).toFixed(1)}%`;
    }
}

export function updateCursorCoords(worldX: number, worldY: number): void {
    const cursorEl = document.getElementById('cursor-coords');
    if (cursorEl) {
        cursorEl.innerText = `${Math.floor(worldX)}, ${Math.floor(worldY)}`;
    }
}
