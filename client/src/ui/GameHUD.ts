import { DEFAULT_10_LANDMARKS } from '../constants/defaultLayout';
import { ViewportManager } from '../core/ViewportManager';
import { FogOfWarLayer } from '../renderer/FogOfWarLayer';
import { BeaconRenderer } from '../renderer/BeaconRenderer';
import { CarouselModal } from './CarouselModal';
import { KeyTier, GRID_CONFIG } from '../constants/terminology';
import { VFXManager } from '../renderer3d/VFXManager';

export interface HUDGameState {
  points: number;
  charcoal: number;
  flags: number;
  keys: {
    silver: number;
    gold: number;
    platinum: number;
  };
}

/**
 * GameHUD: Cyberpunk HUD bar displaying points, ingredients, keys,
 * coordinate telemetry, landmark quick-jump, and game actions.
 */
export class GameHUD {
  private container: HTMLDivElement;
  private readonly viewportManager: ViewportManager;
  private readonly fogLayer: FogOfWarLayer;
  private readonly beaconRenderer: BeaconRenderer;
  private readonly carouselModal: CarouselModal;
  private readonly vfxManager?: VFXManager;
  private onToggleEditorCallback: () => void;

  private state: HUDGameState = {
    points: 1250,
    charcoal: 4,
    flags: 6,
    keys: {
      silver: 3,
      gold: 1,
      platinum: 1,
    },
  };

  constructor(
    viewportManager: ViewportManager,
    fogLayer: FogOfWarLayer,
    beaconRenderer: BeaconRenderer,
    carouselModal: CarouselModal,
    onToggleEditor: () => void,
    vfxManager?: VFXManager
  ) {
    this.viewportManager = viewportManager;
    this.fogLayer = fogLayer;
    this.beaconRenderer = beaconRenderer;
    this.carouselModal = carouselModal;
    this.onToggleEditorCallback = onToggleEditor;
    this.vfxManager = vfxManager;

    this.container = document.createElement('div');
    this.container.id = 'game-hud-overlay';
    document.body.appendChild(this.container);

    this.render();
    this.bindEvents();
    this.bindTelemetryUpdates();
  }

