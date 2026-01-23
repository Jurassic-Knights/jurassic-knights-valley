/**
 * UI Theme - Configuration for UI element positioning and theming
 */
interface UIThemeElement {
    img: string | null;
    x: number;
    y: number;
    scale: number;
}

interface UITheme {
    footer: UIThemeElement;
    quest: UIThemeElement;
    resolve: UIThemeElement;
    resources: UIThemeElement;
    status: UIThemeElement;
}

declare global {
    interface Window {
        UI_THEME: UITheme;
    }
}

window.UI_THEME = {
    footer: { img: 'ui_footer_dashboard.png', x: 50, y: 50, scale: 100 },
    quest: { img: 'ui_panel_parchment.png', x: 50, y: 50, scale: 100 },
    resolve: { img: null, x: 50, y: 50, scale: 100 },
    resources: { img: null, x: 50, y: 50, scale: 100 },
    status: { img: null, x: 50, y: 50, scale: 100 },
};

export { };
