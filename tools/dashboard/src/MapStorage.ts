/**
 * MapStorage — Persist default map for map editor (survives refresh).
 * Uses localStorage for small payloads; falls back to IndexedDB when quota exceeded or for large payloads.
 */

const DB_NAME = 'map-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'maps';
const DEFAULT_KEY = 'default';

/** ~2MB threshold; above this use IndexedDB to avoid localStorage quota. */
const LOCAL_STORAGE_SIZE_THRESHOLD = 2 * 1024 * 1024;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export type LoadSource = 'localStorage' | 'indexedDB';

/**
 * Load default map from storage. Tries IndexedDB first (where large maps are saved), then localStorage.
 * This order ensures we load the actual saved map: large maps are stored only in IndexedDB, and
 * localStorage may hold an older/smaller map from before quota was exceeded.
 */
export async function loadDefaultMap(): Promise<{ data: unknown; source: LoadSource } | null> {
    try {
        const db = await openDB();
        const data = await new Promise<unknown>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(DEFAULT_KEY);
            req.onerror = () => {
                db.close();
                reject(req.error);
            };
            req.onsuccess = () => {
                db.close();
                resolve(req.result ?? null);
            };
        });
        if (data != null) {
            return { data, source: 'indexedDB' };
        }
    } catch {
        /* IndexedDB failed or empty */
    }

    try {
        const stored = localStorage.getItem('map-editor-default-map');
        if (stored) {
            return { data: JSON.parse(stored) as unknown, source: 'localStorage' };
        }
    } catch {
        /* localStorage empty or invalid */
    }
    return null;
}

/**
 * Save default map to storage. Tries localStorage first; on quota error or large payload, uses IndexedDB.
 */
export async function saveDefaultMap(data: unknown): Promise<{ source: 'localStorage' | 'indexedDB' }> {
    const json = JSON.stringify(data);
    const size = new Blob([json]).size;

    if (size <= LOCAL_STORAGE_SIZE_THRESHOLD) {
        try {
            localStorage.setItem('map-editor-default-map', json);
            return { source: 'localStorage' };
        } catch (e) {
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
                /* fall through to IndexedDB */
            } else {
                throw e;
            }
        }
    }

    /* Large payload or quota exceeded: use IndexedDB and clear any stale localStorage entry */
    try {
        localStorage.removeItem('map-editor-default-map');
    } catch {
        /* ignore */
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, DEFAULT_KEY);
        req.onerror = () => {
            db.close();
            reject(req.error);
        };
        req.onsuccess = () => {
            db.close();
            resolve({ source: 'indexedDB' });
        };
    });
}
