import { EditorCommand } from './EditorCommand';
import { Logger } from '@core/Logger';

/** Manages undo/redo history for map editor operations. */
export class CommandManager {
    private history: EditorCommand[] = [];
    private redoStack: EditorCommand[] = [];
    private maxHistory: number = 200;
    private mergeWindowMs: number = 1000;
    private lastCommandTime: number = 0;
    private onChangeCallbacks: (() => void)[] = [];

    public onChange(cb: () => void): void {
        this.onChangeCallbacks.push(cb);
    }

    private notifyChange(): void {
        this.onChangeCallbacks.forEach(cb => cb());
    }

    public getHistory(): { type: string }[] {
        return this.history.map(c => ({ type: c.type || 'Unknown' }));
    }

    public getRedoStack(): { type: string }[] {
        return this.redoStack.map(c => ({ type: c.type || 'Unknown' }));
    }

    public async execute(command: EditorCommand) {
        try {
            await command.execute();
            this.record(command);
        } catch (e) {
            Logger.error(`[CommandManager] Execution failed for ${command.type}`, e);
        }
    }

    /**
     * Records a command that has ALREADY been executed (e.g. via live painting)
     */
    public record(command: EditorCommand) {
        const now = Date.now();
        const lastCommand = this.history[this.history.length - 1];

        // Attempt to merge if the command supports it and it's the exact same type/recent
        if (lastCommand && lastCommand.type === command.type && (now - this.lastCommandTime) < this.mergeWindowMs) {
            if (lastCommand.mergeWith && lastCommand.mergeWith(command)) {
                Logger.info(`[CommandManager] Merged: ${command.type}`);
                this.lastCommandTime = now;
                this.notifyChange();
                return;
            }
        }

        this.history.push(command);
        this.redoStack = []; // Clear redo stack on new action

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.lastCommandTime = now;
        Logger.info(`[CommandManager] Recorded: ${command.type}`);
        this.notifyChange();
    }

    public async undo() {
        const command = this.history.pop();
        if (command) {
            try {
                await command.undo();
                this.redoStack.push(command);
                Logger.info(`[CommandManager] Undid: ${command.type}`);
                this.notifyChange();
            } catch (e) {
                Logger.error(`[CommandManager] Undo failed for ${command.type}`, e);
                // Push back to history if undo failed? Or discard?
                // Discarding prevents stuck state but might lose data.
                // For now, assume failed undo is fatal for that command.
            }
        }
    }

    public async redo() {
        const command = this.redoStack.pop();
        if (command) {
            try {
                await command.execute();
                this.history.push(command);
                Logger.info(`[CommandManager] Redid: ${command.type}`);
                this.notifyChange();
            } catch (e) {
                Logger.error(`[CommandManager] Redo failed for ${command.type}`, e);
            }
        }
    }

    public clear(): void {
        this.history = [];
        this.redoStack = [];
        this.notifyChange();
    }
}
