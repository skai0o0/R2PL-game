import { PlacedEntity, GRID_CONFIG } from '../constants/terminology';
import { ViewportManager } from '../core/ViewportManager';
import { KnowledgeGrid } from '../core/KnowledgeGrid';
import { PredatorBoard } from '../renderer/PredatorBoard';
import { FogOfWarLayer } from '../renderer/FogOfWarLayer';
import { GhostPlacement, GhostTemplate } from './GhostPlacement';
import { EditorPalette } from './EditorPalette';
import { LayoutSerializer } from './LayoutSerializer';
import { createInitialLayout } from '../constants/defaultLayout';
import { GLTFModelRenderer } from '../renderer3d/GLTFModelRenderer';

export type EditorStateChangeCallback = (isActive: boolean) => void;

/**
 * MapEditorMode: "The Sims" Map Editor Controller.
 * Handles placement, rotation, deletion, moving, and JSON serialization.
 * Synchronizes both 2D Pixi sa bàn and 3D Isometric models.
 */
export class MapEditorMode {
  private readonly viewportManager: ViewportManager;
  private readonly grid: KnowledgeGrid;
  private readonly board: PredatorBoard;
  private readonly fogLayer: FogOfWarLayer;
  private readonly gltfRenderer?: GLTFModelRenderer;

  private ghost: GhostPlacement;
  private palette: EditorPalette;

  private _isActive: boolean = false;
  private activeTemplate: GhostTemplate | null = null;
  private draggedEntity: PlacedEntity | null = null;
  private isDraggingEntity: boolean = false;

  private stateChangeListeners: Set<EditorStateChangeCallback> = new Set();

