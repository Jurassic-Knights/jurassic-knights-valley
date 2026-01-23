/**
 * QuestManagerService
 * Handles active quests, progress tracking, and completion events.
 * Refactored to Class pattern for consistency.
 */

// Globals: Logger, UIManager, VFXController, AudioManager, Registry are declared in global.d.ts

class QuestManagerService {
    // Property declarations
    activeQuest: any;
    quests: any[];
    questIndex: number;

    constructor() {
        this.activeQuest = null;

        // Configurable quest line (using entity IDs)
        this.quests = [
            {
                id: 'q1',
                type: 'collect',
                resource: 'wood_t1_01',
                target: 5,
                description: 'Gather 5 Wood'
            },
            {
                id: 'q2',
                type: 'collect',
                resource: 'scraps_t1_01',
                target: 3,
                description: 'Gather 3 Scrap Metal'
            },
            {
                id: 'q3',
                type: 'collect',
                resource: 'minerals_t1_01',
                target: 2,
                description: 'Gather 2 Iron Ore'
            }
        ];
        this.questIndex = 0;

        Logger.info('[QuestManager] Initialized Service');
    }

    init() {
        Logger.info('[QuestManager] Starting Quest Chain...');
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
            Logger.info('[QuestManager] No more quests!');
            this.activeQuest = null;
            if (UIManager) UIManager.hideQuestPanel();
            return;
        }

        this.activeQuest = {
            ...questConfig,
            current: 0
        };

        Logger.info(`[QuestManager] Started Quest: ${this.activeQuest.description}`);
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

            Logger.info(
                `[QuestManager] Progress: ${this.activeQuest.current}/${this.activeQuest.target}`
            );
            this.updateUI(true); // true = animate

            // Check completion
            if (
                this.activeQuest.current >= this.activeQuest.target &&
                oldCurrent < this.activeQuest.target
            ) {
                this.completeQuest();
            }
        }
    }

    /**
     * Complete the current quest
     */
    completeQuest() {
        Logger.info('[QuestManager] Quest Complete!');

        // VFX: Quest Complete Popup
        if (VFXController && UIManager) {
            // Find UI element for Quest Panel to explode it
            const panel = document.getElementById('ui-quest-panel');
            if (panel && VFXController.triggerUIExplosion) {
                VFXController.triggerUIExplosion(panel, '#FFFF00');
            }
        }

        // SFX
        if (AudioManager) {
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
        if (!UIManager) return;
        UIManager.updateQuest(this.activeQuest, animate);
    }
}

QuestManager = new QuestManagerService();
if (Registry) Registry.register('QuestManager', QuestManager);

