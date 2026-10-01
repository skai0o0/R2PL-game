import { EntityCategory, PlacedEntity, UniStopType, ChestTier } from './terminology';

export interface LandmarkDefinition {
  id: string;
  name: string;
  category: EntityCategory.SCENIC_SPOT | EntityCategory.LANDMARK;
  description: string;
  defaultGridX: number;
  defaultGridY: number;
  width: number;
  height: number;
  colorHex: string;
  icon: string;
  visionRadius: number;
}

/**
 * 10 CÔNG TRÌNH BIỂU TƯỢNG QUỐC GIA BAN ĐẦU
 * Phong cách Predator High-Tech / Cyberpunk
 */
export const DEFAULT_10_LANDMARKS: LandmarkDefinition[] = [
  // --- A. DANH LAM THẮNG CẢNH (SCENIC SPOTS) ---
  {
    id: 'scenic_fansipan',
    name: 'Đỉnh Fansipan',
    category: EntityCategory.SCENIC_SPOT,
    description: 'Chóp inox nóc nhà Đông Dương, bệ đá bậc thang High-tech lơ lửng giữa biển mây.',
    defaultGridX: 180,
    defaultGridY: 150,
    width: 6,
    height: 6,
    colorHex: '#00FFE8',
    icon: '🏔️',
    visionRadius: 12,
  },
  {
    id: 'scenic_halong',
    name: 'Vịnh Hạ Long',
    category: EntityCategory.SCENIC_SPOT,
    description: 'Hòn Trống Mái cách điệu hợp kim đen nhám, đài phát laser giữa làn nước hologram.',
    defaultGridX: 420,
    defaultGridY: 190,
    width: 8,
    height: 8,
    colorHex: '#00C8FF',
    icon: '🌊',
    visionRadius: 14,
  },
  {
    id: 'scenic_phongnha',
    name: 'Động Phong Nha',
    category: EntityCategory.SCENIC_SPOT,
    description: 'Vòm hang động thạch nhũ kết hợp đèn LED viền thám hiểm và năng lượng ngầm.',
    defaultGridX: 360,
    defaultGridY: 380,
    width: 6,
    height: 6,
    colorHex: '#2AE5A1',
    icon: '🪨',
    visionRadius: 10,
  },
  {
    id: 'scenic_nguhanhson',
    name: 'Núi Ngũ Hành Sơn',
    category: EntityCategory.SCENIC_SPOT,
    description: '5 ngọn núi ngũ hành lồng ghép tinh thể pha lê phát sáng quang phổ Predator.',
    defaultGridX: 520,
    defaultGridY: 520,
    width: 7,
    height: 7,
    colorHex: '#9D00FF',
    icon: '🔮',
    visionRadius: 11,
  },
  {
    id: 'scenic_baden',
    name: 'Núi Bà Đen',
    category: EntityCategory.SCENIC_SPOT,
    description: 'Nóc nhà Nam Bộ, đỉnh núi vươn mây với đài tiếp sóng năng lượng vệ tinh.',
    defaultGridX: 390,
    defaultGridY: 760,
    width: 7,
    height: 7,
    colorHex: '#FF5500',
    icon: '⛰️',
    visionRadius: 12,
  },

  // --- B. CÔNG TRÌNH BIỂU TƯỢNG (LANDMARKS) ---
  {
    id: 'landmark_thanglong',
    name: 'Hoàng thành Thăng Long',
    category: EntityCategory.LANDMARK,
    description: 'Đoan Môn cổ kính kết hợp khung viền ánh sáng viễn tưởng và tường thành laser.',
    defaultGridX: 310,
    defaultGridY: 220,
    width: 8,
    height: 8,
    colorHex: '#FFD700',
    icon: '🏯',
    visionRadius: 14,
  },
  {
    id: 'landmark_haiphong_port',
    name: 'Cảng Hải Phòng',
    category: EntityCategory.LANDMARK,
    description: 'Cần cẩu giàn công nghệ robot và ngọn hải đăng quét sóng tín hiệu quang lượng tử.',
    defaultGridX: 470,
    defaultGridY: 250,
    width: 8,
    height: 6,
    colorHex: '#0077FE',
    icon: '⚓',
    visionRadius: 12,
  },
  {
    id: 'landmark_hue_citadel',
    name: 'Kinh Thành Huế',
    category: EntityCategory.LANDMARK,
    description: 'Cột cờ Phu Văn Lâu / Ngọ Môn lộng lẫy màu hoàng gia pha neon Cyberpunk.',
    defaultGridX: 480,
    defaultGridY: 460,
    width: 8,
    height: 8,
    colorHex: '#E5A50A',
    icon: '👑',
    visionRadius: 13,
  },
  {
    id: 'landmark_bitexco',
    name: 'Toà nhà Bitexco',
    category: EntityCategory.LANDMARK,
    description: 'Tòa tháp búp sen biểu tượng hiện đại với sân đỗ trực thăng phát sáng Cyan rực rỡ.',
    defaultGridX: 450,
    defaultGridY: 820,
    width: 6,
    height: 6,
    colorHex: '#00FFE8',
    icon: '🏙️',
    visionRadius: 15,
  },
  {
    id: 'landmark_cairang',
    name: 'Chợ nổi Cái Răng',
    category: EntityCategory.LANDMARK,
    description: 'Bến thuyền sông nước Tây Nam Bộ thiết kế phong cách Cyberpunk đa sắc màu.',
    defaultGridX: 340,
    defaultGridY: 880,
    width: 7,
    height: 7,
    colorHex: '#FF0077',
    icon: '🛶',
    visionRadius: 11,
  },
];

