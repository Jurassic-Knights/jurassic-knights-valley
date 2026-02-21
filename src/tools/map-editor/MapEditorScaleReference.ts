/**
 * MapEditorScaleReference - Hero scale reference overlay in the map editor
 *
 * Displays the hero sprite in the bottom-right corner at the same scale as
 * in-world objects at the current zoom, so editors can always see accurate scale.
 */
import * as PIXI from 'pixi.js';
import { AssetLoader } from '@core/AssetLoader';
import { RenderConfig } from '@config/RenderConfig';
import { Logger } from '@core/Logger';

const HERO_ASSET_ID = 'hero_t1_01';
const PADDING = 12;
const BACKGROUND_PADDING = 4;
const BUTTON_GAP = 8;

export interface ScaleReferenceOverlay {
    container: PIXI.Container;
    update(zoom: number, canvasWidth: number, canvasHeight: number): void;
    destroy(): void;
}

export interface ScaleReferenceOptions {
    /** Called when user clicks the herospawn button. Enter placement mode and call back when done. */
    onHeroSpawnClick?: () => void;
}

/**
 * Create the hero scale reference overlay.
 * Add the returned container to app.stage (not worldContainer) so it stays in screen space.
 * Shows herospawn button even when hero image fails to load.
 */
export async function createScaleReferenceOverlay(
    app: PIXI.Application,
    options?: ScaleReferenceOptions
): Promise<ScaleReferenceOverlay | null> {
    app.stage.sortableChildren = true;
    const container = new PIXI.Container();
    container.zIndex = 10000;
    container.sortableChildren = true;
    app.stage.addChild(container);

    const heroW = RenderConfig.Hero.WIDTH;
    const heroH = RenderConfig.Hero.HEIGHT;

    let sprite: PIXI.Sprite | null = null;
    let background: PIXI.Graphics | null = null;
    let heroSpawnBtn: PIXI.Container | null = null;

    try {
        const imageSource = await AssetLoader.preloadImage(HERO_ASSET_ID);
        if (imageSource) {
            const texture = PIXI.Texture.from(imageSource);
            sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(1, 1); // anchor bottom-right
            sprite.width = heroW;
            sprite.height = heroH;
            sprite.alpha = 0.95;
            container.addChild(sprite);
        } else {
            Logger.warn('[MapEditorScaleReference] Hero image not available, showing button only');
        }

        background = new PIXI.Graphics();
        background.zIndex = -1;
        container.addChildAt(background, 0);

        if (options?.onHeroSpawnClick) {
            const btnBg = new PIXI.Graphics();
            btnBg.zIndex = -1;
            const btnText = new PIXI.Text({
                text: 'herospawn',
                style: { fill: 0xffffff, fontSize: 11, fontFamily: 'system-ui, sans-serif' }
            });
            btnText.anchor.set(0.5, 0.5);
            const btn = new PIXI.Container();
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.addChild(btnBg);
            btn.addChild(btnText);
            btn.on('pointerdown', () => options.onHeroSpawnClick!());
            container.addChild(btn);
            heroSpawnBtn = btn;
        }
    } catch (err) {
        Logger.warn('[MapEditorScaleReference] Failed to load hero image:', err);
        if (!background) {
            background = new PIXI.Graphics();
            background.zIndex = -1;
            container.addChildAt(background, 0);
        }
        if (!heroSpawnBtn && options?.onHeroSpawnClick) {
            const btnBg = new PIXI.Graphics();
            btnBg.zIndex = -1;
            const btnText = new PIXI.Text({
                text: 'herospawn',
                style: { fill: 0xffffff, fontSize: 11, fontFamily: 'system-ui, sans-serif' }
            });
            btnText.anchor.set(0.5, 0.5);
            const btn = new PIXI.Container();
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.addChild(btnBg);
            btn.addChild(btnText);
            btn.on('pointerdown', () => options.onHeroSpawnClick!());
            container.addChild(btn);
            heroSpawnBtn = btn;
        }
    }

    let lastZoom = -1;
    let lastCanvasW = -1;
    let lastCanvasH = -1;
    let spriteLoaded = false;

    function update(zoom: number, canvasWidth: number, canvasHeight: number): void {
        if (!background) return;

        const currentSpriteLoaded = sprite !== null;
        if (zoom === lastZoom && canvasWidth === lastCanvasW && canvasHeight === lastCanvasH && currentSpriteLoaded === spriteLoaded) {
            return;
        }

        lastZoom = zoom;
        lastCanvasW = canvasWidth;
        lastCanvasH = canvasHeight;
        spriteLoaded = currentSpriteLoaded;

        const screenW = heroW * zoom;
        const screenH = heroH * zoom;

        if (sprite) {
            sprite.width = screenW;
            sprite.height = screenH;
            sprite.position.set(canvasWidth - PADDING, canvasHeight - PADDING);
        }

        const bgLeft = canvasWidth - PADDING - screenW - BACKGROUND_PADDING;
        const bgBottom = canvasHeight - PADDING - screenH - BACKGROUND_PADDING;
        const bgW = screenW + BACKGROUND_PADDING * 2;
        const bgH = screenH + BACKGROUND_PADDING * 2;

        background.clear();
        if (sprite) {
            background.roundRect(bgLeft, bgBottom, bgW, bgH, 4);
            background.fill(0x000000, 0.5);
        }

        if (heroSpawnBtn) {
            const btnW = 72;
            const btnH = 22;
            const btnLeft = sprite ? bgLeft - btnW - BUTTON_GAP : canvasWidth - PADDING - btnW;
            const btnBottom = sprite ? bgBottom + (bgH - btnH) / 2 : canvasHeight - PADDING - btnH;
            heroSpawnBtn.position.set(btnLeft + btnW / 2, btnBottom + btnH / 2);
            const btnBg = heroSpawnBtn.children[0] as PIXI.Graphics;
            if (btnBg) {
                btnBg.clear();
                btnBg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
                btnBg.fill(0x2d4a3e, 0.9);
            }
        }
    }

    function destroy(): void {
        sprite?.destroy();
        background?.destroy();
        container.destroy();
        sprite = null;
        background = null;
    }

    return {
        container,
        update,
        destroy
    };
}
