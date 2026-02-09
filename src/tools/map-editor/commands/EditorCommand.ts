/**
 * EditorCommand
 * 
 * Interface for all Map Editor operations that support Undo/Redo.
 */
export interface EditorCommand {
    type: string;
    execute(): void | Promise<void>;
    undo(): void | Promise<void>;
}