/**
 * Trụ sở mẫu ban đầu (Headquarters) đại diện cho các trường Đại học
 */
export const DEFAULT_HEADQUARTERS: PlacedEntity[] = [
  {
    id: 'hq_hust',
    category: EntityCategory.HEADQUARTERS,
    type: 'Headquarters',
    name: 'Trụ sở: ĐH Bách Khoa Hà Nội (HUST)',
    schoolName: 'ĐH Bách Khoa Hà Nội',
    gridX: 280,
    gridY: 200,
    width: 5,
    height: 5,
    rotation: 0,
    colorHex: '#FF3344',
  },
  {
    id: 'hq_fpt',
    category: EntityCategory.HEADQUARTERS,
    type: 'Headquarters',
    name: 'Trụ sở: ĐH FPT (Hòa Lạc)',
    schoolName: 'ĐH FPT',
    gridX: 250,
    gridY: 240,
    width: 5,
    height: 5,
    rotation: 0,
    colorHex: '#FF7700',
  },
  {
    id: 'hq_uit',
    category: EntityCategory.HEADQUARTERS,
    type: 'Headquarters',
    name: 'Trụ sở: ĐH Công Nghệ Thông Tin (UIT - ĐHQG HCM)',
    schoolName: 'ĐH CNTT (UIT)',
    gridX: 480,
    gridY: 800,
    width: 5,
    height: 5,
    rotation: 0,
    colorHex: '#0099FF',
  },
  {
    id: 'hq_dut',
    category: EntityCategory.HEADQUARTERS,
    type: 'Headquarters',
    name: 'Trụ sở: ĐH Bách Khoa - ĐH Đà Nẵng (DUT)',
    schoolName: 'ĐH Bách Khoa Đà Nẵng',
    gridX: 510,
    gridY: 500,
    width: 5,
    height: 5,
    rotation: 0,
    colorHex: '#00CC88',
  },
];

/**
 * Trạm tiếp tế (UniStops) mẫu
 */
export const DEFAULT_UNISTOPS: PlacedEntity[] = [
  {
    id: 'unistop_aspire_1',
    category: EntityCategory.UNISTOP,
    type: UniStopType.ASPIRE,
    name: 'Trạm UniStop - Aspire (North)',
    gridX: 300,
    gridY: 170,
    width: 3,
    height: 3,
    rotation: 0,
    colorHex: '#00A3FF',
  },
  {
    id: 'unistop_nitro_1',
    category: EntityCategory.UNISTOP,
    type: UniStopType.NITRO,
    name: 'Trạm UniStop - Nitro (Central)',
    gridX: 470,
    gridY: 430,
    width: 3,
    height: 3,
    rotation: 0,
    colorHex: '#FF2A55',
  },
  {
    id: 'unistop_predator_1',
    category: EntityCategory.UNISTOP,
    type: UniStopType.PREDATOR,
    name: 'Trạm UniStop - Predator (South)',
    gridX: 430,
    gridY: 850,
    width: 4,
    height: 4,
    rotation: 0,
    colorHex: '#00FFE8',
  },
];

/**
 * Rương mẫu (Chests) rải rác trên sa bàn
 */
export const DEFAULT_CHESTS: PlacedEntity[] = [
  {
    id: 'chest_silver_1',
    category: EntityCategory.CHEST,
    type: ChestTier.SILVER,
    name: 'Chest - Silver (Tây Bắc)',
    gridX: 200,
    gridY: 160,
    width: 2,
    height: 2,
    rotation: 0,
    colorHex: '#C0C0C0',
  },
  {
    id: 'chest_gold_1',
    category: EntityCategory.CHEST,
    type: ChestTier.GOLD,
    name: 'Chest - Gold (Miền Trung)',
    gridX: 460,
    gridY: 490,
    width: 2,
    height: 2,
    rotation: 0,
    colorHex: '#FFD700',
  },
  {
    id: 'chest_platinum_1',
    category: EntityCategory.CHEST,
    type: ChestTier.PLATINUM,
    name: 'Chest - Platinum (Khu Công Nghệ)',
    gridX: 470,
    gridY: 780,
    width: 2,
    height: 2,
    rotation: 0,
    colorHex: '#00FFE8',
  },
];

/**
 * Ghép tổng hợp cấu hình mặc định ban đầu
 */
export function createInitialLayout(): PlacedEntity[] {
  const result: PlacedEntity[] = [];

  // Convert 10 landmarks into PlacedEntities
  DEFAULT_10_LANDMARKS.forEach((lm) => {
    result.push({
      id: lm.id,
      category: lm.category,
      type: lm.name,
      name: lm.name,
      gridX: lm.defaultGridX,
      gridY: lm.defaultGridY,
      width: lm.width,
      height: lm.height,
      rotation: 0,
      colorHex: lm.colorHex,
      metadata: {
        description: lm.description,
        icon: lm.icon,
        visionRadius: lm.visionRadius,
      },
    });
  });

  // Add HQs
  result.push(...DEFAULT_HEADQUARTERS);

  // Add UniStops
  result.push(...DEFAULT_UNISTOPS);

  // Add Chests
  result.push(...DEFAULT_CHESTS);

  return result;
}
