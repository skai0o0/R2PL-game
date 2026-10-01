import { PlacedEntity } from '../constants/terminology';

export interface MapLayoutFile {
  version: string;
  game: string;
  timestamp: string;
  gridDimensions: {
    cols: number;
    rows: number;
    totalCells: number;
    tileSize: number;
  };
  totalEntities: number;
  entities: PlacedEntity[];
}

/**
 * LayoutSerializer: Handles exporting and importing map_layout_v2.json
 */
export class LayoutSerializer {
  public static readonly VERSION = '2.0.0';

  /**
   * Serializes current entities into standard JSON structure
   */
  public static serialize(entities: PlacedEntity[]): string {
    const layout: MapLayoutFile = {
      version: this.VERSION,
      game: 'Hành Trình Khám Phá - Road To Predator League (R2PL)',
      timestamp: new Date().toISOString(),
      gridDimensions: {
        cols: 1000,
        rows: 1000,
        totalCells: 1_000_000,
        tileSize: 32,
      },
      totalEntities: entities.length,
      entities,
    };

    return JSON.stringify(layout, null, 2);
  }

  /**
   * Triggers browser download of map_layout_v2.json
   */
  public static downloadJson(entities: PlacedEntity[], filename: string = 'map_layout_v2.json'): void {
    const jsonStr = this.serialize(entities);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parses and validates imported JSON data
   */
  public static parse(jsonStr: string): PlacedEntity[] {
    try {
      const data = JSON.parse(jsonStr);
      let entityList: PlacedEntity[] = [];

      if (Array.isArray(data)) {
        entityList = data;
      } else if (data && Array.isArray(data.entities)) {
        entityList = data.entities;
      } else {
        throw new Error('Định dạng JSON không hợp lệ: Thiếu danh sách entities');
      }

      // Basic validation
      const validEntities = entityList.filter((e) => {
        return (
          e &&
          typeof e.id === 'string' &&
          typeof e.gridX === 'number' &&
          typeof e.gridY === 'number' &&
          typeof e.width === 'number' &&
          typeof e.height === 'number'
        );
      });

      return validEntities;
    } catch (err: any) {
      console.error('Failed to parse layout JSON:', err);
      throw new Error(`Lỗi đọc file JSON: ${err.message}`);
    }
  }
}