  public updateState(partial: Partial<HUDGameState>): void {
    Object.assign(this.state, partial);
    this.updateStatsDisplay();
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Top Cyber Bar -->
      <header class="hud-top-bar">
        <div class="hud-brand">
          <div class="hud-logo-icon">▲</div>
          <div class="hud-title-group">
            <span class="hud-main-title">ROAD TO PREDATOR LEAGUE</span>
            <span class="hud-sub-title">SA BÀN SỐ 2.5D ISOMETRIC • 1.000.000 Ô</span>
          </div>
        </div>

        <!-- Real-time Stats: Points, Ingredients, Keys -->
        <div class="hud-stats-group">
          <!-- Points -->
          <div class="stat-badge" title="Điểm tri thức tích lũy">
            <span class="stat-icon">⭐</span>
            <div class="stat-info">
              <span class="stat-label">POINTS</span>
              <span id="stat-points" class="stat-val highlight-cyan">${this.state.points.toLocaleString()}</span>
            </div>
          </div>

          <!-- Charcoal / Than củi -->
          <div class="stat-badge" title="Than củi nạp đài lửa">
            <span class="stat-icon">🪵</span>
            <div class="stat-info">
              <span class="stat-label">THAN CỦI</span>
              <span id="stat-charcoal" class="stat-val highlight-gold">${this.state.charcoal}</span>
            </div>
          </div>

          <!-- Keys -->
          <div class="stat-badge" title="Chìa khóa mở rương">
            <span class="stat-icon">🗝️</span>
            <div class="stat-info">
              <span class="stat-label">KEYS</span>
              <span id="stat-keys" class="stat-val keys-display">
                <span class="key-s" title="Silver">S:${this.state.keys.silver}</span>
                <span class="key-g" title="Gold">G:${this.state.keys.gold}</span>
                <span class="key-p" title="Platinum">P:${this.state.keys.platinum}</span>
              </span>
            </div>
          </div>

          <!-- Telemetry coordinates -->
          <div class="stat-badge telemetry-badge">
            <span class="stat-icon">🌐</span>
            <div class="stat-info">
              <span class="stat-label">TỌA ĐỘ</span>
              <span id="stat-coords" class="stat-val">X: 480 | Y: 460</span>
            </div>
          </div>
        </div>

        <!-- Quick Action & Admin Buttons -->
        <div class="hud-actions-group">
          <button id="btn-open-carousel" class="cyber-btn cyber-btn-gacha" title="Mở Rương với Vòng Quay Carousel CS:GO">
            🎁 VÒNG QUAY MỞ RƯƠNG
          </button>
          <button id="btn-explore-knowledge" class="cyber-btn cyber-btn-cyan" title="Khai phá vùng tri thức (VFX Sóng xung kích làm tan sương mù)">
            ⚡ KHAI PHÁ TRI THỨC
          </button>
          <button id="btn-light-beacon" class="cyber-btn cyber-btn-gold" title="Nạp than củi đốt đài lửa rực sáng">
            🔥 ĐỐT ĐÀI LỬA
          </button>
          <button id="btn-toggle-editor" class="cyber-btn cyber-btn-editor" title="Bật/Tắt Map Editor (Phím F2)">
            🛠️ EDITOR MODE (F2)
          </button>
        </div>
      </header>

      <!-- Left Landmark Teleport Sidebar -->
      <aside class="hud-landmarks-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">📍 10 BIỂU TƯỢNG QUỐC GIA 3D</span>
        </div>
        <div class="landmarks-list" id="landmarks-jump-list">
          ${DEFAULT_10_LANDMARKS.map(
            (lm) => `
            <button class="landmark-jump-btn" data-x="${lm.defaultGridX}" data-y="${lm.defaultGridY}" title="${lm.description}">
              <span class="lm-icon">${lm.icon}</span>
              <div class="lm-text">
                <span class="lm-name">${lm.name}</span>
                <span class="lm-coords">[${lm.defaultGridX}, ${lm.defaultGridY}]</span>
              </div>
            </button>
          `
          ).join('')}
        </div>
      </aside>
    `;
  }

  private bindEvents(): void {
    const ts = GRID_CONFIG.TILE_SIZE;

    // Open Carousel
    const btnCarousel = this.container.querySelector('#btn-open-carousel');
    btnCarousel?.addEventListener('click', () => {
      this.carouselModal.open(KeyTier.GOLD, (wonItem) => {
        if (wonItem.rewardType === 'points') {
          this.state.points += 250;
        } else if (wonItem.rewardType === 'ingredient') {
          this.state.charcoal += 2;
        }
        this.updateStatsDisplay();
      });
    });

    // Explore Knowledge with Shockwave Pulse Ripple VFX
    const btnExplore = this.container.querySelector('#btn-explore-knowledge');
    btnExplore?.addEventListener('click', () => {
      const center = this.viewportManager.viewport.center;
      const gridPos = this.viewportManager.worldToGrid(center.x, center.y);

      // Trigger 3D Neon Cyan Shockwave Ripple
      this.vfxManager?.triggerPulseRipple(center.x, center.y, 6, '#00ffe8');

      // Clear Fog
      this.fogLayer.revealZone(gridPos.col, gridPos.row, 6);
      this.state.points += 50;
      this.updateStatsDisplay();
    });

    // Light Beacon with 3D Plasma Flame Particles
    const btnBeacon = this.container.querySelector('#btn-light-beacon');
    btnBeacon?.addEventListener('click', () => {
      const center = this.viewportManager.viewport.center;
      const gridPos = this.viewportManager.worldToGrid(center.x, center.y);
      const beaconId = `beacon_${Date.now()}`;

      this.beaconRenderer.registerBeacon(beaconId, gridPos.col, gridPos.row, 3);
      this.beaconRenderer.addCharcoal(beaconId, 3);

      // Register 3D Flame Particle System
      this.vfxManager?.registerBeaconVFX(beaconId, center.x, center.y, '#00ffe8');
      this.vfxManager?.triggerPulseRipple(center.x, center.y, 10, '#ffb800');

      this.fogLayer.revealZone(gridPos.col, gridPos.row, 10);
      if (this.state.charcoal > 0) this.state.charcoal--;
      this.updateStatsDisplay();
    });

    // Toggle Editor
    const btnEditor = this.container.querySelector('#btn-toggle-editor');
    btnEditor?.addEventListener('click', () => {
      this.onToggleEditorCallback();
    });

    // Landmark Teleports with Pulse
    const jumpBtns = this.container.querySelectorAll('.landmark-jump-btn');
    jumpBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const x = parseInt(target.getAttribute('data-x') || '480', 10);
        const y = parseInt(target.getAttribute('data-y') || '460', 10);
        this.viewportManager.focusOnGrid(x, y, 0.6, true);
        this.fogLayer.revealZone(x, y, 12);
        this.vfxManager?.triggerPulseRipple((x + 0.5) * ts, (y + 0.5) * ts, 12, '#00ffe8');
      });
    });
  }

  private bindTelemetryUpdates(): void {
    const coordsEl = this.container.querySelector('#stat-coords');
    if (!coordsEl) return;

    this.viewportManager.onViewportChanged(() => {
      const center = this.viewportManager.viewport.center;
      const grid = this.viewportManager.worldToGrid(center.x, center.y);
      const zoom = Math.round(this.viewportManager.viewport.scaled * 100);
      coordsEl.textContent = `X: ${grid.col} | Y: ${grid.row} (${zoom}%)`;
    });
  }

  private updateStatsDisplay(): void {
    const pointsEl = this.container.querySelector('#stat-points');
    const charcoalEl = this.container.querySelector('#stat-charcoal');
    const keysEl = this.container.querySelector('#stat-keys');

    if (pointsEl) pointsEl.textContent = this.state.points.toLocaleString();
    if (charcoalEl) charcoalEl.textContent = this.state.charcoal.toString();
    if (keysEl) {
      keysEl.innerHTML = `
        <span class="key-s" title="Silver">S:${this.state.keys.silver}</span>
        <span class="key-g" title="Gold">G:${this.state.keys.gold}</span>
        <span class="key-p" title="Platinum">P:${this.state.keys.platinum}</span>
      `;
    }
  }
}
