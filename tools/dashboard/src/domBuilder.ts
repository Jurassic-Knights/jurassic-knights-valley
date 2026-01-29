/**
 * Lightweight DOM Builder
 * Replacement for "String Soup" concatenation
 */

export interface ElementProps {
    className?: string;
    class?: string;
    style?: Partial<CSSStyleDeclaration> | string;
    [key: string]: any;
}

export type Child = HTMLElement | string | number | null | undefined | false;

/**
 * Helper to create DOM elements
 * @param tag HTML tag name
 * @param props Attribute object (className, style, onclick, etc)
 * @param children Array of DOM nodes or strings
 */
export function h(tag: string, props: ElementProps = {}, children: Child[] = []): HTMLElement {
    const el = document.createElement(tag);

    // Apply Props
    Object.entries(props).forEach(([key, val]) => {
        if (key === 'className' || key === 'class') {
            el.className = val as string;
        } else if (key === 'style') {
            if (typeof val === 'string') {
                el.style.cssText = val;
            } else if (typeof val === 'object') {
                Object.assign(el.style, val);
            }
        } else if (key.startsWith('on')) {
            if (typeof val === 'function') {
                // Event Listener (Function)
                const eventName = key.substring(2).toLowerCase();
                el.addEventListener(eventName, val as EventListener);
            } else {
                // Inline Handler (String) - MUST be an attribute
                el.setAttribute(key, String(val));
            }
        } else if (key.startsWith('data-')) {
            el.setAttribute(key, String(val));
        } else {
            // Direct Property or Attribute
            if (key in el) {
                (el as any)[key] = val;
            }

            // For outerHTML serialization, we MUST set attributes for certain props
            // even if they exist as properties, otherwise they won't show up in the string
            if (key === 'value') {
                el.setAttribute('value', String(val));
            } else if (key === 'placeholder') {
                el.setAttribute('placeholder', String(val));
            } else if ((key === 'checked' || key === 'selected' || key === 'disabled') && val) {
                el.setAttribute(key, '');
            } else if (key !== 'value' && key !== 'placeholder' && !(key in el)) {
                // Determine if we should set attribute for other keys
                el.setAttribute(key, String(val));
            }
        }
    });

    // Append Children
    children.forEach(child => {
        if (child === null || child === undefined || child === false) return;

        if (child instanceof Node) {
            el.appendChild(child);
        } else {
            el.appendChild(document.createTextNode(String(child)));
        }
    });

    return el;
}

/**
 * Renders an element to an HTML string
 * Used for transitioning legacy code that expects string returns
 */
export function renderToString(el: HTMLElement): string {
    return el.outerHTML;
}
