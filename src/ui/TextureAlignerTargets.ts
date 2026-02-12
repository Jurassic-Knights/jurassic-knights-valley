/**
 * TextureAlignerTargets – Target definitions forTexture Aligner tool.
 */

export const TEXTURE_ALIGNER_TARGETS: { id: string; name: string; selector: string }[] = [
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
