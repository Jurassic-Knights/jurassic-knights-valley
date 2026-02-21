/**
 * WeaponWheelStyles - CSS for Square Tree Filter Menu
 */

export const WEAPON_WHEEL_CSS = `
.weapon-wheel-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 2000;
    display: none;
    touch-action: none;
}
.weapon-wheel-overlay.open {
    display: block;
}
.wheel-backdrop {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.1);
}
.wheel-tree-container {
    position: absolute;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 4px;
    z-index: 2001;
    pointer-events: none;
    transform: translateX(-50%);
    padding-bottom: 4px;
    width: auto;
    min-width: 100px;
}
.tree-row {
    display: flex;
    gap: 8px;
    background: rgba(20, 18, 10, 0.95);
    padding: 6px;
    border: 2px solid #5a4d33;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.6);
    animation: slideUp 0.1s ease-out;
    pointer-events: auto;
    justify-content: center;
    position: relative;
}
.tree-row::after {
    content: '';
    position: absolute;
    top: 100%;
    margin-top: 2px;
    left: 50%;
    width: 2px;
    height: 4px;
    background: #ffd700;
    transform: translateX(-50%);
    opacity: 0.6;
}
.tree-row:first-child::after {
    display: none;
}
.tree-btn {
    width: 68px; height: 68px;
    background: #2a251b;
    border: 2px solid #5a4d33;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.1s, background 0.1s;
    position: relative;
}
.tree-btn[data-hover="true"], .tree-btn.active {
    background: #4e4430;
    border-color: #ffd700;
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    z-index: 10;
}
.tree-btn-icon {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    margin: 0;
    pointer-events: none;
    z-index: 1;
}
.tree-btn-label {
    position: absolute;
    bottom: 2px;
    left: 0;
    width: 100%;
    font-size: 14px;
    text-align: center;
    z-index: 2;
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
}
.tree-btn.active .tree-btn-label {
    color: #ffd700;
}
@keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
