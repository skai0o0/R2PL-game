import {
  Container,
  Graphics,
  TilingSprite,
  Text,
  PointData,
  FederatedPointerEvent,
} from 'pixi.js';
import { GRID_CONFIG, THEME_COLORS, PlacedEntity, EntityCategory, UniStopType, ChestTier } from '../constants/terminology';
import { ViewportManager, VisibleTileBounds } from '../core/ViewportManager';
import { TextureGenerator } from './TextureGenerator';

export interface BoardEntityClickEvent {
  entity: PlacedEntity;
  originalEvent: FederatedPointerEvent;
}

export type EntitySelectCallback = (entity: PlacedEntity | null) => void;

/**
 * PredatorBoard: Renders the 1000x1000 Cyberpunk / Predator High-Tech arena.
 * Uses high-performance viewport culling and procedural visuals.
 */
export class PredatorBoard {
  public readonly container: Container;
  private readonly viewportManager: ViewportManager;

  // Visual layers
  private baseFloor: Graphics;
  private carbonTiling: TilingSprite;
  private circuitTiling: TilingSprite;
  private gridGraphics: Graphics;
  private borderGraphics: Graphics;
  private entitiesContainer: Container;
  private highlightGraphics: Graphics;

  // Placed entities map and visual sprite cache
  private entities: Map<string, PlacedEntity> = new Map();
  private entityGraphics: Map<string, Container> = new Map();

  // Selected entity for editor
  private selectedEntityId: string | null = null;
  private onSelectCallbacks: Set<EntitySelectCallback> = new Set();

  // Pulse animation ticker
  private pulsePhase: number = 0;

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.container = new Container();
    viewportManager.viewport.addChild(this.container);

    // 1. Base solid matte black floor
    this.baseFloor = new Graphics();
    this.baseFloor.rect(0, 0, GRID_CONFIG.BOARD_WIDTH, GRID_CONFIG.BOARD_HEIGHT).fill({
      color: THEME_COLORS.BACKGROUND_BLACK,
      alpha: 1.0,
    });
    this.container.addChild(this.baseFloor);

    // 2. Carbon Fiber Weave Overlay
    const carbonTex = TextureGenerator.createCarbonTexture();
    this.carbonTiling = new TilingSprite({
      texture: carbonTex,
      width: GRID_CONFIG.BOARD_WIDTH,
      height: GRID_CONFIG.BOARD_HEIGHT,
    });
    this.carbonTiling.alpha = 0.85;
    this.container.addChild(this.carbonTiling);

    // 3. Cyber Circuit Traces Overlay
    const circuitTex = TextureGenerator.createCircuitTexture();
    this.circuitTiling = new TilingSprite({
      texture: circuitTex,
      width: GRID_CONFIG.BOARD_WIDTH,
      height: GRID_CONFIG.BOARD_HEIGHT,
    });
    this.circuitTiling.alpha = 0.55;
    this.container.addChild(this.circuitTiling);

    // 4. Dynamic Grid Lines Layer (culled)
    this.gridGraphics = new Graphics();
    this.container.addChild(this.gridGraphics);

    // 5. Perimeter Border & High-Tech Markings
    this.borderGraphics = new Graphics();
    this.container.addChild(this.borderGraphics);
    this.drawPerimeterBorders();

    // 6. Placed Entities Layer
    this.entitiesContainer = new Container();
    this.container.addChild(this.entitiesContainer);

    // 7. Interactive Highlight Layer
    this.highlightGraphics = new Graphics();
    this.container.addChild(this.highlightGraphics);

    // Register culling callback on viewport moves
    this.viewportManager.onViewportChanged((bounds, zoom) => {
      this.renderDynamicGrid(bounds, zoom);
      this.updateEntitiesCulling(bounds);
    });

