/**
 * Texture Aligner Tool
 * Helper to align GenAI 1:1 textures within rectangular UI containers.
 */
import { Logger } from '@core/Logger';
import { TEXTURE_ALIGNER_TARGETS } from './TextureAlignerTargets';
import { createAlignerUI, bindAlignerEvents } from './TextureAlignerUI';

interface FileSystemFileHandle {
    kind: 'file';
    name: string;
    createWritable(options?: { keepExistingData?: boolean }): Promise<WritableStream & { write(d: string | BufferSource | Blob): Promise<void>; close(): Promise<void> }>;
    getFile(): Promise<File>;
}
declare function showOpenFilePicker(options?: { types?: { description?: string; accept: Record<string, string[]> }[]; multiple?: boolean }): Promise<FileSystemFileHandle[]>;

declare const UI_MANIFEST: string[];
declare const UI_THEME_RUNTIME: any;

class TextureAlignerService {
    // Property declarations
    active: boolean;
    target: HTMLElement | null;
    targetId: string | null;
    container: HTMLElement | null;
    fileHandle: FileSystemFileHandle | null;
    targets: { id: string; name: string; selector: string }[];
    state: { x: number; y: number; scale: number; scaleX?: number; scaleY?: number; img: string };
    availableImages: string[];
    currentTargetDef: { id: string; name: string; selector: string } | null;
    targetsList: NodeListOf<Element> | null = null;
    multX: number = 1;
    multY: number = 1;

