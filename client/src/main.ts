import { Application } from 'pixi.js';
import { THEME_COLORS } from './constants/terminology';
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

async function bootstrapGameEngine() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║    ROAD TO PREDATOR LEAGUE - CLIENT VISUAL ENGINE v2.0    ║
  ║       SA BÀN SỐ 1.000.000 Ô • THE SIMS MAP ARCHITECT      ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // 1. Initialize Pixi.js v8 WebGL Application
  const app = new Application();
  await app.init({
    backgroundColor: THEME_COLORS.BACKGROUND_BLACK,
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });

  const container = document.getElementById('app-container');
  if (container) {
    container.appendChild(app.canvas);
  }

  // 2. Initialize Core Systems
  const grid = new KnowledgeGrid();
  const viewportManager = new ViewportManager(app);

  // 3. Initialize Renderers
  const board = new PredatorBoard(viewportManager);
  const fogLayer = new FogOfWarLayer(viewportManager, grid);
  const beaconRenderer = new BeaconRenderer(viewportManager);
  const flagSystem = new FlagBorderSystem(viewportManager);

  // 4. Load Initial Map Layout (10 Scenic Spots/Landmarks, HQs, UniStops, Chests)
  const initialEntities = createInitialLayout();
  board.setEntities(initialEntities);

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

  // Register initial beacons at key locations
  beaconRenderer.registerBeacon('beacon_hue', 485, 465, 5);
  beaconRenderer.registerBeacon('beacon_bitexco', 453, 824, 5);
  beaconRenderer.registerBeacon('beacon_fansipan', 183, 154, 5);

  // 5. Initialize Map Editor Mode ("The Sims" style)
  const editorMode = new MapEditorMode(viewportManager, grid, board, fogLayer);

  // 6. Initialize UI Modals & HUD
  const carouselModal = new CarouselModal();
  const gameHud = new GameHUD(
    viewportManager,
    fogLayer,
    beaconRenderer,
    carouselModal,
    () => editorMode.toggle()
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

  // Focus initially on Central Region (Kinh Thành Huế: x=480, y=460)
  viewportManager.focusOnGrid(480, 460, 0.45, false);

  console.log('✅ Khởi tạo thành công Engine sa bàn R2PL với 1.000.000 ô và Map Editor Mode!');
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrapGameEngine().catch((err) => {
    console.error('Fatal Error during game engine initialization:', err);
  });
});
