/**
 * UI Manifest - List of UI asset files
 */
declare global {
    interface Window {
        UI_MANIFEST: string[];
    }
}

window.UI_MANIFEST = [
    'ui_footer_dashboard.png',
    'ui_footer_dashboard_clean.png',
    'ui_panel_parchment.png',
    'ui_panel_parchment_clean.png',
    'ui_button_set.png',
    'ui_button_set_clean.png',
];

export { };
