/**
 * MapEditorRegistry - Preload entity registry for map editor
 */
import { Logger } from '@core/Logger';
import { EditorContext } from './EditorContext';

const CATEGORIES = ['nodes', 'enemies', 'resources', 'environment', 'items'] as const;

export function preloadRegistry(
    dataFetcher?: (category: string) => Promise<{ entities: Array<{ id: string; width?: number; height?: number }> }>
): void {
    try {
        const fetcher = dataFetcher || (async () => ({ entities: [] }));
        Promise.all(CATEGORIES.map((cat) => fetcher(cat).catch(() => ({ entities: [] })))).then(
            (results) => {
                results.forEach((data, i) => {
                    const cat = CATEGORIES[i];
                    const dict: Record<string, unknown> = {};
                    if (data.entities) {
                        data.entities.forEach((e) => {
                            dict[e.id] = { width: e.width, height: e.height };
                        });
                    }
                    (EditorContext.registry as Record<string, unknown>)[cat] = dict;
                });
                Logger.info('[MapEditor] Registry Preloaded');
            }
        );
    } catch (e) {
        Logger.error('[MapEditor] Failed to preload registry:', e);
    }
}
