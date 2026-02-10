/**
 * DOM Utilities
 * Helper functions for creating and manipulating DOM elements.
 */
import { Logger } from './Logger';

interface CreateElementOptions {
    id?: string;
    className?: string; // Supports space-separated classes
    apiClass?: string; // For internal API hooks
    styles?: Partial<CSSStyleDeclaration>;
    text?: string;
    html?: string;
    parent?: HTMLElement;
    attributes?: Record<string, string>;
    cssText?: string;
    onClick?: (e: MouseEvent) => void;
}

export class DOMUtils {
    /**
     * Create an HTMLElement with fluent configuration
     */
    static create(tag: string, options: CreateElementOptions = {}): HTMLElement {
        const el = document.createElement(tag);

        if (options.id) el.id = options.id;

        if (options.className) {
            el.className = options.className;
        }

        if (options.styles) {
            Object.assign(el.style, options.styles);
        }

        if (options.cssText) {
            el.style.cssText = options.cssText;
        }

        if (options.text) {
            el.textContent = options.text;
        }

        if (options.html) {
            el.innerHTML = options.html;
        }

        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                el.setAttribute(key, value);
            }
        }

        if (options.onClick) {
            el.addEventListener('click', options.onClick);
        }

        if (options.parent) {
            options.parent.appendChild(el);
        }

        return el;
    }

    /**
     * Helper to create a canvas element
     */
    static createCanvas(width?: number, height?: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        if (width) canvas.width = width;
        if (height) canvas.height = height;
        return canvas;
    }

    /**
     * Get an element by ID dealing with null checks (optional strict mode)
     */
    static get<T extends HTMLElement>(id: string, strict: boolean = false): T | null {
        const el = document.getElementById(id);
        if (strict && !el) {
            Logger.error(`[DOMUtils] Element #${id} not found`);
        }
        return el as T;
    }
}
