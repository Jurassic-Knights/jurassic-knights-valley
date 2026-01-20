/**
 * Texture Aligner Tool
 * Helper to alignment GenAI 1:1 textures within rectangular UI containers.
 * Allows live editing of background-position and background-size.
 */
class TextureAlignerService {
    constructor() {
        this.active = false;
        this.target = null;
        this.targetId = null;
        this.container = null;
        this.fileHandle = null; // for File System Access API
        this.targets = [
            { id: 'footer', name: 'Footer Dashboard', selector: '#ui-footer-zone .footer-bar' },
            { id: 'quest', name: 'Quest Frame', selector: '.quest-frame' },
            { id: 'resolve', name: 'Resolve Bar', selector: '#ui-resolve-bar' },
            { id: 'resources', name: 'Resource Counter', selector: '.resource-counter' },
            { id: 'status', name: 'Status Gauges', selector: '#ui-hud-left' },
            { id: 'char_frame', name: 'Character Frame', selector: '.character-frame' },
            { id: 'gauge_health', name: 'Health Gauge', selector: '.health-gauge' },
            { id: 'gauge_stamina', name: 'Stamina Gauge', selector: '.stamina-gauge' },
            { id: 'gauge_track', name: 'Gauge Tracks', selector: '.gauge-track' },
            { id: 'btn_main', name: 'Action Buttons', selector: '.action-btn' },
            { id: 'btn_center', name: 'Center Pedestal', selector: '.center-slot' }
        ];

        // Defaults
        this.state = {
            x: 50,
            y: 50,
            scale: 100,
            img: ''
        };
        this.availableImages = [];
    }

    toggle() {
        if (this.active) {
            this.destroy();
        } else {
            this.init();
        }
    }

    init() {
        this.active = true;
        // Load from global manifest (JS-based for local file support)
        if (window.UI_MANIFEST) {
            this.availableImages = window.UI_MANIFEST;
        } else {
            Logger.warn('UI_MANIFEST missing, using fallback');
            this.availableImages = ['ui_footer_dashboard.png'];
        }

        this.createUI();
        this.selectTarget(0); // Default to first
        document.body.classList.add('aligner-active');
    }

    destroy() {
        this.active = false;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        document.body.classList.remove('aligner-active');
    }

    createUI() {
        const div = document.createElement('div');
        div.id = 'texture-aligner-ui';
        div.style.cssText = `
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
        `;

        let options = this.targets
            .map((t, i) => `<option value="${i}">${t.name}</option>`)
            .join('');
        let imgOptions = (this.availableImages || [])
            .map((img) => `<option value="${img}">${img}</option>`)
            .join('');

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
                <div id="status-connected" style="display:none; color:#4CAF50; font-size:11px; text-align:center; margin-bottom:5px;">âœ“ AUTO-SAVE ENABLED</div>
                
                <button id="btn-save" style="width:100%; padding:8px; background:#4CAF50; color:white; border:none; cursor:pointer;">DOWNLOAD (Manual)</button>
            </div>
            <button id="btn-close" style="width:100%; margin-top:5px; padding:5px; background:#f44336; color:white; border:none; cursor:pointer;">CLOSE</button>
        `;

        document.body.appendChild(div);
        this.container = div;

        // Bind Events
        div.querySelector('#ta-target').addEventListener('change', (e) =>
            this.selectTarget(e.target.value)
        );
        div.querySelector('#btn-load').addEventListener('click', () => this.loadImage());

        // Sync Sliders and Number Inputs
        const bindInput = (rangeId, numId, key) => {
            const range = div.querySelector(`#${rangeId}`);
            const num = div.querySelector(`#${numId}`);

            range.addEventListener('input', (e) => this.updateState(key, e.target.value));
            num.addEventListener('input', (e) => this.updateState(key, e.target.value));
        };

        bindInput('inp-x', 'num-x', 'x');
        bindInput('inp-y', 'num-y', 'y');
        bindInput('inp-s', 'num-s', 'scale');
        bindInput('inp-sx', 'num-sx', 'scaleX');
        bindInput('inp-sy', 'num-sy', 'scaleY');

