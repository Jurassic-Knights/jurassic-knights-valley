/**
 * ResizePanels - Resizable sidebar/panel dividers
 * Drag handles to adjust panel widths. Persists to localStorage.
 */

const RESIZE_HANDLE_WIDTH = 6;
const MIN_PANEL = 160;
const MAX_PANEL = 600;

function createResizeHandle(): HTMLDivElement {
    const h = document.createElement('div');
    h.className = 'resize-handle';
    h.setAttribute('aria-label', 'Resize panel');
    h.style.cssText = `
        width: ${RESIZE_HANDLE_WIDTH}px;
        flex-shrink: 0;
        cursor: col-resize;
        background: transparent;
    `;
    h.addEventListener('mouseenter', () => {
        h.style.background = 'rgba(102, 252, 241, 0.2)';
    });
    h.addEventListener('mouseleave', () => {
        if (!h.hasAttribute('data-dragging')) h.style.background = 'transparent';
    });
    return h;
}

/** Bind an existing resize handle to resize a panel. */
export function initResizeHandle(
    handleId: string,
    panelId: string,
    panelOnLeft: boolean,
    options: {
        defaultPx: number;
        minPx?: number;
        maxPx?: number;
        storageKey?: string;
        onResize?: () => void;
    }
): void {
    const handle = document.getElementById(handleId);
    const panel = document.getElementById(panelId);
    if (!handle || !panel) return;

    const stored = options.storageKey ? localStorage.getItem(options.storageKey) : null;
    let widthPx = stored ? parseInt(stored, 10) : options.defaultPx;
    const minPx = options.minPx ?? MIN_PANEL;
    const maxPx = options.maxPx ?? MAX_PANEL;

    const apply = (): void => {
        widthPx = Math.max(minPx, Math.min(maxPx, widthPx));
        panel.style.width = `${widthPx}px`;
        panel.style.minWidth = `${widthPx}px`;
        panel.style.maxWidth = `${widthPx}px`;
        panel.style.flex = `0 0 ${widthPx}px`;
        if (options.storageKey) localStorage.setItem(options.storageKey, String(widthPx));
        if (panelId === 'sidebar') {
            document.documentElement.style.setProperty('--sidebar-width', `${widthPx}px`);
        }
        if (panelId === 'inspectorPanel') {
            document.documentElement.style.setProperty('--inspector-width', `${widthPx}px`);
        }
        options.onResize?.();
    };

    handle.style.cursor = 'col-resize';
    handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(102, 252, 241, 0.2)';
    });
    handle.addEventListener('mouseleave', () => {
        if (!handle.hasAttribute('data-dragging')) handle.style.background = 'transparent';
    });
    handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        handle.setAttribute('data-dragging', 'true');
        handle.style.background = 'rgba(102, 252, 241, 0.4)';
        const startX = e.clientX;
        const startW = widthPx;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            const delta = panelOnLeft ? ev.clientX - startX : startX - ev.clientX;
            widthPx = startW + delta;
            apply();
        };
        const onUp = () => {
            handle.removeAttribute('data-dragging');
            handle.style.background = 'transparent';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    apply();
}

/** Add a resize handle that resizes the panel to its left when dragged. */
export function addResizeHandle(
    panelId: string,
    insertAfter: boolean,
    options: {
        defaultPx: number;
        minPx?: number;
        maxPx?: number;
        storageKey?: string;
    }
): void {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const stored = options.storageKey ? localStorage.getItem(options.storageKey) : null;
    let widthPx = stored ? parseInt(stored, 10) : options.defaultPx;
    const minPx = options.minPx ?? MIN_PANEL;
    const maxPx = options.maxPx ?? MAX_PANEL;

    const apply = (): void => {
        widthPx = Math.max(minPx, Math.min(maxPx, widthPx));
        panel.style.width = `${widthPx}px`;
        panel.style.minWidth = `${widthPx}px`;
        panel.style.maxWidth = `${widthPx}px`;
        panel.style.flex = `0 0 ${widthPx}px`;
        if (options.storageKey) localStorage.setItem(options.storageKey, String(widthPx));
    };

    const handle = createResizeHandle();
    handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        handle.setAttribute('data-dragging', 'true');
        handle.style.background = 'rgba(102, 252, 241, 0.4)';
        const startX = e.clientX;
        const startW = widthPx;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        const onMove = (ev: MouseEvent) => {
            const delta = insertAfter ? ev.clientX - startX : startX - ev.clientX;
            widthPx = startW + delta;
            apply();
        };
        const onUp = () => {
            handle.removeAttribute('data-dragging');
            handle.style.background = 'transparent';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });

    if (insertAfter) {
        panel.parentNode?.insertBefore(handle, panel.nextSibling);
    } else {
        panel.parentNode?.insertBefore(handle, panel);
    }
    apply();
}