  constructor(
    viewportManager: ViewportManager,
    grid: KnowledgeGrid,
    board: PredatorBoard,
    fogLayer: FogOfWarLayer,
    gltfRenderer?: GLTFModelRenderer
  ) {
    this.viewportManager = viewportManager;
    this.grid = grid;
    this.board = board;
    this.fogLayer = fogLayer;
    this.gltfRenderer = gltfRenderer;

    this.ghost = new GhostPlacement(viewportManager);

    // Initialize Palette
    this.palette = new EditorPalette({
      onSelectTemplate: (template) => this.handleSelectTemplate(template),
      onExportLayout: () => this.handleExportLayout(),
      onImportLayout: (file) => this.handleImportLayout(file),
      onResetLayout: () => this.handleResetLayout(),
      onClearLayout: () => this.handleClearLayout(),
      onToggleFog: () => this.handleToggleFog(),
      onClose: () => this.setActive(false),
    });

    // Start with palette hidden
    this.palette.setVisible(false);

    // Bind Global Keyboard and Mouse Events
    this.bindEvents();
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public setActive(active: boolean): void {
    if (this._isActive === active) return;
    this._isActive = active;

    this.palette.setVisible(active);
    if (!active) {
      this.ghost.clear();
      this.gltfRenderer?.updateGhostPreview(null, 0, 0, 0, true);
      this.activeTemplate = null;
      this.palette.clearSelection();
      this.board.selectEntity(null);
      this.viewportManager.setDragEnabled(true);
    }

    this.stateChangeListeners.forEach((cb) => cb(active));
  }

  public toggle(): void {
    this.setActive(!this._isActive);
  }

  public onStateChange(callback: EditorStateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    return () => this.stateChangeListeners.delete(callback);
  }

  private handleSelectTemplate(template: GhostTemplate | null): void {
    this.activeTemplate = template;
    this.ghost.setTemplate(template);

    if (!template) {
      this.gltfRenderer?.updateGhostPreview(null, 0, 0, 0, true);
    } else {
      this.board.selectEntity(null);
    }
  }

  private bindEvents(): void {
    // Keyboard shortcuts: F2 (Toggle), R (Rotate), Delete/Backspace (Delete selected)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (!this._isActive) return;

      if (e.key === 'r' || e.key === 'R') {
        if (this.ghost.isActive()) {
          this.ghost.rotate();
          if (this.activeTemplate) {
            this.gltfRenderer?.updateGhostPreview(
              this.activeTemplate,
              this.ghost.gridX,
              this.ghost.gridY,
              this.ghost.rotation,
              true
            );
          }
        } else {
          // Rotate selected entity
          const selected = this.board.getSelectedEntity();
          if (selected) {
            selected.rotation = (selected.rotation + 90) % 360;
            this.board.addOrUpdateEntity(selected);
            this.gltfRenderer?.addOrUpdateEntity(selected);
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = this.board.getSelectedEntity();
        if (selected) {
          this.deleteEntity(selected.id);
        }
      } else if (e.key === 'Escape') {
        if (this.ghost.isActive()) {
          this.ghost.clear();
          this.gltfRenderer?.updateGhostPreview(null, 0, 0, 0, true);
          this.palette.clearSelection();
        } else {
          this.board.selectEntity(null);
        }
      }
    });

    // Pointer Move for Ghost preview and Entity dragging
    const canvas = this.viewportManager.app.canvas;

    canvas.addEventListener('mousemove', (e) => {
      if (!this._isActive) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.viewportManager.screenToWorld(screenX, screenY);

      if (this.ghost.isActive() && this.activeTemplate) {
        const ts = GRID_CONFIG.TILE_SIZE;
        const col = Math.floor(worldPos.x / ts);
        const row = Math.floor(worldPos.y / ts);

        const isRotated = this.ghost.rotation === 90 || this.ghost.rotation === 270;
        const w = isRotated ? this.activeTemplate.height : this.activeTemplate.width;
        const h = isRotated ? this.activeTemplate.width : this.activeTemplate.height;

        const isAvailable = this.grid.isAreaAvailable(col, row, w, h);
        this.ghost.updatePosition(worldPos.x, worldPos.y, isAvailable);

        // Update 3D Ghost preview in Three.js
        this.gltfRenderer?.updateGhostPreview(this.activeTemplate, col, row, this.ghost.rotation, isAvailable);
      } else if (this.isDraggingEntity && this.draggedEntity) {
        // Drag existing entity
        const ts = GRID_CONFIG.TILE_SIZE;
        const col = Math.max(0, Math.min(GRID_CONFIG.COLS - this.draggedEntity.width, Math.floor(worldPos.x / ts)));
        const row = Math.max(0, Math.min(GRID_CONFIG.ROWS - this.draggedEntity.height, Math.floor(worldPos.y / ts)));

        if (this.draggedEntity.gridX !== col || this.draggedEntity.gridY !== row) {
          // Free previous area in grid
          this.grid.setAreaOccupied(this.draggedEntity.gridX, this.draggedEntity.gridY, this.draggedEntity.width, this.draggedEntity.height, false);

          this.draggedEntity.gridX = col;
          this.draggedEntity.gridY = row;

          this.grid.setAreaOccupied(col, row, this.draggedEntity.width, this.draggedEntity.height, true);
          this.board.addOrUpdateEntity(this.draggedEntity);
          this.gltfRenderer?.addOrUpdateEntity(this.draggedEntity);
        }
      }
    });

    // Left Click: Place entity or start drag
    canvas.addEventListener('mousedown', (e) => {
      if (!this._isActive) return;

      if (e.button === 0) { // Left click
        if (this.ghost.isActive() && this.activeTemplate) {
          this.placeGhostEntity();
          e.stopPropagation();
        } else {
          // Check if clicked on selected entity to drag
          const selected = this.board.getSelectedEntity();
          if (selected) {
            const rect = canvas.getBoundingClientRect();
            const worldPos = this.viewportManager.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            const ts = GRID_CONFIG.TILE_SIZE;
            const clickCol = Math.floor(worldPos.x / ts);
            const clickRow = Math.floor(worldPos.y / ts);

            if (
              clickCol >= selected.gridX &&
              clickCol < selected.gridX + selected.width &&
              clickRow >= selected.gridY &&
              clickRow < selected.gridY + selected.height
            ) {
              this.draggedEntity = selected;
              this.isDraggingEntity = true;
              this.viewportManager.setDragEnabled(false);
            }
          }
        }
      } else if (e.button === 2) { // Right click -> Delete hovered/selected
        e.preventDefault();
        const selected = this.board.getSelectedEntity();
        if (selected) {
          this.deleteEntity(selected.id);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingEntity) {
        this.isDraggingEntity = false;
        this.draggedEntity = null;
        this.viewportManager.setDragEnabled(true);
      }
    });

    // Prevent default context menu in editor
    canvas.addEventListener('contextmenu', (e) => {
      if (this._isActive) {
        e.preventDefault();
      }
    });
  }

  /**
   * Places the active ghost entity onto the board
   */
  private placeGhostEntity(): void {
    if (!this.activeTemplate) return;

    const isRotated = this.ghost.rotation === 90 || this.ghost.rotation === 270;
    const w = isRotated ? this.activeTemplate.height : this.activeTemplate.width;
    const h = isRotated ? this.activeTemplate.width : this.activeTemplate.height;
    const col = this.ghost.gridX;
    const row = this.ghost.gridY;

    const newEntity: PlacedEntity = {
      id: `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      category: this.activeTemplate.category,
      type: this.activeTemplate.type,
      name: this.activeTemplate.name,
      gridX: col,
      gridY: row,
      width: w,
      height: h,
      rotation: this.ghost.rotation,
      colorHex: this.activeTemplate.colorHex,
      schoolName: this.activeTemplate.schoolName,
      metadata: this.activeTemplate.metadata,
    };

    // Update KnowledgeGrid
    this.grid.setAreaOccupied(col, row, w, h, true);

    // Add to 2D board
    this.board.addOrUpdateEntity(newEntity);

    // Add to 3D Renderer
    this.gltfRenderer?.addOrUpdateEntity(newEntity);

    // Update vision in Fog of War
    this.fogLayer.revealPermanentAreas([newEntity]);

    // Select the newly placed entity
    this.board.selectEntity(newEntity.id);
  }

  /**
   * Delete an entity from board, grid and 3D renderer
   */
  public deleteEntity(id: string): void {
    const entity = this.board.getEntity(id);
    if (!entity) return;

    this.grid.setAreaOccupied(entity.gridX, entity.gridY, entity.width, entity.height, false);
    this.board.removeEntity(id);
    this.gltfRenderer?.removeEntity(id);
  }

  // --- Import / Export ---

  private handleExportLayout(): void {
    const entities = this.board.getAllEntities();
    LayoutSerializer.downloadJson(entities);
  }

  private async handleImportLayout(file: File): Promise<void> {
    try {
      const text = await file.text();
      const entities = LayoutSerializer.parse(text);

      // Rebuild map
      this.loadLayout(entities);
      alert(`Đã nạp thành công layout với ${entities.length} vật thể!`);
    } catch (err: any) {
      alert(`Lỗi nạp layout: ${err.message}`);
    }
  }

  public loadLayout(entities: PlacedEntity[]): void {
    // Clear current occupancy in grid
    this.grid.reset();

    // Set entities in 2D board
    this.board.setEntities(entities);

    // Set entities in 3D renderer
    this.gltfRenderer?.setEntities(entities);

    // Mark occupancy in grid
    entities.forEach((e) => {
      this.grid.setAreaOccupied(e.gridX, e.gridY, e.width, e.height, true);
    });

    // Reveal fog for landmarks and HQs
    this.fogLayer.resetFogCanvas();
    this.fogLayer.revealPermanentAreas(entities);
  }

  private handleResetLayout(): void {
    if (confirm('Khôi phục lại sa bàn với 10 công trình biểu tượng và các Trụ sở mặc định?')) {
      const initial = createInitialLayout();
      this.loadLayout(initial);
    }
  }

  private handleClearLayout(): void {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ vật thể trên bản đồ?')) {
      this.grid.reset();
      this.board.setEntities([]);
      this.gltfRenderer?.clearAll();
      this.fogLayer.resetFogCanvas();
    }
  }

  private handleToggleFog(): void {
    this.fogLayer.setFogEnabled(!this.fogLayer.fogEnabled);
  }
}
