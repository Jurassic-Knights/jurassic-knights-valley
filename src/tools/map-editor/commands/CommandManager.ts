import { EditorCommand } from './EditorCommand';
import { Logger } from '@core/Logger';

export class CommandManager {
    private history: EditorCommand[] = [];
    private redoStack: EditorCommand[] = [];
    private maxHistory: number = 200;

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
        this.history.push(command);
        this.redoStack = []; // Clear redo stack on new action

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        Logger.info(`[CommandManager] Recorded: ${command.type}`);
    }

    public async undo() {
        const command = this.history.pop();
        if (command) {
            try {
                await command.undo();
                this.redoStack.push(command);
                Logger.info(`[CommandManager] Undid: ${command.type}`);
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
            } catch (e) {
                Logger.error(`[CommandManager] Redo failed for ${command.type}`, e);
            }
        }
    }
}