    // Animate subtle neon pulses
    this.viewportManager.app.ticker.add((ticker) => {
      this.pulsePhase += 0.05 * ticker.deltaTime;
      this.updatePulseAnimation();
    });
  }

  /**
   * Draws the perimeter border of the 1,000,000 cell world
   */
  private drawPerimeterBorders(): void {
    const g = this.borderGraphics;
    g.clear();

    const w = GRID_CONFIG.BOARD_WIDTH;
    const h = GRID_CONFIG.BOARD_HEIGHT;

    // Outer cybernetic neon bounding line
    g.rect(0, 0, w, h).stroke({
      color: THEME_COLORS.PREDATOR_CYAN,
      width: 6,
      alpha: 0.9,
    });

    // Secondary inner offset line
    const offset = 24;
    g.rect(offset, offset, w - offset * 2, h - offset * 2).stroke({
      color: THEME_COLORS.ELECTRIC_BLUE,
      width: 2,
      alpha: 0.6,
    });

    // Glowing corner brackets (4 corners)
    const bracketSize = 300;
    const cornerThickness = 12;

    const corners = [
      { x: 0, y: 0, dx: 1, dy: 1 },
      { x: w, y: 0, dx: -1, dy: 1 },
      { x: w, y: h, dx: -1, dy: -1 },
      { x: 0, y: h, dx: 1, dy: -1 },
    ];

    corners.forEach((c) => {
      // Corner glow
      g.moveTo(c.x, c.y)
        .lineTo(c.x + c.dx * bracketSize, c.y)
        .stroke({ color: THEME_COLORS.PREDATOR_CYAN, width: cornerThickness, alpha: 0.9 });

      g.moveTo(c.x, c.y)
        .lineTo(c.x, c.y + c.dy * bracketSize)
        .stroke({ color: THEME_COLORS.PREDATOR_CYAN, width: cornerThickness, alpha: 0.9 });

      // Diagonal chamfer accent
      g.moveTo(c.x + c.dx * 80, c.y)
        .lineTo(c.x, c.y + c.dy * 80)
        .stroke({ color: 0xFFFFFF, width: 3, alpha: 0.8 });
    });
  }

  /**
   * Dynamic Culling Grid Line Renderer
   * Renders only what is inside the camera screen to guarantee 60+ FPS on 1,000,000 tiles
   */
  public renderDynamicGrid(bounds: VisibleTileBounds, zoom: number): void {
    const g = this.gridGraphics;
    g.clear();

    const ts = GRID_CONFIG.TILE_SIZE;
    const startX = bounds.minCol * ts;
    const endX = (bounds.maxCol + 1) * ts;
    const startY = bounds.minRow * ts;
    const endY = (bounds.maxRow + 1) * ts;

    // Level 1: Minor 1x1 tile grid lines (Only when zoomed in closely)
    if (zoom >= 0.35) {
      const minorAlpha = Math.min(0.4, (zoom - 0.35) * 0.8);
      for (let c = bounds.minCol; c <= bounds.maxCol + 1; c++) {
        if (c % 10 !== 0) {
          const x = c * ts;
          g.moveTo(x, startY).lineTo(x, endY).stroke({
            color: THEME_COLORS.GRID_BASE,
            width: 1,
            alpha: minorAlpha,
          });
        }
      }
      for (let r = bounds.minRow; r <= bounds.maxRow + 1; r++) {
        if (r % 10 !== 0) {
          const y = r * ts;
          g.moveTo(startX, y).lineTo(endX, y).stroke({
            color: THEME_COLORS.GRID_BASE,
            width: 1,
            alpha: minorAlpha,
          });
        }
      }
    }

    // Level 2: Major 10x10 tile block grid lines (Zoom >= 0.1)
    if (zoom >= 0.08) {
      const minMajorCol = Math.floor(bounds.minCol / 10) * 10;
      const maxMajorCol = Math.ceil(bounds.maxCol / 10) * 10;
      const minMajorRow = Math.floor(bounds.minRow / 10) * 10;
      const maxMajorRow = Math.ceil(bounds.maxRow / 10) * 10;

      for (let c = minMajorCol; c <= maxMajorCol; c += 10) {
        if (c % 50 !== 0) {
          const x = c * ts;
          g.moveTo(x, startY).lineTo(x, endY).stroke({
            color: THEME_COLORS.GRID_MAJOR,
            width: 1.5,
            alpha: 0.6,
          });
        }
      }

      for (let r = minMajorRow; r <= maxMajorRow; r += 10) {
        if (r % 50 !== 0) {
          const y = r * ts;
          g.moveTo(startX, y).lineTo(endX, y).stroke({
            color: THEME_COLORS.GRID_MAJOR,
            width: 1.5,
            alpha: 0.6,
          });
        }
      }
    }

    // Level 3: Sector 50x50 tile grid lines (Always visible with Predator Cyan glow)
    const minSectorCol = Math.floor(bounds.minCol / 50) * 50;
    const maxSectorCol = Math.ceil(bounds.maxCol / 50) * 50;
    const minSectorRow = Math.floor(bounds.minRow / 50) * 50;
    const maxSectorRow = Math.ceil(bounds.maxRow / 50) * 50;

    for (let c = minSectorCol; c <= maxSectorCol; c += 50) {
      const x = c * ts;
      g.moveTo(x, startY).lineTo(x, endY).stroke({
        color: THEME_COLORS.GRID_SECTOR,
        width: 2,
        alpha: 0.45,
      });
    }

    for (let r = minSectorRow; r <= maxSectorRow; r += 50) {
      const y = r * ts;
      g.moveTo(startX, y).lineTo(endX, y).stroke({
        color: THEME_COLORS.GRID_SECTOR,
        width: 2,
        alpha: 0.45,
      });
    }
  }

  /**
   * Update Placed Entities
   */
  public setEntities(entitiesList: PlacedEntity[]): void {
    // Clear existing
    this.entities.clear();
    this.entityGraphics.forEach((container) => {
      this.entitiesContainer.removeChild(container);
      container.destroy({ children: true });
    });
    this.entityGraphics.clear();

    // Populate
    entitiesList.forEach((e) => this.addOrUpdateEntity(e));

    // Force culling pass
    this.updateEntitiesCulling(this.viewportManager.getVisibleTileBounds(4));
  }

  public addOrUpdateEntity(entity: PlacedEntity): void {
    this.entities.set(entity.id, entity);

    let container = this.entityGraphics.get(entity.id);
    if (!container) {
      container = new Container();
      container.eventMode = 'static';
      container.cursor = 'pointer';

      // Click to select
      container.on('pointerdown', (e) => {
        this.selectEntity(entity.id);
      });

      this.entitiesContainer.addChild(container);
      this.entityGraphics.set(entity.id, container);
    } else {
      container.removeChildren();
    }

    this.renderEntityGraphic(container, entity);
    this.updateEntityTransform(container, entity);
  }

  public removeEntity(id: string): void {
    this.entities.delete(id);
    const container = this.entityGraphics.get(id);
    if (container) {
      this.entitiesContainer.removeChild(container);
      container.destroy({ children: true });
      this.entityGraphics.delete(id);
    }
    if (this.selectedEntityId === id) {
      this.selectEntity(null);
    }
  }

  public getEntity(id: string): PlacedEntity | undefined {
    return this.entities.get(id);
  }

  public getAllEntities(): PlacedEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Creates rich visual presentation for an entity based on category
   */
  private renderEntityGraphic(container: Container, entity: PlacedEntity): void {
    const ts = GRID_CONFIG.TILE_SIZE;
    const w = entity.width * ts;
    const h = entity.height * ts;
    const primaryColor = entity.colorHex ? parseInt(entity.colorHex.replace('#', '0x'), 16) : THEME_COLORS.PREDATOR_CYAN;

    const g = new Graphics();
    container.addChild(g);

    // Chamfered base plate
    const pad = 3;
    const bw = w - pad * 2;
    const bh = h - pad * 2;
    const chamfer = Math.min(16, bw * 0.2);

    // Outer glow ring
    g.roundRect(pad, pad, bw, bh, chamfer).stroke({
      color: primaryColor,
      width: 2.5,
      alpha: 0.9,
    });

    // Dark cyber platform fill
    g.roundRect(pad + 2, pad + 2, bw - 4, bh - 4, chamfer - 2).fill({
      color: 0x111622,
      alpha: 0.92,
    });

    // Inner holographic floor grid
    g.rect(pad + 6, pad + 6, bw - 12, bh - 12).fill({
      color: primaryColor,
      alpha: 0.12,
    });

    // Category specific icon / visual details
    let iconChar = '⚡';
    let categoryBadge = entity.category.toString();

    if (entity.category === EntityCategory.HEADQUARTERS) {
      iconChar = '🏛️';
      categoryBadge = 'HEADQUARTERS';
    } else if (entity.category === EntityCategory.SCENIC_SPOT) {
      iconChar = (entity.metadata?.icon as string) || '🏔️';
      categoryBadge = 'SCENIC SPOT';
    } else if (entity.category === EntityCategory.LANDMARK) {
      iconChar = (entity.metadata?.icon as string) || '🏯';
      categoryBadge = 'LANDMARK';
    } else if (entity.category === EntityCategory.UNISTOP) {
      iconChar = '⛽';
      categoryBadge = 'UNISTOP';
    } else if (entity.category === EntityCategory.CHEST) {
      iconChar = '📦';
      categoryBadge = 'CHEST';
    }

    // Icon text
    const iconText = new Text({
      text: iconChar,
      style: {
        fontSize: Math.min(28, bw * 0.4),
        align: 'center',
      },
    });
    iconText.anchor.set(0.5);
    iconText.position.set(w / 2, h / 2 - 8);
    container.addChild(iconText);

    // Entity Label
    const labelText = new Text({
      text: entity.name.length > 18 ? entity.name.substring(0, 16) + '...' : entity.name,
      style: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: Math.max(9, Math.min(13, bw * 0.12)),
        fontWeight: 'bold',
        fill: '#FFFFFF',
        align: 'center',
        stroke: { color: 0x000000, width: 3 },
      },
    });
    labelText.anchor.set(0.5);
    labelText.position.set(w / 2, h / 2 + 16);
    container.addChild(labelText);

    // Category sub-label
    const catText = new Text({
      text: categoryBadge,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 8,
        letterSpacing: 1,
        fill: entity.colorHex || THEME_COLORS.PREDATOR_CYAN_HEX,
        align: 'center',
      },
    });
    catText.anchor.set(0.5);
    catText.position.set(w / 2, h - pad - 6);
    container.addChild(catText);
  }

  private updateEntityTransform(container: Container, entity: PlacedEntity): void {
    const ts = GRID_CONFIG.TILE_SIZE;
    const px = entity.gridX * ts;
    const py = entity.gridY * ts;

    container.position.set(px, py);

    // Rotation pivot
    if (entity.rotation !== 0) {
      const halfW = (entity.width * ts) / 2;
      const halfH = (entity.height * ts) / 2;
      container.pivot.set(halfW, halfH);
      container.position.set(px + halfW, py + halfH);
      container.angle = entity.rotation;
    } else {
      container.pivot.set(0, 0);
      container.angle = 0;
    }
  }

  /**
   * Culling: Toggle visibility of entity sprites based on viewport bounds
   */
  private updateEntitiesCulling(bounds: VisibleTileBounds): void {
    this.entities.forEach((entity, id) => {
      const container = this.entityGraphics.get(id);
      if (!container) return;

      const isVisible =
        entity.gridX + entity.width >= bounds.minCol &&
        entity.gridX <= bounds.maxCol &&
        entity.gridY + entity.height >= bounds.minRow &&
        entity.gridY <= bounds.maxRow;

      container.visible = isVisible;
    });

    this.renderSelectionHighlight();
  }

  /**
   * Entity Selection
   */
  public selectEntity(id: string | null): void {
    this.selectedEntityId = id;
    this.renderSelectionHighlight();

    const selected = id ? this.entities.get(id) || null : null;
    this.onSelectCallbacks.forEach((cb) => cb(selected));
  }

  public getSelectedEntity(): PlacedEntity | null {
    if (!this.selectedEntityId) return null;
    return this.entities.get(this.selectedEntityId) || null;
  }

  public onEntitySelected(callback: EntitySelectCallback): () => void {
    this.onSelectCallbacks.add(callback);
    return () => this.onSelectCallbacks.delete(callback);
  }

  private renderSelectionHighlight(): void {
    const g = this.highlightGraphics;
    g.clear();

    if (!this.selectedEntityId) return;
    const entity = this.entities.get(this.selectedEntityId);
    if (!entity) return;

    const ts = GRID_CONFIG.TILE_SIZE;
    const x = entity.gridX * ts;
    const y = entity.gridY * ts;
    const w = entity.width * ts;
    const h = entity.height * ts;

    // Glowing animated selection box
    const pulseAlpha = 0.7 + Math.sin(this.pulsePhase * 3) * 0.3;
    g.rect(x - 4, y - 4, w + 8, h + 8).stroke({
      color: THEME_COLORS.PREDATOR_CYAN,
      width: 3,
      alpha: pulseAlpha,
    });

    // 4 Corner indicators
    const corner = 12;
    // Top-left
    g.moveTo(x - 8, y + corner).lineTo(x - 8, y - 8).lineTo(x + corner, y - 8).stroke({ color: 0xFFFFFF, width: 4 });
    // Top-right
    g.moveTo(x + w + 8 - corner, y - 8).lineTo(x + w + 8, y - 8).lineTo(x + w + 8, y + corner).stroke({ color: 0xFFFFFF, width: 4 });
    // Bottom-right
    g.moveTo(x + w + 8, y + h + 8 - corner).lineTo(x + w + 8, y + h + 8).lineTo(x + w + 8 - corner, y + h + 8).stroke({ color: 0xFFFFFF, width: 4 });
    // Bottom-left
    g.moveTo(x - 8 + corner, y + h + 8).lineTo(x - 8, y + h + 8).lineTo(x - 8, y + h + 8 - corner).stroke({ color: 0xFFFFFF, width: 4 });
  }

  private updatePulseAnimation(): void {
    if (this.selectedEntityId) {
      this.renderSelectionHighlight();
    }
  }
}
