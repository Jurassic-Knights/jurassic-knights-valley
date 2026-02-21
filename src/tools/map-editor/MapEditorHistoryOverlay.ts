import type { CommandManager } from './commands/CommandManager';

export function createHistoryUI(
    container: HTMLElement | null,
    commandManager: CommandManager
): void {
    let wrapEl = document.getElementById('map-editor-history-wrap');
    if (!wrapEl && container) {
        wrapEl = document.createElement('div');
        wrapEl.id = 'map-editor-history-wrap';
        // Positioned bottom right with fixed height, scrollable
        wrapEl.style.cssText =
            'position:absolute;bottom:40px;right:10px;width:240px;max-height:200px;' +
            'background:rgba(20,20,20,0.85);color:#fff;border:1px solid #444;border-radius:6px;' +
            'display:flex;flex-direction:column;pointer-events:none;z-index:100;' +
            'font-family:monospace;font-size:11px;overflow:hidden;';

        const header = document.createElement('div');
        header.style.cssText = 'padding:4px 8px;background:#333;border-bottom:1px solid #555;font-weight:bold;text-transform:uppercase;font-size:10px;color:#aaa;';
        header.textContent = 'Action History';
        wrapEl.appendChild(header);

        const listEl = document.createElement('div');
        listEl.id = 'map-editor-history-list';
        listEl.style.cssText = 'flex:1;overflow-y:auto;display:flex;flex-direction:column-reverse;padding:4px 0;';
        wrapEl.appendChild(listEl);

        container.appendChild(wrapEl);

        // Subscribe to changes
        commandManager.onChange(() => {
            updateHistoryUI(commandManager);
        });

        // Initial render
        updateHistoryUI(commandManager);
    }
}

function updateHistoryUI(commandManager: CommandManager): void {
    const listEl = document.getElementById('map-editor-history-list');
    if (!listEl) return;

    listEl.innerHTML = ''; // Clear

    const history = commandManager.getHistory();
    const redoStack = commandManager.getRedoStack();

    // The list is column-reverse, so the bottom of the column is the "top" of the DOM elements.
    // We want the newest action at the bottom of the visual list.
    // That means we append them in visual top-to-bottom order (redo oldest -> redo newest -> history newest -> history oldest).
    // Actually, column-reverse makes the first child appear at the bottom.
    // Let's just use normal column and scroll to bottom.
    listEl.style.flexDirection = 'column';

    // Top of list: Oldest history
    // Bottom of list: Newest history, then undone actions (redo stack)
    // History array: index 0 is oldest, history.length-1 is newest.
    // Redo Stack array: index 0 is oldest undone, redoStack.length-1 is most recently undone (next to be redone).
    // Wait, the next to be redone is redoStack[redoStack.length-1]. So visually, it sits "above" the current history head if we show future?
    // Let's do:
    // [Old History]
    // [Newest History] <--- Current Head
    // [Next Redo]
    // [Future Redo]

    for (let i = 0; i < history.length; i++) {
        const item = document.createElement('div');
        item.style.cssText = 'padding:2px 8px;opacity:0.8;';
        item.textContent = history[i]!.type;
        if (i === history.length - 1) {
            item.style.background = '#2a4d69'; // Highlight active head
            item.style.opacity = '1';
            item.style.borderLeft = '3px solid #4da8da';
            item.textContent = '> ' + item.textContent;
        } else {
            item.style.borderLeft = '3px solid transparent';
        }
        listEl.appendChild(item);
    }

    // Redo stack is LIFO. The item at redoStack.length - 1 is the NEXT one to be redone.
    // So visually, we should list them from length-1 down to 0.
    for (let i = redoStack.length - 1; i >= 0; i--) {
        const item = document.createElement('div');
        item.style.cssText = 'padding:2px 8px;color:#777;font-style:italic;border-left:3px solid transparent;';
        item.textContent = redoStack[i]!.type;
        listEl.appendChild(item);
    }

    // Scroll to the active item (which is roughly history.length - 1)
    if (listEl.children.length > 0) {
        const activeItem = listEl.children[Math.max(0, history.length - 1)] as HTMLElement;
        if (activeItem) {
            // Scroll it into view
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }
}
