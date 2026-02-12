/**
 * UIManagerUnlockPrompt - Island unlock prompt UI
 */

import { DOMUtils } from '@core/DOMUtils';
import { GameState } from '@core/State';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import type { Island } from '../types/world';

let currentUnlockTarget: Island | null = null;

export function createUnlockPrompt(onTryUnlock: () => void): void {
    const prompt = DOMUtils.create('div', {
        id: 'unlock-prompt',
        className: 'unlock-prompt hidden',
        html: `
            <div class="unlock-prompt-content">
                <div class="unlock-island-name"></div>
                <div class="unlock-cost"><span class="cost-amount"></span> Gold</div>
                <button class="unlock-btn">Unlock</button>
            </div>
        `
    });
    document.getElementById('app')?.appendChild(prompt);
    prompt.querySelector('.unlock-btn')?.addEventListener('click', onTryUnlock);
}

export function showUnlockPrompt(island: Island): void {
    if (currentUnlockTarget === island) return;

    currentUnlockTarget = island;
    const prompt = document.getElementById('unlock-prompt');
    if (!prompt) return;

    const nameEl = prompt.querySelector('.unlock-island-name');
    const costEl = prompt.querySelector('.cost-amount');
    if (nameEl) nameEl.textContent = island.name;
    if (costEl) costEl.textContent = String(island.unlockCost);

    const gold = GameState ? GameState.get('gold') || 0 : 0;
    const btn = prompt.querySelector('.unlock-btn') as HTMLButtonElement | null;
    if (btn) {
        if (gold >= island.unlockCost) {
            btn.disabled = false;
            btn.textContent = 'Unlock';
        } else {
            btn.disabled = true;
            btn.textContent = `Need ${island.unlockCost - gold} more`;
        }
    }

    prompt.classList.remove('hidden');
}

export function hideUnlockPrompt(): void {
    currentUnlockTarget = null;
    document.getElementById('unlock-prompt')?.classList.add('hidden');
}

export function tryUnlock(): void {
    if (!currentUnlockTarget) return;

    if (EventBus && GameConstants) {
        EventBus.emit(GameConstants.Events.REQUEST_UNLOCK, {
            gridX: currentUnlockTarget.gridX,
            gridY: currentUnlockTarget.gridY,
            cost: currentUnlockTarget.unlockCost
        });
    }
}

export function getCurrentUnlockTarget(): Island | null {
    return currentUnlockTarget;
}
