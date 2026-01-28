/**
 * Main Entry Point
 * Initializes and starts the game
 *
 * Owner: Director
 */

import { Logger } from './core/Logger';
// Import all systems first to ensure they register with Registry before Game.init()
import './SystemLoader';
import { GameInstance } from './core/Game';

console.log('[Main] All modules imported successfully');

(async function main() {
    Logger.info('=== Jurassic Knights: Valley ===');

    try {
        // Initialize and start the game
        const success = await GameInstance.init();

        if (success) {
            // Hide loading screen
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }

            // Start the game loop
            GameInstance.start();
        } else {
            throw new Error('Game initialization failed');
        }
    } catch (error) {
        Logger.error('[FATAL]', error);

        // Show error screen
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #8B0000;
                    color: white;
                    padding: 20px;
                    text-align: center;
                ">
                    <h1 style="font-size: 24px; margin-bottom: 16px;">Initialization Error</h1>
                    <p style="font-family: monospace; font-size: 14px;">${error.message}</p>
                    <pre style="
                        margin-top: 16px;
                        padding: 16px;
                        background: rgba(0,0,0,0.3);
                        border-radius: 8px;
                        max-width: 100%;
                        overflow: auto;
                        font-size: 12px;
                    ">${error.stack || 'No stack trace'}</pre>
                </div>
            `;
        }
    }
})();
