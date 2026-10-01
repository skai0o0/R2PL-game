import { DEFAULT_10_LANDMARKS, DEFAULT_HEADQUARTERS } from '../constants/defaultLayout';
import { EntityCategory, UniStopType, ChestTier, PlacedEntity } from '../constants/terminology';
import { GhostTemplate } from './GhostPlacement';

export interface EditorPaletteCallbacks {
  onSelectTemplate: (template: GhostTemplate | null) => void;
  onExportLayout: () => void;
  onImportLayout: (file: File) => void;
  onResetLayout: () => void;
  onClearLayout: () => void;
  onToggleFog: () => void;
  onClose: () => void;
}

/**
 * EditorPalette: The Sims-style high-tech bottom dock palette for placing
 * Headquarters, Scenic Spots & Landmarks, UniStops and Chests.
 */
export class EditorPalette {
  private container: HTMLDivElement;
  private callbacks: EditorPaletteCallbacks;
  private activeTab: 'hqs' | 'landmarks' | 'unistops' | 'chests' = 'landmarks';
  private selectedTemplateName: string | null = null;

  constructor(callbacks: EditorPaletteCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'editor-palette-dock';
    this.container.className = 'editor-palette';
    document.body.appendChild(this.container);

    this.render();
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  public isVisible(): boolean {
    return this.container.style.display !== 'none';
  }

  public clearSelection(): void {
    this.selectedTemplateName = null;
    this.container.querySelectorAll('.palette-card').forEach((el) => {
      el.classList.remove('selected');
    });
    this.callbacks.onSelectTemplate(null);
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="palette-header">
        <div class="palette-title">
          <span class="predator-badge">EDITOR MODE</span>
          <span class="palette-subtitle">THE SIMS MAP ARCHITECT • SA BÀN 1.000.000 Ô</span>
        </div>

        <div class="palette-actions">
          <button id="btn-export-layout" class="cyber-btn cyber-btn-primary" title="Xuất file map_layout_v2.json">
            💾 Export JSON
          </button>
          <label class="cyber-btn cyber-btn-secondary" title="Nạp file JSON đã thiết kế">
            📂 Import JSON
            <input type="file" id="input-import-layout" accept=".json" style="display: none;" />
          </label>
          <button id="btn-toggle-fog" class="cyber-btn" title="Bật/Tắt Sương mù để dễ quan sát">
            👁️ Toggle Fog
          </button>
          <button id="btn-reset-layout" class="cyber-btn cyber-btn-warning" title="Khôi phục 10 công trình mặc định">
            ↺ Default Map
          </button>
          <button id="btn-close-editor" class="cyber-btn cyber-btn-danger" title="Đóng chế độ Editor (F2)">
            ✕ Đóng (F2)
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="palette-tabs">
        <button class="palette-tab ${this.activeTab === 'landmarks' ? 'active' : ''}" data-tab="landmarks">
          🏛️ Danh Lam & Biểu Tượng (10)
        </button>
        <button class="palette-tab ${this.activeTab === 'hqs' ? 'active' : ''}" data-tab="hqs">
          🏫 Trụ Sở Trường (Headquarters)
        </button>
        <button class="palette-tab ${this.activeTab === 'unistops' ? 'active' : ''}" data-tab="unistops">
          ⛽ Trạm Tiếp Tế (UniStops)
        </button>
        <button class="palette-tab ${this.activeTab === 'chests' ? 'active' : ''}" data-tab="chests">
          📦 Rương Thưởng (Chests)
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="palette-content" id="palette-content-body">
        <!-- Rendered dynamically -->
      </div>

      <!-- Quick Shortcuts Guide -->
      <div class="palette-footer">
        <span class="shortcut"><kbd>Click Trái</kbd> Đặt vật thể</span>
        <span class="shortcut"><kbd>R</kbd> Xoay 90°</span>
        <span class="shortcut"><kbd>Delete</kbd> / <kbd>Click Phải</kbd> Xóa vật thể</span>
        <span class="shortcut"><kbd>Kéo chuột</kbd> Di chuyển vị trí</span>
        <span class="shortcut"><kbd>F2</kbd> Bật/Tắt Editor</span>
      </div>
    `;

    this.bindEvents();
    this.renderTabContent();
  }

  private bindEvents(): void {
    // Tabs
    const tabs = this.container.querySelectorAll('.palette-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabKey = target.getAttribute('data-tab') as any;
        if (tabKey) {
          this.activeTab = tabKey;
          tabs.forEach((t) => t.classList.remove('active'));
          target.classList.add('active');
          this.renderTabContent();
        }
      });
    });

    // Action buttons
    const btnExport = this.container.querySelector('#btn-export-layout');
    btnExport?.addEventListener('click', () => this.callbacks.onExportLayout());

    const inputImport = this.container.querySelector('#input-import-layout') as HTMLInputElement;
    inputImport?.addEventListener('change', () => {
      if (inputImport.files && inputImport.files[0]) {
        this.callbacks.onImportLayout(inputImport.files[0]);
        inputImport.value = '';
      }
    });

    const btnToggleFog = this.container.querySelector('#btn-toggle-fog');
    btnToggleFog?.addEventListener('click', () => this.callbacks.onToggleFog());

    const btnReset = this.container.querySelector('#btn-reset-layout');
    btnReset?.addEventListener('click', () => this.callbacks.onResetLayout());

    const btnClose = this.container.querySelector('#btn-close-editor');
    btnClose?.addEventListener('click', () => this.callbacks.onClose());
  }

  private renderTabContent(): void {
    const body = this.container.querySelector('#palette-content-body');
    if (!body) return;

    body.innerHTML = '';

    if (this.activeTab === 'landmarks') {
      this.renderLandmarksTab(body);
    } else if (this.activeTab === 'hqs') {
      this.renderHQsTab(body);
    } else if (this.activeTab === 'unistops') {
      this.renderUniStopsTab(body);
    } else if (this.activeTab === 'chests') {
      this.renderChestsTab(body);
    }
  }

  /**
   * Tab 1: 10 Danh lam thắng cảnh & Công trình biểu tượng
   */
  private renderLandmarksTab(container: Element): void {
    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    DEFAULT_10_LANDMARKS.forEach((lm) => {
      const card = document.createElement('div');
      card.className = `palette-card ${this.selectedTemplateName === lm.name ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-icon">${lm.icon}</div>
        <div class="card-info">
          <div class="card-title">${lm.name}</div>
          <div class="card-category">${lm.category === EntityCategory.SCENIC_SPOT ? 'Thắng Cảnh' : 'Biểu Tượng'} • ${lm.width}x${lm.height}</div>
          <div class="card-desc">${lm.description}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectCard(card, {
          category: lm.category,
          type: lm.name,
          name: lm.name,
          width: lm.width,
          height: lm.height,
          colorHex: lm.colorHex,
          metadata: {
            icon: lm.icon,
            description: lm.description,
            visionRadius: lm.visionRadius,
          },
        });
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  /**
   * Tab 2: Headquarters (Trụ sở các trường Đại học)
   */
  private renderHQsTab(container: Element): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'palette-hq-wrapper';

    // Form create custom HQ
    const formBox = document.createElement('div');
    formBox.className = 'hq-custom-form';
    formBox.innerHTML = `
      <div class="form-title">Tạo Trụ Sở Trường Mới</div>
      <div class="form-row">
        <input type="text" id="hq-custom-name" placeholder="Tên trường (VD: ĐH Kinh Tế Quốc Dân)" class="cyber-input" />
        <input type="color" id="hq-custom-color" value="#00FFE8" class="cyber-color-input" title="Chọn màu đặc trưng" />
        <select id="hq-custom-size" class="cyber-select">
          <option value="4">Kích thước: 4x4 ô</option>
          <option value="5" selected>Kích thước: 5x5 ô (Chuẩn)</option>
          <option value="6">Kích thước: 6x6 ô</option>
        </select>
        <button id="btn-create-hq" class="cyber-btn cyber-btn-primary">+ Chọn Đặt Trụ Sở</button>
      </div>
    `;

    wrapper.appendChild(formBox);

    // Existing presets
    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    DEFAULT_HEADQUARTERS.forEach((hq) => {
      const card = document.createElement('div');
      card.className = `palette-card ${this.selectedTemplateName === hq.name ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-icon" style="color: ${hq.colorHex}">🏛️</div>
        <div class="card-info">
          <div class="card-title">${hq.schoolName || hq.name}</div>
          <div class="card-category">Trụ Sở Trường • ${hq.width}x${hq.height}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectCard(card, {
          category: EntityCategory.HEADQUARTERS,
          type: 'Headquarters',
          name: hq.name,
          width: hq.width,
          height: hq.height,
          colorHex: hq.colorHex,
          schoolName: hq.schoolName,
        });
      });

      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    // Bind custom HQ create button
    const btnCreate = formBox.querySelector('#btn-create-hq');
    btnCreate?.addEventListener('click', () => {
      const nameInput = formBox.querySelector('#hq-custom-name') as HTMLInputElement;
      const colorInput = formBox.querySelector('#hq-custom-color') as HTMLInputElement;
      const sizeInput = formBox.querySelector('#hq-custom-size') as HTMLSelectElement;

      const schoolName = nameInput.value.trim() || 'Trụ sở Đại học Mới';
      const color = colorInput.value;
      const size = parseInt(sizeInput.value, 10) || 5;

      this.clearSelection();
      this.callbacks.onSelectTemplate({
        category: EntityCategory.HEADQUARTERS,
        type: 'Headquarters',
        name: `Trụ sở: ${schoolName}`,
        width: size,
        height: size,
        colorHex: color,
        schoolName,
      });
    });
  }

  /**
   * Tab 3: UniStops
   */
  private renderUniStopsTab(container: Element): void {
    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    const unistops = [
      {
        type: UniStopType.ASPIRE,
        name: 'UniStop - Aspire',
        desc: 'Trạm tiếp tế năng lượng cơ bản. Cung cấp than củi và chìa khóa bạc.',
        width: 3,
        height: 3,
        colorHex: '#00A3FF',
        icon: '⚡',
      },
      {
        type: UniStopType.NITRO,
        name: 'UniStop - Nitro',
        desc: 'Trạm tiếp tế tốc độ cao. Cung cấp than củi x2 và chìa khóa vàng.',
        width: 3,
        height: 3,
        colorHex: '#FF2A55',
        icon: '🔥',
      },
      {
        type: UniStopType.PREDATOR,
        name: 'UniStop - Predator',
        desc: 'Trạm tối thượng Predator. Nạp đầy năng lượng đài lửa và phát chìa Bạch Kim.',
        width: 4,
        height: 4,
        colorHex: '#00FFE8',
        icon: '👑',
      },
    ];

    unistops.forEach((us) => {
      const card = document.createElement('div');
      card.className = `palette-card ${this.selectedTemplateName === us.name ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-icon" style="color: ${us.colorHex}">${us.icon}</div>
        <div class="card-info">
          <div class="card-title">${us.name}</div>
          <div class="card-category">Trạm Tiếp Tế • ${us.width}x${us.height}</div>
          <div class="card-desc">${us.desc}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectCard(card, {
          category: EntityCategory.UNISTOP,
          type: us.type,
          name: us.name,
          width: us.width,
          height: us.height,
          colorHex: us.colorHex,
        });
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  /**
   * Tab 4: Chests
   */
  private renderChestsTab(container: Element): void {
    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    const chests = [
      {
        type: ChestTier.SILVER,
        name: 'Chest - Silver',
        desc: 'Rương Bạc. Cần Key - Silver. Nhận Điểm và Than củi.',
        width: 2,
        height: 2,
        colorHex: '#C0C0C0',
        icon: '🪙',
      },
      {
        type: ChestTier.GOLD,
        name: 'Chest - Gold',
        desc: 'Rương Vàng. Cần Key - Gold. Cơ hội mở quà hiện vật và điểm khủng.',
        width: 2,
        height: 2,
        colorHex: '#FFD700',
        icon: '🏆',
      },
      {
        type: ChestTier.PLATINUM,
        name: 'Chest - Platinum',
        desc: 'Rương Bạch Kim Tối Thượng. Cần Key - Platinum. Tỷ lệ quà thật R2PL cực cao!',
        width: 2,
        height: 2,
        colorHex: '#00FFE8',
        icon: '💎',
      },
    ];

    chests.forEach((c) => {
      const card = document.createElement('div');
      card.className = `palette-card ${this.selectedTemplateName === c.name ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="card-icon" style="color: ${c.colorHex}">${c.icon}</div>
        <div class="card-info">
          <div class="card-title">${c.name}</div>
          <div class="card-category">Rương Thưởng • ${c.width}x${c.height}</div>
          <div class="card-desc">${c.desc}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectCard(card, {
          category: EntityCategory.CHEST,
          type: c.type,
          name: c.name,
          width: c.width,
          height: c.height,
          colorHex: c.colorHex,
        });
      });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  private selectCard(cardElement: HTMLElement, template: GhostTemplate): void {
    const isAlreadySelected = this.selectedTemplateName === template.name;

    this.container.querySelectorAll('.palette-card').forEach((el) => el.classList.remove('selected'));

    if (isAlreadySelected) {
      this.clearSelection();
    } else {
      cardElement.classList.add('selected');
      this.selectedTemplateName = template.name;
      this.callbacks.onSelectTemplate(template);
    }
  }
}
