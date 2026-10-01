import { Container, Graphics } from 'pixi.js';
import { GRID_CONFIG, THEME_COLORS } from '../constants/terminology';
import { ViewportManager } from '../core/ViewportManager';

export interface TerritoryFlag {
  id: string;
  gridX: number;
  gridY: number;
  schoolColorHex?: string;
  label?: string;
}

/**
 * FlagBorderSystem: Renders animated holographic Predator flags marking territory borders.
 */
export class FlagBorderSystem {
  public readonly container: Container;
  private readonly viewportManager: ViewportManager;
  private readonly graphics: Graphics;
  private flags: TerritoryFlag[] = [];
  private wavePhase: number = 0;

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    viewportManager.viewport.addChild(this.container);

    viewportManager.app.ticker.add((ticker) => {
      this.wavePhase += 0.08 * ticker.deltaTime;
      this.render();
    });
  }

  public setFlags(flags: TerritoryFlag[]): void {
    this.flags = flags;
  }

  public addFlag(flag: TerritoryFlag): void {
    this.flags.push(flag);
  }

  public clearFlags(): void {
    this.flags = [];
  }

  private render(): void {
    const g = this.graphics;
    g.clear();

    const ts = GRID_CONFIG.TILE_SIZE;
    const bounds = this.viewportManager.getVisibleTileBounds(4);

    this.flags.forEach((f, idx) => {
      if (
        f.gridX < bounds.minCol - 1 ||
        f.gridX > bounds.maxCol + 1 ||
        f.gridY < bounds.minRow - 1 ||
        f.gridY > bounds.maxRow + 1
      ) {
        return;
      }

      const x = (f.gridX + 0.5) * ts;
      const y = (f.gridY + 0.8) * ts;
      const color = f.schoolColorHex ? parseInt(f.schoolColorHex.replace('#', '0x'), 16) : THEME_COLORS.PREDATOR_CYAN;

      // Base cyber beacon anchor
      g.circle(x, y, 4).fill({ color, alpha: 0.9 });

      // Flag pole (titanium carbon mast)
      const poleHeight = ts * 1.4;
      g.moveTo(x, y).lineTo(x, y - poleHeight).stroke({
        color: 0x94A3B8,
        width: 2,
        alpha: 0.9,
      });

      // Animated fluttering cyber pennant / flag
      const wave = Math.sin(this.wavePhase + idx) * 3;
      const flagWidth = ts * 0.9;
      const flagHeight = ts * 0.5;
      const topY = y - poleHeight;

      g.moveTo(x, topY)
        .lineTo(x + flagWidth, topY + wave)
        .lineTo(x + flagWidth * 0.6, topY + flagHeight / 2)
        .lineTo(x + flagWidth, topY + flagHeight + wave)
        .lineTo(x, topY + flagHeight)
        .closePath()
        .fill({ color, alpha: 0.8 })
        .stroke({ color: 0xFFFFFF, width: 1, alpha: 0.9 });

      // Predator neon emblem on the flag
      g.circle(x + flagWidth * 0.4, topY + flagHeight / 2 + wave * 0.5, 2.5).fill({
        color: 0xFFFFFF,
        alpha: 0.9,
      });
    });
  }
}
