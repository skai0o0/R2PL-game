import { GRID_CONFIG } from '../constants/terminology';

/**
 * Flag bitmask for Knowledge cell Uint8 state:
 * - Bit 0 (0x01): EXPLORED (Fog cleared)
 * - Bit 1 (0x02): OCCUPIED (Has Landmark, HQ, UniStop, Chest)
 * - Bit 2 (0x04): BEACON_ACTIVE (Lit with Charcoal/Than củi)
 * - Bit 3 (0x08): CONTESTED
 * - Bits 4-7 (0xF0): School Territory ID (0..15)
 */
export const GRID_BITS = {
  EXPLORED: 1 << 0,      // 0x01
  OCCUPIED: 1 << 1,      // 0x02
  BEACON_ACTIVE: 1 << 2, // 0x04
  CONTESTED: 1 << 3,     // 0x08
  TERRITORY_MASK: 0xF0,
} as const;

export interface TileCoord {
  x: number;
  y: number;
}

export type GridChangeCallback = (cells: TileCoord[]) => void;

/**
 * KnowledgeGrid: Manages the 1,000,000 cells (1000 x 1000) using a flat Uint8Array.
 * Optimized for high performance and low memory footprint (~1MB RAM).
 */
export class KnowledgeGrid {
  public readonly cols: number = GRID_CONFIG.COLS;
  public readonly rows: number = GRID_CONFIG.ROWS;
  public readonly totalCells: number = GRID_CONFIG.TOTAL_CELLS;
  
  // Flat typed array for 1M cells
  public readonly data: Uint8Array;

  // Total explored count cache
  private _exploredCount: number = 0;

  // Listeners for fog exploration updates
  private exploreListeners: Set<GridChangeCallback> = new Set();
  private cellChangeListeners: Set<GridChangeCallback> = new Set();

  constructor() {
    this.data = new Uint8Array(this.totalCells);
  }

  /**
   * Fast boundary check
   */
  public isWithinBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  /**
   * Convert 2D grid coordinates to 1D index
   */
  public getIndex(x: number, y: number): number {
    return y * this.cols + x;
  }

  /**
   * Convert 1D index back to 2D coordinates
   */
  public getCoords(index: number): TileCoord {
    return {
      x: index % this.cols,
      y: Math.floor(index / this.cols),
    };
  }

  /**
   * Raw cell byte value
   */
  public getRaw(x: number, y: number): number {
    if (!this.isWithinBounds(x, y)) return 0;
    return this.data[this.getIndex(x, y)];
  }

  public setRaw(x: number, y: number, value: number): void {
    if (!this.isWithinBounds(x, y)) return;
    this.data[this.getIndex(x, y)] = value;
  }

  // --- Exploration & Fog of War ---

  public isExplored(x: number, y: number): boolean {
    if (!this.isWithinBounds(x, y)) return false;
    return (this.data[this.getIndex(x, y)] & GRID_BITS.EXPLORED) !== 0;
  }

  public setExplored(x: number, y: number, explored: boolean = true): boolean {
    if (!this.isWithinBounds(x, y)) return false;
    const idx = this.getIndex(x, y);
    const current = this.data[idx];
    const isCurrentlyExplored = (current & GRID_BITS.EXPLORED) !== 0;

    if (explored && !isCurrentlyExplored) {
      this.data[idx] = current | GRID_BITS.EXPLORED;
      this._exploredCount++;
      return true;
    } else if (!explored && isCurrentlyExplored) {
      this.data[idx] = current & ~GRID_BITS.EXPLORED;
      this._exploredCount = Math.max(0, this._exploredCount - 1);
      return true;
    }
    return false;
  }

  /**
   * Reveals a circular radius of knowledge around a center coordinate.
   * Returns newly revealed cell coordinates.
   */
  public exploreRadius(cx: number, cy: number, radius: number): TileCoord[] {
    const revealed: TileCoord[] = [];
    const r2 = radius * radius;

    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.cols - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.rows - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const dy2 = dy * dy;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        if (dx * dx + dy2 <= r2) {
          if (this.setExplored(x, y, true)) {
            revealed.push({ x, y });
          }
        }
      }
    }

    if (revealed.length > 0) {
      this.notifyExplored(revealed);
    }
    return revealed;
  }

  public get exploredCount(): number {
    return this._exploredCount;
  }

  public get exploredPercentage(): number {
    return (this._exploredCount / this.totalCells) * 100;
  }

  // --- Occupancy & Collision for Buildings/Chests ---

  public isOccupied(x: number, y: number): boolean {
    if (!this.isWithinBounds(x, y)) return true; // Treat outside as occupied
    return (this.data[this.getIndex(x, y)] & GRID_BITS.OCCUPIED) !== 0;
  }

  public setOccupied(x: number, y: number, occupied: boolean): void {
    if (!this.isWithinBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    if (occupied) {
      this.data[idx] |= GRID_BITS.OCCUPIED;
    } else {
      this.data[idx] &= ~GRID_BITS.OCCUPIED;
    }
  }

  public isAreaAvailable(startX: number, startY: number, width: number, height: number): boolean {
    if (startX < 0 || startY < 0 || startX + width > this.cols || startY + height > this.rows) {
      return false;
    }
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        if (this.isOccupied(x, y)) {
          return false;
        }
      }
    }
    return true;
  }

  public setAreaOccupied(startX: number, startY: number, width: number, height: number, occupied: boolean): void {
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        this.setOccupied(x, y, occupied);
      }
    }
  }

  // --- Beacon & Charcoal (Than củi) ---

  public isBeaconActive(x: number, y: number): boolean {
    if (!this.isWithinBounds(x, y)) return false;
    return (this.data[this.getIndex(x, y)] & GRID_BITS.BEACON_ACTIVE) !== 0;
  }

  public setBeaconActive(x: number, y: number, active: boolean): void {
    if (!this.isWithinBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    if (active) {
      this.data[idx] |= GRID_BITS.BEACON_ACTIVE;
      // Activating a beacon automatically reveals surroundings
      this.exploreRadius(x, y, GRID_CONFIG.HQ_VISION_RADIUS);
    } else {
      this.data[idx] &= ~GRID_BITS.BEACON_ACTIVE;
    }
  }

  // --- Territory Ownership (University HQ territory) ---

  public getTerritoryId(x: number, y: number): number {
    if (!this.isWithinBounds(x, y)) return 0;
    return (this.data[this.getIndex(x, y)] & GRID_BITS.TERRITORY_MASK) >> 4;
  }

  public setTerritoryId(x: number, y: number, territoryId: number): void {
    if (!this.isWithinBounds(x, y)) return;
    const idx = this.getIndex(x, y);
    const clamped = (territoryId & 0x0F) << 4;
    this.data[idx] = (this.data[idx] & ~GRID_BITS.TERRITORY_MASK) | clamped;
  }

  // --- Subscriptions & Events ---

  public onExplored(callback: GridChangeCallback): () => void {
    this.exploreListeners.add(callback);
    return () => this.exploreListeners.delete(callback);
  }

  public onCellChanged(callback: GridChangeCallback): () => void {
    this.cellChangeListeners.add(callback);
    return () => this.cellChangeListeners.delete(callback);
  }

  private notifyExplored(cells: TileCoord[]): void {
    this.exploreListeners.forEach((cb) => cb(cells));
  }

  /**
   * Reset grid to pristine state
   */
  public reset(): void {
    this.data.fill(0);
    this._exploredCount = 0;
  }
}