        div.querySelector('#btn-reset').addEventListener('click', () => this.resetState());
        div.querySelector('#btn-close').addEventListener('click', () => this.destroy());
        div.querySelector('#btn-save').addEventListener('click', () => this.exportTheme());
        div.querySelector('#btn-connect').addEventListener('click', () => this.connectFileHandle());
    }

    resetState() {
        this.updateState('x', 50);
        this.updateState('y', 50);
        this.updateState('scale', 500);
        this.updateState('scaleX', 500);
        this.updateState('scaleY', 500);
    }

    // ... (connectFileHandle, saveToDisk, loadImage same as before) ...

    async connectFileHandle() {
        if (!window.showOpenFilePicker)
            return alert('Your browser does not support File System Access API.');

        try {
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Javascript Config',
                        accept: { 'text/javascript': ['.js'] }
                    }
                ],
                multiple: false
            });
            this.fileHandle = handle;

            // UI Update
            this.container.querySelector('#btn-connect').style.display = 'none';
            this.container.querySelector('#status-connected').style.display = 'block';
            this.container.querySelector('#btn-save').innerText = 'SAVE TO DISK';

            // Override export logic to use direct write
            this.container.querySelector('#btn-save').onclick = () => this.saveToDisk();

            alert(`Connected to ${handle.name}. Click 'SAVE TO DISK' to overwrite.`);
        } catch (err) {
            Logger.warn('File access denied:', err);
        }
    }

    async saveToDisk() {
        if (!this.fileHandle) return this.exportTheme(); // Fallback

        const json = JSON.stringify(window.UI_THEME_RUNTIME || {}, null, 4);
        const fileContent = `window.UI_THEME = ${json};`;

        try {
            const writable = await this.fileHandle.createWritable();
            await writable.write(fileContent);
            await writable.close();
            // alert('Saved to ui_theme.js successfully!'); // Silent save is better for rapid tweaks
        } catch (err) {
            Logger.error('Save failed:', err);
            alert('Save failed (see console).');
        }
    }

    loadImage() {
        if (!this.targetId) return;
        const filename = this.container.querySelector('#inp-img').value;
        if (!filename) return alert('Select filename');

        this.state.img = filename;

        const img = new Image();
        img.onload = () => {
            this.recalculateAspect(img);
            // On fresh load, RESET to Virtual 500/500 (Source Aspect)
            this.state.scale = 500;
            // Calculate RAW CSS state based on 500 Virtual
            this.state.scaleX = 500 * this.multX;
            this.state.scaleY = 500 * this.multY;

            this.updateUIInputs();
            this.applyStyle();
            this.persist();
        };
        img.src = `assets/ui/${filename}`;
    }

    recalculateAspect(img) {
        if (!img || !img.naturalWidth) {
            this.multX = 1;
            this.multY = 1;
            return;
        }

        // Multipliers to convert "Virtual Slider %" (Image Scale) -> "CSS %" (Container Relative)
        // Slider 100% = Image Natural Size
        // Formula: (ImagePixels / ContainerPixels)
        this.multX = img.naturalWidth / this.target.clientWidth;
        this.multY = img.naturalHeight / this.target.clientHeight;

        if (!isFinite(this.multX)) this.multX = 1;
        if (!isFinite(this.multY)) this.multY = 1;
    }

    updateUIInputs() {
        if (!this.container) return;
        this.container.querySelector('#inp-x').value = this.state.x;
        this.container.querySelector('#num-x').value = Math.round(this.state.x);
        this.container.querySelector('#inp-y').value = this.state.y;
        this.container.querySelector('#num-y').value = Math.round(this.state.y);

        this.container.querySelector('#inp-s').value = this.state.scale;
        this.container.querySelector('#num-s').value = this.state.scale;

        // Virtual Values: State (CSS) / Multiplier = Slider (Image Relative)
        const virtX = this.multX ? Math.round(this.state.scaleX / this.multX) : this.state.scaleX;
        const virtY = this.multY ? Math.round(this.state.scaleY / this.multY) : this.state.scaleY;

        this.container.querySelector('#inp-sx').value = virtX;
        this.container.querySelector('#num-sx').value = virtX;

        this.container.querySelector('#inp-sy').value = virtY;
        this.container.querySelector('#num-sy').value = virtY;

        this.container.querySelector('#inp-img').value = this.state.img || '';
    }

    selectTarget(index) {
        this.currentTargetDef = this.targets[index];
        this.targetId = this.currentTargetDef.id;

        // Select ALL matching elements
        this.targetsList = document.querySelectorAll(this.currentTargetDef.selector);
        this.target = this.targetsList[0]; // Keep primary for reference

        // Reset multipliers safely
        this.multX = 1;
        this.multY = 1;

        // Load CSS State
        const current = (window.UI_THEME_RUNTIME && window.UI_THEME_RUNTIME[this.targetId]) || {};
        this.state = {
            x: current.x !== undefined ? current.x : 50,
            y: current.y !== undefined ? current.y : 50,
            scale: current.scale !== undefined ? current.scale : 100,
            scaleX: current.scaleX !== undefined ? current.scaleX : current.scale || 100,
            scaleY: current.scaleY !== undefined ? current.scaleY : current.scale || 100,
            img: current.img || ''
        };

        // If image exists, calculate multipliers before updating UI
        if (this.state.img) {
            const img = new Image();
            img.onload = () => {
                this.recalculateAspect(img);
                this.applyStyle(); // Re-apply to ensure sync
            };
            img.src = `assets/ui/${this.state.img}`;
        }

        this.updateUIInputs();
        this.applyStyle();
    }

    updateState(key, val) {
        val = parseFloat(val); // Ensure numeric

        if (key === 'scaleX' && this.multX) {
            // Input (Virtual) -> State (CSS)
            this.state.scaleX = val * this.multX;
            this.container.querySelector('#num-sx').value = val;
            this.container.querySelector('#inp-sx').value = val;
        } else if (key === 'scaleY' && this.multY) {
            this.state.scaleY = val * this.multY;
            this.container.querySelector('#num-sy').value = val;
            this.container.querySelector('#inp-sy').value = val;
        } else {
            this.state[key] = val;
            if (key !== 'img') {
                const map = { x: 'num-x', y: 'num-y', scale: 'num-s' };
                if (map[key]) this.container.querySelector(`#${map[key]}`).value = val;

                // Don't auto-update scaleX/Y inputs here as they are virtual
                const inpMap = { x: 'inp-x', y: 'inp-y', scale: 'inp-s' };
                if (inpMap[key]) this.container.querySelector(`#${inpMap[key]}`).value = val;
            }
        }

        this.applyStyle();
        this.persist();
    }

    applyStyle() {
        if (!this.targetsList || this.targetsList.length === 0) return;

        // Render locally instantly
        const def = this.state;
        const bgPos = `${def.x}% ${def.y}%`;

        let master = def.scale !== undefined ? def.scale : 500; // Default 500 (1.0x)
        let sxRaw = def.scaleX !== undefined ? def.scaleX : 500;
        let syRaw = def.scaleY !== undefined ? def.scaleY : 500;

        // New Logic: Input 500 = 1.0 multiplier
        // final = sx * (500/500) = sx
        let finalX = sxRaw * (master / 500);
        let finalY = syRaw * (master / 500);

        let bgSize = `${finalX}% ${finalY}%`;

        this.targetsList.forEach((el) => {
            el.style.backgroundPosition = bgPos;
            el.style.backgroundSize = bgSize;

            if (def.img) {
                el.style.backgroundImage = `url("assets/ui/${def.img}")`;
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundColor = 'transparent';
                el.style.border = 'none';
                el.style.boxShadow = 'none';
            }
        });
    }

    persist() {
        // Save to Runtime Global + LocalStorage
        if (!window.UI_THEME_RUNTIME) window.UI_THEME_RUNTIME = {};

        window.UI_THEME_RUNTIME[this.targetId] = { ...this.state };

        localStorage.setItem('JURASSIC_UI_THEME', JSON.stringify(window.UI_THEME_RUNTIME));
    }

    exportTheme() {
        const json = JSON.stringify(window.UI_THEME_RUNTIME || {}, null, 4);
        const fileContent = `window.UI_THEME = ${json};`;

        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ui_theme.js';
        link.click();
    }
}

window.TextureAligner = new TextureAlignerService();

