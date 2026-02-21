/**
 * EditorCommand
 * 
 * Interface for all Map Editor operations that support Undo/Redo.
 */
export interface EditorCommand {
    type: string;
    execute(): void | Promise<void>;
    undo(): void | Promise<void>;
    /** Optional method to merge a newer command into this one (e.g. dragging an object) */
    mergeWith?(nextCommand: EditorCommand): boolean;
}
