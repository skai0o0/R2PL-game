# HÀNH TRÌNH KHÁM PHÁ - ROAD TO PREDATOR LEAGUE (R2PL)
## WebGL / Pixi.js Client & Procedural Visual Engine (1.000.000 Ô Sa Bàn)

Dự án sa bàn số thời gian thực quy mô **1.000.000 ô** ($1000 \times 1000$) phục vụ giải đấu công nghệ **Road to Predator League (R2PL)**.

---

## 1. PHONG CÁCH THẨM MỸ (VISUAL THEME)
- **Nền sa bàn:** Hợp kim đen nhám (Matte Black `#0B0D12`), vân carbon dập nổi, đường chỉ viền mạch điện tử (Circuit traces).
- **Màu nhấn (Accent):** Xanh Cyan Neon đặc trưng của Predator (`#00FFE8`), Electric Blue (`#0077FE`), Hologram shimmer.
- **Tối ưu hóa hiệu năng 1M ô:** Quản lý bằng mảng phẳng `Uint8Array(1_000_000)` (~1MB RAM), hệ thống Pixi Viewport Culling chỉ render các ô và thực thể trong tầm nhìn camera để duy trì mượt mà 60+ FPS.

---

## 2. CHUẨN HÓA THUẬT NGỮ CỐT LÕI (MANDATORY TERMINOLOGY)

| Thuật ngữ gốc | Chuẩn hóa R2PL | Mô tả & Chức năng |
| :--- | :--- | :--- |
| Ô đất | **`Knowledge`** (Vùng tri thức) | Các ô trên ma trận $1000 \times 1000$, khai phá để mở sương mù và tích lũy Points. |
| Danh lam | **`Scenic Spots`** | 5 danh lam thắng cảnh quốc gia (Fansipan, Hạ Long, Phong Nha, Ngũ Hành Sơn, Núi Bà Đen). |
| Công trình | **`Landmarks`** | 5 công trình biểu tượng (Thăng Long, Cảng Hải Phòng, Kinh Thành Huế, Bitexco, Chợ nổi Cái Răng). |
| Trường ĐH | **`Headquarters`** | Trụ sở các trường đại học (HUST, FPT, UIT, DUT...), có logo, mã màu đại diện và tầm nhìn cố định. |
| Trạm tiếp tế | **`UniStop - Aspire`**<br>**`UniStop - Nitro`**<br>**`UniStop - Predator`** | Điểm tiếp tế năng lượng, phát chìa khóa và than củi cho sinh viên. |
| Rương | **`Chest - Silver`**<br>**`Chest - Gold`**<br>**`Chest - Platinum`** | Hòm báu vật rải rác trên sa bàn, chứa điểm, than củi và quà hiện vật thật. |
| Chìa khóa | **`Key - Silver`**<br>**`Key - Gold`**<br>**`Key - Platinum`** | Dùng để mở loại rương tương ứng trong Vòng quay Carousel. |
| Mở hòm | **`Carousel`** | Vòng quay gacha kiểu CS:GO Roulette với hiệu ứng âm thanh cơ khí và sấm sét Predator. |
| Điểm số | **`Points`** | Điểm tích lũy cá nhân và trường đại học. |
| Nguyên liệu | **`Ingredients`** | Than củi (nạp đài lửa), Cờ Predator (cắm viền lãnh thổ), Lõi vi mạch... |
| Quà thật | **`Gift`** | Hiện vật thật gửi tận tay: Áo thun R2PL, Móc khóa Titan, Vớ gaming, Chuột Cestus... |

---

## 3. CẤU TRÚC MÃ NGUỒN (SOURCE CODE ARCHITECTURE)

```
client/
├── public/
│   ├── assets/
│   │   ├── textures/           # Vân carbon, mạch điện tử, cờ Predator, icon
│   │   └── models/             # Thư mục chứa GLB nén Draco của 3D assets
├── src/
│   ├── constants/
│   │   ├── terminology.ts      # Enums, Types & Constants chuẩn hóa
│   │   └── defaultLayout.ts    # Dữ liệu mẫu 10 công trình biểu tượng & Trụ sở HQs
│   ├── core/
│   │   ├── KnowledgeGrid.ts    # Quản lý mảng phẳng Uint8Array(1_000_000)
│   │   └── ViewportManager.ts  # Pixi-viewport với Culling chỉ vẽ ô trong màn hình
│   ├── editor/
│   │   ├── MapEditorMode.ts    # Bộ điều khiển chế độ "The Sims"
│   │   ├── EditorPalette.ts    # Thanh dock kéo thả Headquarters, Landmarks, UniStop, Chest
│   │   ├── GhostPlacement.ts   # Preview vật thể, Snap to Grid, phím R xoay 90 độ
│   │   └── LayoutSerializer.ts # Export/Import JSON cấu hình bản đồ
│   ├── renderer/
│   │   ├── PredatorBoard.ts    # Render sàn đấu vuông theme Predator
│   │   ├── FogOfWarLayer.ts    # Lớp sương mù che phủ & cơ chế tan sương
│   │   ├── BeaconRenderer.ts   # Hiệu ứng đài lửa khi nạp đủ than củi
│   │   └── FlagBorderSystem.ts # Hệ thống cắm cờ Predator viền
│   └── ui/
│       ├── GameHUD.ts          # Thanh hiển thị Points, Than củi, Chìa khóa
│       └── CarouselModal.ts    # Vòng quay gacha mở rương kiểu CS:GO
assets/
└── scripts/
    ├── generate_unistops.py    # Script Blender Python sinh trạm UniStop 3D
    ├── generate_landmarks.py   # Script Blender Python sinh 10 công trình biểu tượng 3D
    └── run_pipeline.py         # Trình điều khiển Blender headless xuất file GLB
```

---

## 4. HƯỚNG DẪN SỬ DỤNG BỘ CÔNG CỤ THE SIMS EDITOR

1. **Bật/Tắt Editor:** Nhấn phím `F2` hoặc nút **"EDITOR MODE (F2)"** ở thanh HUD trên cùng.
2. **Chọn & Đặt vật thể:**
   - Chọn từ các tab: **Danh Lam & Biểu Tượng**, **Trụ Sở Trường**, **UniStops**, **Chests**.
   - Di chuột trên sa bàn: Khung Hologram tự động **Snap vào ô lưới gần nhất $[X, Y]$**.
   - `Click chuột trái`: Đặt vật thể cố định lên sa bàn.
   - `Phím R`: Xoay vật thể $90^\circ$.
   - `Phím Delete` hoặc `Click chuột phải`: Xóa vật thể đã chọn.
   - `Kéo - thả`: Bấm chuột trái vào vật thể đã đặt để kéo sang vị trí mới.
3. **Lưu trữ & Chia sẻ bản đồ:**
   - **Export JSON:** Bấm nút `Export JSON` để tải về file `map_layout_v2.json`.
   - **Import JSON:** Bấm `Import JSON` để nạp lại đúng layout đã thiết kế.

---

## 5. HƯỚNG DẪN CHẠY DỰ ÁN

### Yêu cầu môi trường:
- Node.js >= 18.x
- npm >= 9.x

### Khởi chạy Client:
```bash
cd client
npm install
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### Build dự án:
```bash
cd client
npm run build
```

---
*Road to Predator League - Empowering Next-Gen Gaming & Knowledge Explorers.*
