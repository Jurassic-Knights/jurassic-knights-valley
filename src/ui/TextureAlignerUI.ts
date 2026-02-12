/**
 * TextureAlignerUI – HTML template and control bindings for Texture Aligner.
 */
import { DOMUtils } from '@core/DOMUtils';

export function createAlignerUI(
    targets: { id: string; name: string; selector: string }[],
    availableImages: string[]
): HTMLDivElement {
    const div = DOMUtils.create('div', {
        id: 'texture-aligner-ui',
        cssText: `
            position: fixed;
            top: 60px; right: 20px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            border: 1px solid #8C7B65;
            color: #E6DCC8;
            padding: 15px;
            font-family: monospace;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            border-radius: 8px;
        `
    });

    const options = targets.map((t, i) => `<option value="${i}">${t.name}</option>`).join('');
    const imgOptions = (availableImages || []).map((img) => `<option value="${img}">${img}</option>`).join('');

    div.innerHTML = `
        <div style="font-weight:bold; margin-bottom:10px; color:#FFB347;">TEXTURE ALIGNER</div>
        <div style="margin-bottom:10px;">
            <label>Target:</label>
            <select id="ta-target" style="width:100%; background:#222; color:white; border:1px solid #555; padding:5px;">
                ${options}
            </select>
        </div>
        <div style="margin-bottom:15px; border-bottom:1px solid #444; padding-bottom:10px;">
            <label>Image (assets/ui/):</label>
            <div style="display:flex; gap:5px; margin-top:5px;">
                <select id="inp-img" style="flex:1; background:#222; color:white; border:1px solid #555; padding:5px;">
                    <option value="">-- Select Image --</option>
                    ${imgOptions}
                </select>
                <button id="btn-load" style="background:#2196F3; color:white; border:none; padding:5px 10px; cursor:pointer;">LOAD</button>
            </div>
        </div>
        <div class="control-group" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between;">
                <label>Pos X</label>
                <input type="number" id="num-x" value="50" style="width:60px; text-align:right;">
            </div>
            <input type="range" id="inp-x" min="-100" max="200" value="50" style="width:100%">
        </div>
        <div class="control-group" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between;">
                <label>Pos Y</label>
                <input type="number" id="num-y" value="50" style="width:60px; text-align:right;">
            </div>
            <input type="range" id="inp-y" min="-100" max="200" value="50" style="width:100%">
        </div>
        <div class="control-group" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between;">
                <label>Scale Master</label>
                <input type="number" id="num-s" value="500" style="width:60px; text-align:right;">
            </div>
            <input type="range" id="inp-s" min="1" max="1000" value="500" style="width:100%">
        </div>
        <div style="display:flex; gap:5px; margin-bottom:15px;">
            <div class="control-group" style="flex:1;">
                <div style="display:flex; justify-content:space-between;">
                    <label>Scale X</label>
                    <input type="number" id="num-sx" value="500" style="width:50px; text-align:right;">
                </div>
                <input type="range" id="inp-sx" min="1" max="1000" value="500" style="width:100%">
            </div>
            <div class="control-group" style="flex:1;">
                <div style="display:flex; justify-content:space-between;">
                    <label>Scale Y</label>
                    <input type="number" id="num-sy" value="500" style="width:50px; text-align:right;">
                </div>
                <input type="range" id="inp-sy" min="1" max="1000" value="500" style="width:100%">
            </div>
        </div>
        <div style="background:#222; padding:10px; font-size:10px; word-break:break-all; border:1px solid #444;">
            <code id="css-output">background-position: 50% 50%; background-size: 100% 100%;</code>
        </div>
        <button id="btn-reset" style="width:100%; margin-top:5px; padding:5px; background:#607D8B; color:white; border:none; cursor:pointer;">RESET SCALE / POS</button>
        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #444;">
            <button id="btn-connect" style="width:100%; margin-bottom:5px; padding:8px; background:#FF9800; color:white; border:none; cursor:pointer;">CONNECT TO ui_theme.js</button>
            <div id="status-connected" style="display:none; color:#4CAF50; font-size:11px; text-align:center; margin-bottom:5px;">✓ AUTO-SAVE ENABLED</div>
            <button id="btn-save" style="width:100%; padding:8px; background:#4CAF50; color:white; border:none; cursor:pointer;">DOWNLOAD (Manual)</button>
        </div>
        <button id="btn-close" style="width:100%; margin-top:5px; padding:5px; background:#f44336; color:white; border:none; cursor:pointer;">CLOSE</button>
    `;

    return div as HTMLDivElement;
}

export function bindAlignerEvents(
    div: HTMLElement,
    handlers: {
        onTargetChange: (index: number) => void;
        onLoad: () => void;
        onReset: () => void;
        onClose: () => void;
        onExport: () => void;
        onConnect: () => void;
        onStateChange: (key: string, val: string | number) => void;
    }
): void {
    div.querySelector('#ta-target')?.addEventListener('change', (e) =>
        handlers.onTargetChange(parseInt((e.target as HTMLInputElement).value, 10))
    );
    div.querySelector('#btn-load')?.addEventListener('click', () => handlers.onLoad());
    div.querySelector('#btn-reset')?.addEventListener('click', () => handlers.onReset());
    div.querySelector('#btn-close')?.addEventListener('click', () => handlers.onClose());
    div.querySelector('#btn-save')?.addEventListener('click', () => handlers.onExport());
    div.querySelector('#btn-connect')?.addEventListener('click', () => handlers.onConnect());

    const bindInput = (rangeId: string, numId: string, key: string) => {
        const range = div.querySelector(`#${rangeId}`) as HTMLInputElement;
        range?.addEventListener('input', (e) => handlers.onStateChange(key, (e.target as HTMLInputElement).value));
        const num = div.querySelector(`#${numId}`) as HTMLInputElement;
        num?.addEventListener('input', (e) => handlers.onStateChange(key, (e.target as HTMLInputElement).value));
    };
    bindInput('inp-x', 'num-x', 'x');
    bindInput('inp-y', 'num-y', 'y');
    bindInput('inp-s', 'num-s', 'scale');
    bindInput('inp-sx', 'num-sx', 'scaleX');
    bindInput('inp-sy', 'num-sy', 'scaleY');
}
