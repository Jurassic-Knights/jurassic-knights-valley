/**
 * QuestManagerService
 * Handles active quests, progress tracking, and completion events.
 * Refactored to Class pattern for consistency.
 */

class QuestManagerService {
    constructor() {
        this.activeQuest = null;

        // Configurable quest line
        this.quests = [
            { id: 'q1', type: 'collect', resource: 'wood', target: 5, description: 'Gather 5 Wood' },
            { id: 'q2', type: 'collect', resource: 'scrap_metal', target: 3, description: 'Gather 3 Scrap Metal' },
            { id: 'q3', type: 'collect', resource: 'iron_ore', target: 2, description: 'Gather 2 Iron Ore' }
        ];
        this.questIndex = 0;

        console.log('[QuestManager] Initialized Service');
    }

    init() {
        console.log('[QuestManager] Starting Quest Chain...');
        this.startQuest(this.quests[0]);
    }

    /**
     * Update loop (required for System registration)
     */
    update(dt) {
        // Quest update logic if needed
    }

    /**
     * Start a specific quest
     */
    startQuest(questConfig) {
        if (!questConfig) {
            console.log('[QuestManager] No more quests!');
            this.activeQuest = null;
            if (window.UIManager) UIManager.hideQuestPanel();
            return;
        }

        this.activeQuest = {
            ...questConfig,
            current: 0
        };

        console.log(`[QuestManager] Started Quest: ${this.activeQuest.description}`);
        this.updateUI();
    }

    /**
     * Handle resource collection event
     */
    onCollect(resourceType, amount) {
        if (!this.activeQuest) return;

        // Check if collected resource matches quest requirement
        if (this.activeQuest.type === 'collect' && this.activeQuest.resource === resourceType) {
            const oldCurrent = this.activeQuest.current;
            this.activeQuest.current += amount;

            // Cap at target
            if (this.activeQuest.current > this.activeQuest.target) {
                this.activeQuest.current = this.activeQuest.target;
            }

            console.log(`[QuestManager] Progress: ${this.activeQuest.current}/${this.activeQuest.target}`);
            this.updateUI(true); // true = animate

            // Check completion
            if (this.activeQuest.current >= this.activeQuest.target && oldCurrent < this.activeQuest.target) {
                this.completeQuest();
            }
        }
    }

    /**
     * Complete the current quest
     */
    completeQuest() {
        console.log('[QuestManager] Quest Complete!');

        // VFX: Quest Complete Popup
        if (window.VFXController && window.UIManager) {
            // Find UI element for Quest Panel to explode it
            const panel = document.getElementById('ui-quest-panel');
            if (panel && window.VFXController.triggerUIExplosion) {
                VFXController.triggerUIExplosion(panel, '#FFFF00');
            }
        }

        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_ui_unlock'); // Reusing unlock sound
        }

        // Delay next quest
        setTimeout(() => {
            this.questIndex++;
            this.startQuest(this.quests[this.questIndex]);
        }, 2000);
    }

    /**
     * Update UI elements
     */
    updateUI(animate = false) {
        if (!window.UIManager) return;
        UIManager.updateQuest(this.activeQuest, animate);
    }
}

window.QuestManager = new QuestManagerService();
if (window.Registry) Registry.register('QuestManager', window.QuestManager);
