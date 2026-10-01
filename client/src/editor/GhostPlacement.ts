import { Container, Graphics, Text } from 'pixi.js';
import { GRID_CONFIG, THEME_COLORS, PlacedEntity } from '../constants/terminology';
import { ViewportManager } from '../core/ViewportManager';

export interface GhostTemplate {
  category: PlacedEntity['category'];
  type: string;
  name: string;
  width: number;
  height: number;
  colorHex?: string;
  schoolName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GhostPlacement: Manages the translucent holographic placement preview,
 * grid snapping, and 90-degree rotation.
 */
export class GhostPlacement {
  public readonly container: Container;
  private readonly viewportManager: ViewportManager;

  private graphics: Graphics;
  private coordText: Text;

  private template: GhostTemplate | null = null;
  private currentGridX: number = 0;
  private currentGridY: number = 0;
  private currentRotation: number = 0; // 0, 90, 180, 270 degrees
  private isValid: boolean = true;

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.container = new Container();
    this.container.visible = false;

    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    this.coordText = new Text({
      text: '',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 11,
        fill: '#00FFE8',
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.coordText.position.set(4, -18);
    this.container.addChild(this.coordText);

    viewportManager.viewport.addChild(this.container);
  }

  public setTemplate(template: GhostTemplate | null): void {
    this.template = template;
    this.currentRotation = 0;
    if (!template) {
      this.container.visible = false;
    } else {
      this.container.visible = true;
      this.render();
    }
  }

  public getTemplate(): GhostTemplate | null {
    return this.template;
  }

  public isActive(): boolean {
    return this.template !== null && this.container.visible;
  }

  /**
   * Rotate 90 degrees clockwise (phím R)
   */
  public rotate(): void {
    if (!this.template) return;
    this.currentRotation = (this.currentRotation + 90) % 360;
    this.render();
  }

  public get rotation(): number {
    return this.currentRotation;
  }

  public get gridX(): number {
    return this.currentGridX;
  }

  public get gridY(): number {
    return this.currentGridY;
  }

  /**
   * Update ghost coordinates based on cursor screen/world position
   */
  public updatePosition(worldX: number, worldY: number, isValidPlacement: boolean = true): void {
    if (!this.template) return;

    const ts = GRID_CONFIG.TILE_SIZE;
    // Snap to grid
    const col = Math.max(0, Math.min(GRID_CONFIG.COLS - this.template.width, Math.floor(worldX / ts)));
    const row = Math.max(0, Math.min(GRID_CONFIG.ROWS - this.template.height, Math.floor(worldY / ts)));

    this.currentGridX = col;
    this.currentGridY = row;
    this.isValid = isValidPlacement;

    this.container.position.set(col * ts, row * ts);
    this.coordText.text = `[${col}, ${row}] ${this.currentRotation}°`;

    this.render();
  }

  /**
   * Redraw the ghost preview graphic
   */
  private render(): void {
    if (!this.template) return;

    const g = this.graphics;
    g.clear();

    const ts = GRID_CONFIG.TILE_SIZE;
    const isRotated90or270 = this.currentRotation === 90 || this.currentRotation === 270;
    const w = (isRotated90or270 ? this.template.height : this.template.width) * ts;
    const h = (isRotated90or270 ? this.template.width : this.template.height) * ts;

    const strokeColor = this.isValid ? THEME_COLORS.PREDATOR_CYAN : THEME_COLORS.NEON_RED;
    const fillColor = this.isValid ? 0x00FFE8 : 0xFF2A55;

    // Translucent fill
    g.rect(0, 0, w, h).fill({
      color: fillColor,
      alpha: 0.25,
    });

    // Outer dashed/pulsing cyber border
    g.rect(0, 0, w, h).stroke({
      color: strokeColor,
      width: 2.5,
      alpha: 0.9,
    });

    // Cross-hair center
    const cx = w / 2;
    const cy = h / 2;
    g.moveTo(cx - 10, cy).lineTo(cx + 10, cy).stroke({ color: strokeColor, width: 2 });
    g.moveTo(cx, cy - 10).lineTo(cx, cy + 10).stroke({ color: strokeColor, width: 2 });
  }

  public clear(): void {
    this.setTemplate(null);
  }
}
