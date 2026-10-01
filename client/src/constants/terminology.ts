/**
 * ROAD TO PREDATOR LEAGUE (R2PL) - STANDARDIZED TERMINOLOGY & CONSTANTS
 * Mandatory standard identifiers across Client Engine, Visual Renderer & Editor.
 */

// Grid Specs
export const GRID_CONFIG = {
  COLS: 1000,
  ROWS: 1000,
  TOTAL_CELLS: 1_000_000,
  TILE_SIZE: 32, // Pixels per grid cell in world space
  BOARD_WIDTH: 32_000, // 1000 * 32
  BOARD_HEIGHT: 32_000,
  EXPLORE_RADIUS_DEFAULT: 5, // Radius R=5 cells revealed when exploring
  HQ_VISION_RADIUS: 10, // Vision radius around Headquarters
  LANDMARK_VISION_RADIUS: 8, // Vision radius around Scenic Spots and Landmarks
} as const;

// Visual Theme Palette (Predator High-Tech / Cyberpunk)
export const THEME_COLORS = {
  BACKGROUND_BLACK: 0x0B0D12, // Matte Black base
  BACKGROUND_HEX: '#0B0D12',
  GRID_BASE: 0x121824, // Subtle grid line
  GRID_MAJOR: 0x1B2A3D, // Major sector line (every 10 tiles)
  GRID_SECTOR: 0x00FFE8, // Sector boundary (every 50 tiles)
  PREDATOR_CYAN: 0x00FFE8, // Signature Predator Neon Cyan
  PREDATOR_CYAN_HEX: '#00FFE8',
  ELECTRIC_BLUE: 0x0077FE,
  ELECTRIC_BLUE_HEX: '#0077FE',
  NEON_PURPLE: 0x9D00FF,
  NEON_GOLD: 0xFFB800,
  NEON_RED: 0xFF2A55,
  CARBON_DARK: 0x07080B,
  CIRCUIT_TRACE: 0x00FFE8,
  CIRCUIT_TRACE_HEX: '#00FFE8',
  FOG_COLOR: 0x05070A, // Cyber tech smoke color
  FOG_ALPHA: 0.94,
} as const;

// 1. Ô đất -> Vùng tri thức (Knowledge)
export enum KnowledgeStatus {
  UNEXPLORED = 0, // Shrouded in Fog of War
  EXPLORED = 1,   // Explored & Visible
  ACTIVE_BEACON = 2, // Powered with Charcoal (Than củi)
  CONTESTED = 3,  // Territory under competition
}

// 2. Phân loại thực thể đặt trên bản đồ (Placeable Entity Categories)
export enum EntityCategory {
  HEADQUARTERS = 'HEADQUARTERS',
  SCENIC_SPOT = 'SCENIC_SPOT',
  LANDMARK = 'LANDMARK',
  UNISTOP = 'UNISTOP',
  CHEST = 'CHEST',
}

// 3. Trạm tiếp tế (UniStops)
export enum UniStopType {
  ASPIRE = 'UniStop - Aspire',
  NITRO = 'UniStop - Nitro',
  PREDATOR = 'UniStop - Predator',
}

// 4. Rương & Chìa khoá (Chests & Keys)
export enum ChestTier {
  SILVER = 'Chest - Silver',
  GOLD = 'Chest - Gold',
  PLATINUM = 'Chest - Platinum',
}

export enum KeyTier {
  SILVER = 'Key - Silver',
  GOLD = 'Key - Gold',
  PLATINUM = 'Key - Platinum',
}

// 5. Nguyên liệu (Ingredients)
export enum IngredientType {
  CHARCOAL = 'Than củi', // Nạp vào đài lửa Beacon
  PREDATOR_FLAG = 'Cờ Predator', // Cắm viền lãnh thổ
  CIRCUIT_CORE = 'Lõi vi mạch',
  HOLOGRAM_SHARD = 'Mảnh Hologram',
}

// 6. Quà thật / Hiện vật (Gift)
export interface GiftReward {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  image?: string;
  isPhysical: boolean; // true: quà thật nhận tận tay
}

// Phân cấp phần thưởng gacha Carousel CS:GO
export const CAROUSEL_REWARD_TIERS = {
  COMMON: {
    name: 'Common',
    colorHex: '#8E9BAE',
    bgColor: 'rgba(142, 155, 174, 0.2)',
    borderColor: '#8E9BAE',
  },
  UNCOMMON: {
    name: 'Uncommon',
    colorHex: '#00FFE8',
    bgColor: 'rgba(0, 255, 232, 0.2)',
    borderColor: '#00FFE8',
  },
  RARE: {
    name: 'Rare',
    colorHex: '#0077FE',
    bgColor: 'rgba(0, 119, 254, 0.2)',
    borderColor: '#0077FE',
  },
  EPIC: {
    name: 'Epic',
    colorHex: '#9D00FF',
    bgColor: 'rgba(157, 0, 255, 0.2)',
    borderColor: '#9D00FF',
  },
  LEGENDARY: {
    name: 'Legendary (Gift)',
    colorHex: '#FFB800',
    bgColor: 'rgba(255, 184, 0, 0.25)',
    borderColor: '#FFB800',
  },
} as const;

// Structure for an Entity placed on the map
export interface PlacedEntity {
  id: string;
  category: EntityCategory;
  type: string; // UniStopType | ChestTier | Landmark / ScenicSpot name
  name: string;
  gridX: number;
  gridY: number;
  width: number; // in tiles
  height: number; // in tiles
  rotation: number; // 0, 90, 180, 270 in degrees
  colorHex?: string;
  logoUrl?: string;
  schoolName?: string;
  metadata?: Record<string, unknown>;
}
