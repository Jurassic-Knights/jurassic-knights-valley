/**
 * MinimapSystem
 * Renders a miniature world map showing islands, biomes, and hero position.
 * 
 * Owner: UI Engineer
 */

class MinimapSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.modal = null;
        this.isOpen = false;
        this.scale = 1;

        console.log('[MinimapSystem] Constructed');
    }

    init(game) {
        this.game = game;

        // Cache DOM elements
        this.modal = document.getElementById('modal-map');
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas?.getContext('2d');

        // Setup button handlers
        const btnMap = document.getElementById('btn-map');
        const btnClose = document.getElementById('btn-close-map');

        if (btnMap) {
            btnMap.addEventListener('click', () => this.toggle());
        }
        if (btnClose) {
            btnClose.addEventListener('click', () => this.close());
        }

        // Close on click outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }

        console.log('[MinimapSystem] Initialized');
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.modal) return;
        this.modal.style.display = 'flex';
        this.isOpen = true;
        this.render();
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.isOpen = false;
    }

    /**
     * Render the minimap showing world, islands, and hero
     */
    render() {
        if (!this.ctx || !this.canvas) return;

        const islandManager = this.game?.getSystem('IslandManager');
        const hero = this.game?.hero;

        if (!islandManager) {
            console.warn('[MinimapSystem] No IslandManager available');
            return;
        }

        const worldSize = islandManager.getWorldSize();
        const canvasSize = this.canvas.width;

        // Calculate scale to fit world in canvas
        this.scale = canvasSize / Math.max(worldSize.width, worldSize.height);

        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw background (open world biomes)
        ctx.fillStyle = '#1a2633';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw water between islands
        ctx.fillStyle = '#0a4b6e';
        const padding = islandManager.mapPadding * this.scale;
        ctx.fillRect(
            padding,
            padding,
            (worldSize.width - islandManager.mapPadding * 2) * this.scale,
            (worldSize.height - islandManager.mapPadding * 2) * this.scale
        );

        // Draw islands
        const islands = islandManager.islands || [];
        for (const island of islands) {
            const x = island.worldX * this.scale;
            const y = island.worldY * this.scale;
            const w = island.width * this.scale;
            const h = island.height * this.scale;

            // Island color based on state
            if (island.type === 'home') {
                ctx.fillStyle = '#4CAF50'; // Green for home
            } else if (island.unlocked) {
                ctx.fillStyle = '#2196F3'; // Blue for unlocked
            } else {
                ctx.fillStyle = '#37474F'; // Gray for locked
            }

            ctx.fillRect(x, y, w, h);

            // Island border
            ctx.strokeStyle = island.unlocked ? '#fff' : '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);

            // Zone name (small text)
            if (island.name && w > 30) {
                ctx.fillStyle = island.unlocked ? '#fff' : '#888';
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    island.name.split(' ')[0].substring(0, 6),
                    x + w / 2,
                    y + h / 2 + 3
                );
            }
        }

        // Draw bridges between unlocked islands
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        for (const island of islands) {
            if (!island.unlocked) continue;

            const cx = (island.worldX + island.width / 2) * this.scale;
            const cy = (island.worldY + island.height / 2) * this.scale;

            // Check each neighbor
            for (const neighbor of islands) {
                if (!neighbor.unlocked) continue;
                if (neighbor === island) continue;

                // Only draw to right/bottom neighbors to avoid duplicates
                if (neighbor.gridX === island.gridX + 1 && neighbor.gridY === island.gridY) {
                    // East bridge
                    const nx = (neighbor.worldX + neighbor.width / 2) * this.scale;
                    const ny = (neighbor.worldY + neighbor.height / 2) * this.scale;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();
                }
                if (neighbor.gridY === island.gridY + 1 && neighbor.gridX === island.gridX) {
                    // South bridge
                    const nx = (neighbor.worldX + neighbor.width / 2) * this.scale;
                    const ny = (neighbor.worldY + neighbor.height / 2) * this.scale;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();
                }
            }
        }

        // Draw enemies as red dots
        if (window.EntityManager) {
            const enemies = EntityManager.getByType('Enemy');
            ctx.fillStyle = '#F44336';
            for (const enemy of enemies) {
                if (!enemy.active || enemy.isDead) continue;
                const ex = enemy.x * this.scale;
                const ey = enemy.y * this.scale;
                ctx.beginPath();
                ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw bosses as larger pulsing icons
            const bosses = EntityManager.getByType('Boss');
            for (const boss of bosses) {
                if (!boss.active || boss.isDead) continue;
                const bx = boss.x * this.scale;
                const by = boss.y * this.scale;

                // Pulsing glow effect
                const pulse = Math.sin(Date.now() / 150) * 0.3 + 1;

                // Draw glow
                ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(bx, by, 10 * pulse, 0, Math.PI * 2);
                ctx.fill();

                // Draw boss marker (skull-ish)
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(bx, by, 6, 0, Math.PI * 2);
                ctx.fill();

                // Draw skull indicator
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☠', bx, by);
            }
        }

        // Draw hero position
        if (hero) {
            const hx = hero.x * this.scale;
            const hy = hero.y * this.scale;

            // Pulsing effect
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 1;

            // Hero arrow/triangle pointing in facing direction
            ctx.save();
            ctx.translate(hx, hy);

            // Draw glow
            ctx.fillStyle = 'rgba(255, 87, 34, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Draw hero marker
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(5, 6);
            ctx.lineTo(-5, 6);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Update called each frame (for live minimap if needed in future)
     */
    update(dt) {
        // Re-render if open to show hero movement
        if (this.isOpen) {
            this.render();
        }
    }
}

window.MinimapSystem = new MinimapSystem();
if (window.Registry) Registry.register('MinimapSystem', window.MinimapSystem);