    constructor() {
        this.active = false;
        this.target = null;
        this.targetId = null;
        this.container = null;
        this.fileHandle = null; // for File System Access API
        this.currentTargetDef = null;
        this.targets = TEXTURE_ALIGNER_TARGETS;

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
        if (UI_MANIFEST) {
            this.availableImages = UI_MANIFEST;
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
        const div = createAlignerUI(this.targets, this.availableImages);
        document.body.appendChild(div);
        this.container = div;

        bindAlignerEvents(div, {
            onTargetChange: (i) => this.selectTarget(i),
            onLoad: () => this.loadImage(),
            onReset: () => this.resetState(),
            onClose: () => this.destroy(),
            onExport: () => this.exportTheme(),
            onConnect: () => this.connectFileHandle(),
            onStateChange: (k, v) => this.updateState(k, v)
        });
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
        if (!showOpenFilePicker)
            return alert('Your browser does not support File System Access API.');

        try {
            const [handle] = await showOpenFilePicker({
                types: [
                    {
                        description: 'Javascript Config',
                        accept: { 'text/javascript': ['.js'] }
                    }
                ],
                multiple: false
            });
            this.fileHandle = handle;

            if (!this.container) return;
            // UI Update
            (this.container.querySelector('#btn-connect') as HTMLElement).style.display = 'none';
            (this.container.querySelector('#status-connected') as HTMLElement).style.display =
                'block';
            (this.container.querySelector('#btn-save') as HTMLElement).innerText = 'SAVE TO DISK';

            // Override export logic to use direct write
            (this.container.querySelector('#btn-save') as HTMLElement).onclick = () =>
                this.saveToDisk();

            alert(`Connected to ${handle.name}. Click 'SAVE TO DISK' to overwrite.`);
        } catch (err) {
            Logger.warn('File access denied:', err);
        }
    }

    async saveToDisk() {
        if (!this.fileHandle) return this.exportTheme(); // Fallback

        const json = JSON.stringify(UI_THEME_RUNTIME || {}, null, 4);
        const fileContent = `UI_THEME = ${json};`;

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
        if (!this.targetId || !this.container) return;
        const filename = (this.container.querySelector('#inp-img') as HTMLInputElement).value;
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

    recalculateAspect(img: HTMLImageElement) {
        if (!img || !img.naturalWidth || !this.target) {
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
        (this.container.querySelector('#inp-x') as HTMLInputElement).value = String(this.state.x);
        (this.container.querySelector('#num-x') as HTMLInputElement).value = String(
            Math.round(this.state.x)
        );
        (this.container.querySelector('#inp-y') as HTMLInputElement).value = String(this.state.y);
        (this.container.querySelector('#num-y') as HTMLInputElement).value = String(
            Math.round(this.state.y)
        );

        (this.container.querySelector('#inp-s') as HTMLInputElement).value = String(
            this.state.scale
        );
        (this.container.querySelector('#num-s') as HTMLInputElement).value = String(
            this.state.scale
        );

        // Virtual Values: State (CSS) / Multiplier = Slider (Image Relative)
        const virtX = this.multX ? Math.round((this.state.scaleX || 500) / this.multX) : (this.state.scaleX || 500);
        const virtY = this.multY ? Math.round((this.state.scaleY || 500) / this.multY) : (this.state.scaleY || 500);

        (this.container.querySelector('#inp-sx') as HTMLInputElement).value = String(virtX);
        (this.container.querySelector('#num-sx') as HTMLInputElement).value = String(virtX);

        (this.container.querySelector('#inp-sy') as HTMLInputElement).value = String(virtY);
        (this.container.querySelector('#num-sy') as HTMLInputElement).value = String(virtY);

        (this.container.querySelector('#inp-img') as HTMLInputElement).value = this.state.img || '';
    }

    selectTarget(index: number) {
        this.currentTargetDef = this.targets[index];
        this.targetId = this.currentTargetDef.id;

        // Select ALL matching elements
        this.targetsList = document.querySelectorAll(this.currentTargetDef.selector);
        this.target = this.targetsList[0] as HTMLElement; // Keep primary for reference

        // Reset multipliers safely
        this.multX = 1;
        this.multY = 1;

        // Load CSS State
        const current = (UI_THEME_RUNTIME && UI_THEME_RUNTIME[this.targetId]) || {};
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

    updateState(key: string, val: string | number) {
        const numVal = parseFloat(String(val)); // Ensure numeric

        if (!this.container) return;
        if (key === 'scaleX' && this.multX) {
            // Input (Virtual) -> State (CSS)
            this.state.scaleX = numVal * this.multX;
            (this.container.querySelector('#num-sx') as HTMLInputElement).value = String(val);
            (this.container.querySelector('#inp-sx') as HTMLInputElement).value = String(val);
        } else if (key === 'scaleY' && this.multY) {
            this.state.scaleY = numVal * this.multY;
            (this.container.querySelector('#num-sy') as HTMLInputElement).value = String(val);
            (this.container.querySelector('#inp-sy') as HTMLInputElement).value = String(val);
        } else {
            // Safe assignment with key checking
            if (key in this.state && key !== 'img') {
                const stateKey = key as keyof Omit<typeof this.state, 'img'>;
                this.state[stateKey] = numVal;

                const map: Record<string, string> = { x: 'num-x', y: 'num-y', scale: 'num-s' };
                if (map[key]) {
                    const input = this.container.querySelector(`#${map[key]}`) as HTMLInputElement;
                    if (input) input.value = String(val);
                }

                // Don't auto-update scaleX/Y inputs here as they are virtual
                const inpMap: Record<string, string> = { x: 'inp-x', y: 'inp-y', scale: 'inp-s' };
                if (inpMap[key]) {
                    const input = this.container.querySelector(`#${inpMap[key]}`) as HTMLInputElement;
                    if (input) input.value = String(val);
                }
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

        const master = def.scale !== undefined ? def.scale : 500; // Default 500 (1.0x)
        const sxRaw = def.scaleX !== undefined ? def.scaleX : 500;
        const syRaw = def.scaleY !== undefined ? def.scaleY : 500;

        // New Logic: Input 500 = 1.0 multiplier
        // final = sx * (500/500) = sx
        const finalX = sxRaw * (master / 500);
        const finalY = syRaw * (master / 500);

        const bgSize = `${finalX}% ${finalY}%`;

        this.targetsList.forEach((el) => {
            (el as HTMLElement).style.backgroundPosition = bgPos;
            (el as HTMLElement).style.backgroundSize = bgSize;

            if (def.img) {
                (el as HTMLElement).style.backgroundImage = `url("assets/ui/${def.img}")`;
                (el as HTMLElement).style.backgroundRepeat = 'no-repeat';
                (el as HTMLElement).style.backgroundColor = 'transparent';
                (el as HTMLElement).style.border = 'none';
                (el as HTMLElement).style.boxShadow = 'none';
            }
        });
    }

    persist() {
        // Save to Runtime Global + LocalStorage
        if (!UI_THEME_RUNTIME) (window as Window).UI_THEME_RUNTIME = {};

        UI_THEME_RUNTIME[this.targetId as string] = { ...this.state };

        localStorage.setItem('JURASSIC_UI_THEME', JSON.stringify(UI_THEME_RUNTIME));
    }

    exportTheme() {
        const json = JSON.stringify(UI_THEME_RUNTIME || {}, null, 4);
        const fileContent = `UI_THEME = ${json};`;

        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ui_theme.js';
        link.click();
    }
}

const TextureAligner = new TextureAlignerService();

export { TextureAlignerService, TextureAligner };
