import { Application, Rectangle, PointData } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { GRID_CONFIG } from '../constants/terminology';

export interface VisibleTileBounds {
  minCol: number;
  minRow: number;
  maxCol: number;
  maxRow: number;
}

export type ViewportChangeCallback = (bounds: VisibleTileBounds, zoom: number) => void;

/**
 * ViewportManager: Controls camera panning, zooming, coordinate conversions,
 * and calculates dynamic culling rectangles for 1,000,000 cells.
 */
export class ViewportManager {
  public readonly app: Application;
  public readonly viewport: Viewport;
  public readonly tileSize: number = GRID_CONFIG.TILE_SIZE;
  public readonly worldWidth: number = GRID_CONFIG.BOARD_WIDTH;
  public readonly worldHeight: number = GRID_CONFIG.BOARD_HEIGHT;

  private changeListeners: Set<ViewportChangeCallback> = new Set();
  private lastBounds: VisibleTileBounds = { minCol: 0, minRow: 0, maxCol: 0, maxRow: 0 };

  constructor(app: Application) {
    this.app = app;

    this.viewport = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      events: app.renderer.events,
      disableOnContextMenu: true,
    });

    app.stage.addChild(this.viewport);

    // Setup navigation plugins
    this.viewport
      .drag({
        mouseButtons: 'all', // Middle / Left click drag (left click drag can be toggled in editor mode)
      })
      .pinch()
      .wheel({
        percent: 0.15,
        smooth: 5,
      })
      .decelerate({
        friction: 0.88,
      })
      .clamp({
        left: -1000,
        top: -1000,
        right: this.worldWidth + 1000,
        bottom: this.worldHeight + 1000,
        direction: 'all',
      })
      .clampZoom({
        minScale: 0.04,  // See whole board
        maxScale: 3.5,   // Close up detail on individual cyber tiles
      });

    // Listen to changes to trigger culling
    this.viewport.on('moved', () => this.handleViewportChange());
    this.viewport.on('zoomed', () => this.handleViewportChange());

    // Window resize handler
    window.addEventListener('resize', () => {
      this.viewport.resize(window.innerWidth, window.innerHeight, this.worldWidth, this.worldHeight);
      this.handleViewportChange();
    });

    // Initial center on national center (e.g., Hue region: x=480, y=460)
    this.focusOnGrid(480, 460, 0.4, false);
  }

  /**
   * Handle changes and notify registered renderers for culling
   */
  private handleViewportChange(): void {
    const bounds = this.getVisibleTileBounds(4);
    const zoom = this.viewport.scaled;
    this.lastBounds = bounds;
    this.changeListeners.forEach((cb) => cb(bounds, zoom));
  }

  public onViewportChanged(callback: ViewportChangeCallback): () => void {
    this.changeListeners.add(callback);
    // Send immediate initial state
    callback(this.getVisibleTileBounds(4), this.viewport.scaled);
    return () => this.changeListeners.delete(callback);
  }

  /**
   * Calculates the visible grid cell range [minCol..maxCol, minRow..maxRow] with padding
   */
  public getVisibleTileBounds(paddingTiles: number = 2): VisibleTileBounds {
    const rect: Rectangle = this.viewport.getVisibleBounds();

    const minCol = Math.max(0, Math.floor(rect.x / this.tileSize) - paddingTiles);
    const minRow = Math.max(0, Math.floor(rect.y / this.tileSize) - paddingTiles);
    const maxCol = Math.min(GRID_CONFIG.COLS - 1, Math.ceil((rect.x + rect.width) / this.tileSize) + paddingTiles);
    const maxRow = Math.min(GRID_CONFIG.ROWS - 1, Math.ceil((rect.y + rect.height) / this.tileSize) + paddingTiles);

    return { minCol, minRow, maxCol, maxRow };
  }

  // --- Coordinate conversions ---

  public worldToGrid(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.tileSize),
      row: Math.floor(worldY / this.tileSize),
    };
  }

  public gridToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.tileSize,
      y: row * this.tileSize,
    };
  }

  public screenToWorld(screenX: number, screenY: number): PointData {
    return this.viewport.toWorld(screenX, screenY);
  }

  public screenToGrid(screenX: number, screenY: number): { col: number; row: number } {
    const worldPoint = this.screenToWorld(screenX, screenY);
    return this.worldToGrid(worldPoint.x, worldPoint.y);
  }

  public worldToScreen(worldX: number, worldY: number): PointData {
    return this.viewport.toScreen(worldX, worldY);
  }

  /**
   * Focus camera smoothly or instantly to a specific grid coordinate
   */
  public focusOnGrid(col: number, row: number, zoomLevel?: number, animate: boolean = true): void {
    const targetX = (col + 0.5) * this.tileSize;
    const targetY = (row + 0.5) * this.tileSize;

    if (animate) {
      this.viewport.animate({
        position: { x: targetX, y: targetY },
        scale: zoomLevel ?? this.viewport.scaled,
        time: 500,
        ease: 'easeInOutSine',
        callbackOnComplete: () => this.handleViewportChange(),
      });
    } else {
      this.viewport.moveCenter(targetX, targetY);
      if (zoomLevel !== undefined) {
        this.viewport.setZoom(zoomLevel);
      }
      this.handleViewportChange();
    }
  }

  public setDragEnabled(enabled: boolean): void {
    const dragPlugin = this.viewport.plugins.get('drag') as any;
    if (dragPlugin) {
      if (enabled) {
        dragPlugin.resume();
      } else {
        dragPlugin.pause();
      }
    }
  }
}
