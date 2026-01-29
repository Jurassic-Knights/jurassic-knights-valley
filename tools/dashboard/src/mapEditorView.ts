
import { MapEditorCore } from '../../../src/tools/map-editor/MapEditorCore';
import { Logger } from '@core/Logger';

let editorInstance: MapEditorCore | null = null;

export async function showMapEditorView(): Promise<void> {
    const mainContent = document.getElementById('mainContent');
    const container = document.getElementById('map-editor-container');
    const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
    const stats = document.querySelector('.stats') as HTMLElement;

    if (mainContent) mainContent.style.display = 'none';
    if (stickyBar) stickyBar.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (container) container.style.display = 'block';

    if (!editorInstance) {
        editorInstance = new MapEditorCore();
        await editorInstance.mount('map-editor-canvas');

        // Setup Save Handler done via ActionDelegator now
    }
}

export async function saveMapData(): Promise<void> {
    if (!editorInstance) {
        console.warn('Map Editor not initialized');
        return;
    }

    Logger.info('Saving map...');
    // In the future this will call editorInstance.serialize()
    // For now just test the API
    const testData = { tiles: [], name: 'test_map' };

    try {
        const res = await fetch('/api/save_map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'world_map_v1', mapData: testData })
        });
        const result = await res.json();
        if (result.success) {
            alert('Map saved successfully!');
        } else {
            alert('Save failed: ' + result.error);
        }
    } catch (e) {
        console.error(e);
        alert('Save error');
    }
}
