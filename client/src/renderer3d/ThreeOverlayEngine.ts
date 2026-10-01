import * as THREE from 'three';
import { ViewportManager } from '../core/ViewportManager';

export type ThreeUpdateCallback = (delta: number, elapsed: number) => void;

/**
 * ThreeOverlayEngine: Sets up a high-performance Three.js 2.5D Isometric WebGL layer
 * positioned seamlessly on top of the 2D Pixi sa bàn, synchronized 1:1 with pixi-viewport.
 */
export class ThreeOverlayEngine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.OrthographicCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly canvas: HTMLCanvasElement;

  private readonly viewportManager: ViewportManager;
  private readonly clock: THREE.Clock = new THREE.Clock();

  // Cyber Lights
  private dirSunLight: THREE.DirectionalLight;
  private cyanRimLight: THREE.PointLight;
  private electricBlueLight: THREE.DirectionalLight;

  private updateListeners: Set<ThreeUpdateCallback> = new Set();
  private isRunning: boolean = true;

  // 2.5D Isometric Elevation factor (shears height Y upwards on screen)
  public static readonly ISOMETRIC_SHEAR_Y = 0.55;
  public static readonly ISOMETRIC_SHEAR_X = -0.22;

  constructor(viewportManager: ViewportManager, container: HTMLElement) {
    this.viewportManager = viewportManager;

    // 1. Three.js Scene
    this.scene = new THREE.Scene();

    // 2. Orthographic Camera for 2.5D Isometric view
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -10000, 10000);
    // Camera looks down from above (+Y down to 0) with up pointing along -Z (matching Pixi +Y)
    this.camera.position.set(0, 1000, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer with transparency & shadows
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.canvas = this.renderer.domElement;
    this.canvas.id = 'threejs-3d-overlay';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none'; // Clicks pass down to Pixi viewport
    this.canvas.style.zIndex = '2'; // Above Pixi canvas (z-index 1)

    container.appendChild(this.canvas);

    // 4. Predator High-Tech Lighting Setup
    // Ambient
    const ambient = new THREE.AmbientLight(0x0e1726, 1.6);
    this.scene.add(ambient);

    // Key Directional Sun (casting shadows)
    this.dirSunLight = new THREE.DirectionalLight(0xdcf8ff, 2.4);
    this.dirSunLight.position.set(300, 800, -300);
    this.dirSunLight.castShadow = true;
    this.dirSunLight.shadow.mapSize.width = 2048;
    this.dirSunLight.shadow.mapSize.height = 2048;
    this.dirSunLight.shadow.camera.near = 10;
    this.dirSunLight.shadow.camera.far = 3000;
    const d = 1200;
    this.dirSunLight.shadow.camera.left = -d;
    this.dirSunLight.shadow.camera.right = d;
    this.dirSunLight.shadow.camera.top = d;
    this.dirSunLight.shadow.camera.bottom = -d;
    this.dirSunLight.shadow.bias = -0.0005;
    this.scene.add(this.dirSunLight);

    // Predator Neon Cyan Rim Light (Accents metallic edges)
    this.cyanRimLight = new THREE.PointLight(0x00ffe8, 3.5, 3000);
    this.cyanRimLight.position.set(-400, 400, 400);
    this.scene.add(this.cyanRimLight);

    // Electric Blue Fill Light
    this.electricBlueLight = new THREE.DirectionalLight(0x0077fe, 1.8);
    this.electricBlueLight.position.set(-200, 300, 300);
    this.scene.add(this.electricBlueLight);

    // 5. Synchronize with Pixi Viewport
    this.syncCameraWithViewport();
    this.viewportManager.onViewportChanged(() => this.syncCameraWithViewport());

    // Window resize
    window.addEventListener('resize', () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      this.renderer.setSize(nw, nh);
      this.syncCameraWithViewport();
    });

    // 6. Start Render Loop
    this.startLoop();
  }

  /**
   * Synchronizes Three.js camera position, zoom & 2.5D isometric projection
   * with Pixi Viewport state in real-time.
   */
  public syncCameraWithViewport(): void {
    const vp = this.viewportManager.viewport;
    const center = vp.center; // in Pixi world pixels (X, Y)
    const scale = vp.scaled;

    const screenW = vp.screenWidth;
    const screenH = vp.screenHeight;

    const halfW = (screenW / 2) / scale;
    const halfH = (screenH / 2) / scale;

    // Set orthographic bounds
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;

    // In Three.js: X = Pixi worldX, Z = Pixi worldY, Y = height
    this.camera.position.set(center.x, 1000, center.y);
    this.camera.lookAt(center.x, 0, center.y);

    // Apply standard update
    this.camera.updateProjectionMatrix();

    // Apply 2.5D Isometric Oblique Shear:
    // This shifts height (camera Z_cam) onto vertical (Y_cam) and horizontal (X_cam)
    // while keeping the ground plane (Z_cam = 0) perfectly locked to Pixi's 2D grid!
    this.camera.projectionMatrix.elements[8] = ThreeOverlayEngine.ISOMETRIC_SHEAR_X;
    this.camera.projectionMatrix.elements[9] = ThreeOverlayEngine.ISOMETRIC_SHEAR_Y;

    // Move lights to follow current camera focus
    this.dirSunLight.position.set(center.x + 350, 900, center.y - 350);
    this.dirSunLight.target.position.set(center.x, 0, center.y);
    this.dirSunLight.target.updateMatrixWorld();

    this.cyanRimLight.position.set(center.x - 400, 450, center.y + 400);
    this.electricBlueLight.position.set(center.x - 200, 300, center.y + 300);
  }

  public onUpdate(callback: ThreeUpdateCallback): () => void {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  private startLoop(): void {
    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Trigger animations
      this.updateListeners.forEach((cb) => cb(delta, elapsed));

      // Render 3D Scene
      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(animate);
  }

  public destroy(): void {
    this.isRunning = false;
    this.canvas.remove();
    this.renderer.dispose();
  }
}
