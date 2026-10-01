import { Application } from 'pixi.js';
import { THEME_COLORS, GRID_CONFIG } from './constants/terminology';
import { createInitialLayout } from './constants/defaultLayout';
import { KnowledgeGrid } from './core/KnowledgeGrid';
import { ViewportManager } from './core/ViewportManager';
import { PredatorBoard } from './renderer/PredatorBoard';
import { FogOfWarLayer } from './renderer/FogOfWarLayer';
import { BeaconRenderer } from './renderer/BeaconRenderer';
import { FlagBorderSystem, TerritoryFlag } from './renderer/FlagBorderSystem';
import { MapEditorMode } from './editor/MapEditorMode';
import { CarouselModal } from './ui/CarouselModal';
import { GameHUD } from './ui/GameHUD';
import { ThreeOverlayEngine } from './renderer3d/ThreeOverlayEngine';
import { GLTFModelRenderer } from './renderer3d/GLTFModelRenderer';
import { VFXManager } from './renderer3d/VFXManager';

async function bootstrapGameEngine() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║    ROAD TO PREDATOR LEAGUE - 2.5D ISOMETRIC 3D VISUAL ENGINE v2.5         ║
  ║      MÔ HÌNH 3D NỔI KHỐI • DRACO GLTF LOADER • SHOCKWAVE PULSE VFX        ║
  ║                 SA BÀN SỐ 1.000.000 Ô • THE SIMS MAP ARCHITECT            ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  const container = document.getElementById('app-container');
  if (!container) throw new Error('Root #app-container element not found');

  // 1. Initialize Pixi.js v8 WebGL Application (2D Ground, Grid, Fog of War)
  const app = new Application();
  await app.init({
    backgroundColor: THEME_COLORS.BACKGROUND_BLACK,
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  container.appendChild(app.canvas);

  // 2. Initialize Core Systems
  const grid = new KnowledgeGrid();
  const viewportManager = new ViewportManager(app);

  // 3. Initialize 2D Renderers
  const board = new PredatorBoard(viewportManager);
  const fogLayer = new FogOfWarLayer(viewportManager, grid);
  const beaconRenderer = new BeaconRenderer(viewportManager);
  const flagSystem = new FlagBorderSystem(viewportManager);

  // 4. Initialize Three.js 2.5D Isometric 3D Overlay Layer
  const threeEngine = new ThreeOverlayEngine(viewportManager, container);
  const gltfRenderer = new GLTFModelRenderer(threeEngine, viewportManager);
  const vfxManager = new VFXManager(threeEngine);

  // 5. Load Initial Map Layout (10 Scenic Spots/Landmarks, HQs, UniStops, Chests)
  const initialEntities = createInitialLayout();
  board.setEntities(initialEntities);
  gltfRenderer.setEntities(initialEntities);

  // Register occupancy in KnowledgeGrid
  initialEntities.forEach((e) => {
    grid.setAreaOccupied(e.gridX, e.gridY, e.width, e.height, true);
  });

  // Reveal permanent vision around HQs, Scenic Spots, and Landmarks
  fogLayer.revealPermanentAreas(initialEntities);

  // Seed sample territory flags around HQs
  const sampleFlags: TerritoryFlag[] = [
    { id: 'f_hust_1', gridX: 280, gridY: 198, schoolColorHex: '#FF3344', label: 'HUST' },
    { id: 'f_hust_2', gridX: 285, gridY: 198, schoolColorHex: '#FF3344', label: 'HUST' },
    { id: 'f_fpt_1', gridX: 250, gridY: 238, schoolColorHex: '#FF7700', label: 'FPT' },
    { id: 'f_uit_1', gridX: 480, gridY: 798, schoolColorHex: '#0099FF', label: 'UIT' },
    { id: 'f_dut_1', gridX: 510, gridY: 498, schoolColorHex: '#00CC88', label: 'DUT' },
  ];
  flagSystem.setFlags(sampleFlags);

  // Register initial beacons in 2D & 3D VFX
  const ts = GRID_CONFIG.TILE_SIZE;
  beaconRenderer.registerBeacon('beacon_hue', 485, 465, 5);
  beaconRenderer.registerBeacon('beacon_bitexco', 453, 824, 5);
  beaconRenderer.registerBeacon('beacon_fansipan', 183, 154, 5);

  vfxManager.registerBeaconVFX('beacon_hue', 485 * ts, 465 * ts, '#00ffe8');
  vfxManager.registerBeaconVFX('beacon_bitexco', 453 * ts, 824 * ts, '#0077fe');
  vfxManager.registerBeaconVFX('beacon_fansipan', 183 * ts, 154 * ts, '#ffb800');

  // 6. Initialize Map Editor Mode ("The Sims" style) with 3D sync
  const editorMode = new MapEditorMode(viewportManager, grid, board, fogLayer, gltfRenderer);

  // 7. Initialize UI Modals & HUD
  const carouselModal = new CarouselModal();
  const gameHud = new GameHUD(
    viewportManager,
    fogLayer,
    beaconRenderer,
    carouselModal,
    () => editorMode.toggle(),
    vfxManager
  );

  // Synchronize Editor toggle button state
  editorMode.onStateChange((isActive) => {
    const editorBtn = document.getElementById('btn-toggle-editor');
    if (editorBtn) {
      if (isActive) {
        editorBtn.classList.add('cyber-btn-primary');
        editorBtn.innerHTML = '✕ ĐÓNG EDITOR (F2)';
      } else {
        editorBtn.classList.remove('cyber-btn-primary');
        editorBtn.innerHTML = '🛠️ EDITOR MODE (F2)';
      }
    }
  });

  // 8. Interactive Click-to-Explore with Pulse Ripple (when not in Editor Mode)
  let clickDownPos = { x: 0, y: 0 };
  const canvas = app.canvas;

  canvas.addEventListener('mousedown', (e) => {
    clickDownPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('click', (e) => {
    if (editorMode.isActive) return;

    // Detect if this was a click rather than a pan/drag
    const dist = Math.hypot(e.clientX - clickDownPos.x, e.clientY - clickDownPos.y);
    if (dist > 6) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = viewportManager.screenToWorld(screenX, screenY);
    const gridPos = viewportManager.worldToGrid(worldPos.x, worldPos.y);

    if (grid.isWithinBounds(gridPos.col, gridPos.row)) {
      // Trigger 3D Neon Cyan Shockwave Ripple VFX
      vfxManager.triggerPulseRipple(worldPos.x, worldPos.y, 5, '#00ffe8');

      // Clear Fog of War in radius R=5
      fogLayer.revealZone(gridPos.col, gridPos.row, 5);

      // Add points
      gameHud.updateState({ points: (gameHud as any).state.points + 25 });
    }
  });

  // Focus initially on Central Region (Kinh Thành Huế: x=480, y=460)
  viewportManager.focusOnGrid(480, 460, 0.45, false);

  console.log('✅ Khởi tạo thành công Engine sa bàn 2.5D Isometric 3D với 1.000.000 ô!');
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrapGameEngine().catch((err) => {
    console.error('Fatal Error during game engine initialization:', err);
  });
});
