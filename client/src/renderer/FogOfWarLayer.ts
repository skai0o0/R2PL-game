import { Container, Sprite, Texture, PointData } from 'pixi.js';
import { GRID_CONFIG, THEME_COLORS, PlacedEntity, EntityCategory } from '../constants/terminology';
import { KnowledgeGrid } from '../core/KnowledgeGrid';
import { ViewportManager } from '../core/ViewportManager';

/**
 * FogOfWarLayer: Implements the shroud of technology fog covering the 1000x1000 arena.
 * Uses a 1000x1000 canvas with Bilinear Filtering & Radial destination-out gradients,
 * creating silky-smooth, soft anti-aliased fog edges (không răng cưa).
 */
export class FogOfWarLayer {
  public readonly container: Container;
  private readonly grid: KnowledgeGrid;
  private readonly viewportManager: ViewportManager;

  // Fog Canvas & Texture
  private fogCanvas: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;
  private fogTexture: Texture;
  private fogSprite: Sprite;

  // Toggle state
  private isFogEnabled: boolean = true;
  private pendingUpdate: boolean = false;

  constructor(viewportManager: ViewportManager, grid: KnowledgeGrid) {
    this.viewportManager = viewportManager;
    this.grid = grid;
    this.container = new Container();
    viewportManager.viewport.addChild(this.container);

    // Canvas representing 1px per grid tile (1000x1000 px)
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = GRID_CONFIG.COLS;
    this.fogCanvas.height = GRID_CONFIG.ROWS;
    this.fogCtx = this.fogCanvas.getContext('2d', { willReadFrequently: true })!;

    // Initial fill: Cyber high-tech dark fog
    this.resetFogCanvas();

    // Create Pixi Texture from Canvas with Linear filtering for soft edges
    this.fogTexture = Texture.from(this.fogCanvas);
    if (this.fogTexture.source) {
      this.fogTexture.source.scaleMode = 'linear';
    }

    // Scale sprite to cover full 32000x32000 world
    this.fogSprite = new Sprite(this.fogTexture);
    this.fogSprite.width = GRID_CONFIG.BOARD_WIDTH;
    this.fogSprite.height = GRID_CONFIG.BOARD_HEIGHT;
    this.fogSprite.alpha = THEME_COLORS.FOG_ALPHA;

    this.container.addChild(this.fogSprite);

    // Request animation frame batching for texture uploads
    viewportManager.app.ticker.add(() => {
      if (this.pendingUpdate) {
        if (this.fogTexture.source) {
          this.fogTexture.source.update();
        }
        this.pendingUpdate = false;
      }
    });
  }

  /**
   * Resets the entire fog canvas to solid cyber-dark
   */
  public resetFogCanvas(): void {
    const ctx = this.fogCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, GRID_CONFIG.COLS, GRID_CONFIG.ROWS);
    ctx.restore();
    this.pendingUpdate = true;
  }

  /**
   * Reveals a circular zone on the fog layer with soft anti-aliased gradient
   */
  public revealZone(centerX: number, centerY: number, radius: number = GRID_CONFIG.EXPLORE_RADIUS_DEFAULT): void {
    const ctx = this.fogCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Create soft radial gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      Math.max(0, radius * 0.55),
      centerX,
      centerY,
      radius
    );
    // Inner center is 100% cleared
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mark KnowledgeGrid as explored
    this.grid.exploreRadius(centerX, centerY, radius);

    this.pendingUpdate = true;
  }

  /**
   * Automatically clears permanent vision for Headquarters, Scenic Spots & Landmarks
   */
  public revealPermanentAreas(entities: PlacedEntity[]): void {
    entities.forEach((entity) => {
      const centerX = entity.gridX + entity.width / 2;
      const centerY = entity.gridY + entity.height / 2;

      let radius: number = GRID_CONFIG.EXPLORE_RADIUS_DEFAULT;
      if (entity.category === EntityCategory.HEADQUARTERS) {
        radius = GRID_CONFIG.HQ_VISION_RADIUS;
      } else if (entity.category === EntityCategory.SCENIC_SPOT || entity.category === EntityCategory.LANDMARK) {
        radius = (entity.metadata?.visionRadius as number) || GRID_CONFIG.LANDMARK_VISION_RADIUS;
      } else if (entity.category === EntityCategory.UNISTOP) {
        radius = 7;
      }

      this.revealZone(centerX, centerY, radius);
    });
  }

  /**
   * Toggle Fog of War on/off (e.g. for Map Editor view)
   */
  public setFogEnabled(enabled: boolean): void {
    this.isFogEnabled = enabled;
    this.fogSprite.visible = enabled;
  }

  public get fogEnabled(): boolean {
    return this.isFogEnabled;
  }

  public revealAll(): void {
    const ctx = this.fogCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, GRID_CONFIG.COLS, GRID_CONFIG.ROWS);
    ctx.restore();
    this.pendingUpdate = true;
  }
}
