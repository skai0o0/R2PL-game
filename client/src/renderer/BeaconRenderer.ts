import { Container, Graphics } from 'pixi.js';
import { GRID_CONFIG, THEME_COLORS } from '../constants/terminology';
import { ViewportManager } from '../core/ViewportManager';

interface ActiveBeacon {
  id: string;
  gridX: number;
  gridY: number;
  charcoalLoaded: number;
  maxCharcoal: number;
  isActive: boolean;
  phase: number;
}

/**
 * BeaconRenderer: Renders high-tech flame/plasma pillars when activated with Charcoal (Than củi).
 * Emits glowing energy rings and cyber particle sparks.
 */
export class BeaconRenderer {
  public readonly container: Container;
  private readonly viewportManager: ViewportManager;
  private readonly graphics: Graphics;

  private beacons: Map<string, ActiveBeacon> = new Map();

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    viewportManager.viewport.addChild(this.container);

    // Animation ticker
    viewportManager.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime);
    });
  }

  public registerBeacon(id: string, gridX: number, gridY: number, maxCharcoal: number = 5): void {
    this.beacons.set(id, {
      id,
      gridX,
      gridY,
      charcoalLoaded: 0,
      maxCharcoal,
      isActive: false,
      phase: Math.random() * 10,
    });
  }

  /**
   * Feed charcoal (Than củi) into a beacon
   */
  public addCharcoal(id: string, amount: number = 1): { activated: boolean; current: number; max: number } {
    const b = this.beacons.get(id);
    if (!b) return { activated: false, current: 0, max: 0 };

    b.charcoalLoaded = Math.min(b.maxCharcoal, b.charcoalLoaded + amount);
    if (b.charcoalLoaded >= b.maxCharcoal) {
      b.isActive = true;
    }
    return { activated: b.isActive, current: b.charcoalLoaded, max: b.maxCharcoal };
  }

  private update(delta: number): void {
    const g = this.graphics;
    g.clear();

    const ts = GRID_CONFIG.TILE_SIZE;
    const bounds = this.viewportManager.getVisibleTileBounds(4);

    this.beacons.forEach((b) => {
      // Culling
      if (
        b.gridX < bounds.minCol - 2 ||
        b.gridX > bounds.maxCol + 2 ||
        b.gridY < bounds.minRow - 2 ||
        b.gridY > bounds.maxRow + 2
      ) {
        return;
      }

      b.phase += 0.08 * delta;
      const cx = (b.gridX + 0.5) * ts;
      const cy = (b.gridY + 0.5) * ts;

      // Base Pedestal
      g.circle(cx, cy, ts * 0.8).stroke({
        color: THEME_COLORS.ELECTRIC_BLUE,
        width: 2,
        alpha: 0.8,
      });

      if (b.isActive) {
        // High-Tech Plasma Pillar of Fire (Predator Cyan + Electric Blue)
        const pulse = Math.sin(b.phase * 4);
        const radius = ts * (1.2 + pulse * 0.3);

        // Core flame
        g.circle(cx, cy, radius * 0.5).fill({
          color: 0xFFFFFF,
          alpha: 0.9,
        });

        // Middle energy flare
        g.circle(cx, cy, radius).fill({
          color: THEME_COLORS.PREDATOR_CYAN,
          alpha: 0.45,
        });

        // Expanding shockwave rings
        const ringPhase = (b.phase % (Math.PI * 2)) / (Math.PI * 2);
        const ringRadius = ts * (0.8 + ringPhase * 2.5);
        const ringAlpha = Math.max(0, 1 - ringPhase);

        g.circle(cx, cy, ringRadius).stroke({
          color: THEME_COLORS.PREDATOR_CYAN,
          width: 2.5,
          alpha: ringAlpha * 0.8,
        });

        // Beam vertical laser indication
        g.moveTo(cx, cy)
          .lineTo(cx, cy - ts * 4)
          .stroke({
            color: THEME_COLORS.PREDATOR_CYAN,
            width: 3 + pulse,
            alpha: 0.85,
          });
      } else {
        // Idle unlit beacon: Charcoal level gauge
        const progress = b.charcoalLoaded / b.maxCharcoal;
        g.circle(cx, cy, ts * 0.4).fill({
          color: 0x334155,
          alpha: 0.6,
        });

        if (progress > 0) {
          g.arc(cx, cy, ts * 0.6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2).stroke({
            color: THEME_COLORS.NEON_GOLD,
            width: 3,
            alpha: 0.9,
          });
        }
      }
    });
  }
}
