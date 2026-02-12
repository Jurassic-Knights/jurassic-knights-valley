/**
 * MapEditorUIOverlays - Zoom indicator and cursor coords display
 */
export function createZoomUI(container: HTMLElement | null): void {
    let zoomEl = document.getElementById('map-editor-zoom');
    if (!zoomEl && container) {
        zoomEl = document.createElement('div');
        zoomEl.id = 'map-editor-zoom';
        zoomEl.style.position = 'absolute';
        zoomEl.style.top = '10px';
        zoomEl.style.left = '10px';
        zoomEl.style.background = 'rgba(0, 0, 0, 0.7)';
        zoomEl.style.color = '#fff';
        zoomEl.style.padding = '4px 8px';
        zoomEl.style.borderRadius = '4px';
        zoomEl.style.pointerEvents = 'none';
        zoomEl.style.fontSize = '12px';
        zoomEl.style.zIndex = '100';
        container.appendChild(zoomEl);
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
