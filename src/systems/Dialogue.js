/**
 * Dialogue System
 * Handles NPC conversations and branching dialogue
 *
 * Owner: Lore Writer (dialogue content), UI Artist (display)
 */

const DialogueSystem = {
    dialogues: {},
    currentDialogue: null,
    currentNode: null,

    /**
     * Initialize dialogue system
     */
    async init() {
        try {
            const response = await fetch('assets/dialogue/dialogues.json');
            const data = await response.json();
            this.dialogues = data.dialogues || {};
            Logger.info('[DialogueSystem] Initialized');
        } catch (error) {
            Logger.error('[DialogueSystem] Failed to load dialogues:', error);
        }
    },

    /**
     * Start a dialogue by ID
     * @param {string} dialogueId - Dialogue identifier
     */
    start(dialogueId) {
        const dialogue = this.dialogues[dialogueId];
        if (!dialogue) {
            Logger.warn(`[DialogueSystem] Dialogue not found: ${dialogueId}`);
            return false;
        }

        this.currentDialogue = dialogue;
        this.currentNode = dialogue.startNode || 'start';

        this.showNode(this.currentNode);
        return true;
    },

    /**
     * Display the current dialogue node
     */
    showNode(nodeId) {
        if (!this.currentDialogue) return;

        const node = this.currentDialogue.nodes?.[nodeId];
        if (!node) {
            this.end();
            return;
        }

        // Emit event for UI to display
        if (window.GameState) {
            GameState.set('dialogueText', node.text);
            GameState.set('dialogueChoices', node.choices || []);
            GameState.set('dialogueSpeaker', node.speaker || '');
        }
    },

    /**
     * Select a dialogue choice
     * @param {number} choiceIndex - Index of the choice
     */
    choose(choiceIndex) {
        if (!this.currentDialogue) return;

        const node = this.currentDialogue.nodes?.[this.currentNode];
        const choices = node?.choices || [];
        const choice = choices[choiceIndex];

        if (choice?.next) {
            this.currentNode = choice.next;
            this.showNode(this.currentNode);
        } else {
            this.end();
        }
    },

    /**
     * End the current dialogue
     */
    end() {
        this.currentDialogue = null;
        this.currentNode = null;

        if (window.GameState) {
            GameState.set('dialogueText', null);
            GameState.set('dialogueChoices', []);
        }
    }
};

window.DialogueSystem = DialogueSystem;

// ES6 Module Export
export { DialogueSystem };
