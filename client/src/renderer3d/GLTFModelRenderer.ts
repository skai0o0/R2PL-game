import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { PlacedEntity, EntityCategory, UniStopType, ChestTier, GRID_CONFIG } from '../constants/terminology';
import { ViewportManager, VisibleTileBounds } from '../core/ViewportManager';
import { ThreeOverlayEngine } from './ThreeOverlayEngine';
import { Predator3DModels, ModelAnimationHooks } from './Predator3DModels';
import { GhostTemplate } from '../editor/GhostPlacement';

interface Entity3DEntry {
  entity: PlacedEntity;
  group: THREE.Group;
  hooks: ModelAnimationHooks;
  originalY: number;
}

/**
 * GLTFModelRenderer: Loads compressed GLBs via Draco, renders 3D Isometric models
 * with metallic lighting, cast shadows, and runs idle animations.
 */
export class GLTFModelRenderer {
  private readonly engine: ThreeOverlayEngine;
  private readonly viewportManager: ViewportManager;

  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  // Active 3D entities
  private entities3D: Map<string, Entity3DEntry> = new Map();
  private modelsContainer: THREE.Group;

  // Ghost Preview for Map Editor
  private ghostGroup: THREE.Group | null = null;

  // Cache for loaded GLB scenes
  private glbCache: Map<string, THREE.Group> = new Map();

  constructor(engine: ThreeOverlayEngine, viewportManager: ViewportManager) {
    this.engine = engine;
    this.viewportManager = viewportManager;

    this.modelsContainer = new THREE.Group();
    this.modelsContainer.name = 'R2PL_3D_Models_Container';
    this.engine.scene.add(this.modelsContainer);

    // Initialize DRACOLoader with local decoders
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/gltf/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    // Initialize GLTFLoader
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Hook into Three.js update loop for Idle Animations
    this.engine.onUpdate((delta, elapsed) => this.updateAnimations(delta, elapsed));

    // Viewport Culling
    this.viewportManager.onViewportChanged((bounds) => {
      this.updateCulling(bounds);
    });
  }

  /**
   * Set or refresh all 3D entities from layout list
   */
  public setEntities(entitiesList: PlacedEntity[]): void {
    // Clear old
    this.clearAll();

    // Populate
    entitiesList.forEach((e) => this.addOrUpdateEntity(e));

    // Force culling pass
    this.updateCulling(this.viewportManager.getVisibleTileBounds(4));
  }

  public addOrUpdateEntity(entity: PlacedEntity): void {
    // Remove if existing
    this.removeEntity(entity.id);

    const ts = GRID_CONFIG.TILE_SIZE;
    // Calculate world center of entity
    const posX = (entity.gridX + entity.width / 2) * ts;
    const posZ = (entity.gridY + entity.height / 2) * ts;

    // Create 3D Model based on category & type
    const { group, hooks } = this.createModelForEntity(entity);
    group.position.set(posX, 0, posZ);

    if (entity.rotation !== 0) {
      group.rotation.y = THREE.MathUtils.degToRad(-entity.rotation);
    }

    this.modelsContainer.add(group);

    this.entities3D.set(entity.id, {
      entity,
      group,
      hooks,
      originalY: 0,
    });
  }

  public removeEntity(id: string): void {
    const entry = this.entities3D.get(id);
    if (entry) {
      this.modelsContainer.remove(entry.group);
      entry.group.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      this.entities3D.delete(id);
    }
  }

  public clearAll(): void {
    this.entities3D.forEach((entry) => {
      this.modelsContainer.remove(entry.group);
    });
    this.entities3D.clear();
  }

  /**
   * Factory router for creating or loading 3D models for each entity
   */
  private createModelForEntity(entity: PlacedEntity): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const scaleFactor = (entity.width * GRID_CONFIG.TILE_SIZE) / 32;

    // A. UNISTOPS
    if (entity.category === EntityCategory.UNISTOP) {
      if (entity.type === UniStopType.PREDATOR || entity.name.includes('Predator') || entity.name.includes('AeroBlade')) {
        // High-tech AeroBlade Station with 4 rotating fan blades!
        const res = Predator3DModels.createAeroBladeStation(scaleFactor * 2.8);
        this.tryLoadGlbFallback(res.group, '/assets/models/predator/aeroblade_station.glb', scaleFactor * 5.0);
        return res;
      } else if (entity.type === UniStopType.NITRO || entity.name.includes('Nitro')) {
        return Predator3DModels.createAeroBladeStation(scaleFactor * 2.6);
      } else {
        return Predator3DModels.createAeroBladeStation(scaleFactor * 2.4);
      }
    }

    // B. CHESTS
    if (entity.category === EntityCategory.CHEST) {
      let tier: 'silver' | 'gold' | 'platinum' = 'silver';
      if (entity.type === ChestTier.GOLD || entity.name.includes('Gold')) tier = 'gold';
      else if (entity.type === ChestTier.PLATINUM || entity.name.includes('Platinum')) tier = 'platinum';

      const res = Predator3DModels.createChest(tier, scaleFactor * 4.5);
      return res;
    }

    // C. SCENIC SPOTS
    if (entity.category === EntityCategory.SCENIC_SPOT) {
      if (entity.id === 'scenic_fansipan' || entity.name.includes('Fansipan')) {
        const res = Predator3DModels.createFansipan(scaleFactor * 3.2);
        this.tryLoadGlbFallback(res.group, '/assets/models/predator/fansipan_predator.glb', scaleFactor * 4.5);
        return res;
      }
      return Predator3DModels.createFansipan(scaleFactor * 3.0);
    }

    // D. LANDMARKS
    if (entity.category === EntityCategory.LANDMARK) {
      if (entity.id === 'landmark_bitexco' || entity.name.includes('Bitexco')) {
        return Predator3DModels.createBitexco(scaleFactor * 2.6);
      }
      return Predator3DModels.createBitexco(scaleFactor * 2.2);
    }

    // E. HEADQUARTERS
    if (entity.category === EntityCategory.HEADQUARTERS) {
      const res = Predator3DModels.createHeadquarters(entity.colorHex || '#0099ff', scaleFactor * 3.0);
      // Try to attach specific school GLB if available (like uit_hq.glb)
      if (entity.id.includes('uit')) {
        this.tryLoadGlbFallback(res.group, '/assets/models/hqs/uit_hq.glb', scaleFactor * 0.8);
      } else if (entity.id.includes('hust') || entity.id.includes('hcmut')) {
        this.tryLoadGlbFallback(res.group, '/assets/models/hqs/hcmut_hq.glb', scaleFactor * 0.8);
      } else {
        this.tryLoadGlbFallback(res.group, '/assets/models/predator/hq_predator.glb', scaleFactor * 3.5);
      }
      return res;
    }

    // Fallback
    return Predator3DModels.createHeadquarters('#00ffe8', scaleFactor * 2.5);
  }

  /**
   * Async GLB loader helper with Draco
   */
  private tryLoadGlbFallback(targetGroup: THREE.Group, glbUrl: string, scale: number): void {
    if (this.glbCache.has(glbUrl)) {
      const cached = this.glbCache.get(glbUrl)!.clone();
      cached.scale.set(scale, scale, scale);
      targetGroup.add(cached);
      return;
    }

    this.gltfLoader.load(
      glbUrl,
      (gltf) => {
        const scene = gltf.scene;
        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        this.glbCache.set(glbUrl, scene);
        const cloned = scene.clone();
        cloned.scale.set(scale, scale, scale);
        targetGroup.add(cloned);
      },
      undefined,
      (err) => {
        // Silently use procedural model if GLB fails
        console.warn(`[GLTFModelRenderer] Note: Using high-detail procedural model for ${glbUrl}`);
      }
    );
  }

  /**
   * Idle Animations Loop:
   * - AeroBlade fans spinning
   * - Chests floating bobbing on sine wave
   * - Breathing pulse on LEDs
   */
  public updateAnimations(delta: number, elapsed: number): void {
    const breathingFactor = (Math.sin(elapsed * 3.2) + 1) / 2; // 0.0 to 1.0

    this.entities3D.forEach((entry) => {
      const hooks = entry.hooks;
      if (!entry.group.visible) return;

      // 1. AeroBlade Cooling Fan Rotation
      if (hooks.rotatingRotor) {
        hooks.rotatingRotor.rotation.y += 9.5 * delta; // ~90 RPM spin
      }

      // 2. Chest Floating Bobbing Animation
      if (hooks.floatingCore && hooks.baseHeight !== undefined && hooks.bobbingAmp !== undefined) {
        const speed = hooks.bobbingSpeed || 2.8;
        const bob = Math.sin(elapsed * speed) * hooks.bobbingAmp;
        hooks.floatingCore.position.y = hooks.baseHeight + bob;

        // Shadow disk scales inversely with height
        if (hooks.shadowDisc) {
          const shadowScale = 1.0 - (bob / hooks.bobbingAmp) * 0.18;
          hooks.shadowDisc.scale.set(shadowScale, shadowScale, 1.0);
          (hooks.shadowDisc.material as THREE.MeshBasicMaterial).opacity = 0.45 - (bob / hooks.bobbingAmp) * 0.12;
        }
      }

      // 3. LED Breathing Pulse
      if (hooks.pulsingMaterials && hooks.pulsingMaterials.length > 0) {
        const intensity = 0.65 + breathingFactor * 0.35;
        hooks.pulsingMaterials.forEach((mat) => {
          mat.opacity = intensity;
        });
      }
    });
  }

  /**
   * Update 3D Ghost Preview for Map Editor
   */
  public updateGhostPreview(
    template: GhostTemplate | null,
    gridX: number,
    gridY: number,
    rotation: number,
    isValid: boolean
  ): void {
    if (!template) {
      if (this.ghostGroup) {
        this.engine.scene.remove(this.ghostGroup);
        this.ghostGroup = null;
      }
      return;
    }

    const ts = GRID_CONFIG.TILE_SIZE;
    const isRotated = rotation === 90 || rotation === 270;
    const w = isRotated ? template.height : template.width;
    const h = isRotated ? template.width : template.height;

    const posX = gridX * ts;
    const posZ = gridY * ts;

    if (!this.ghostGroup) {
      this.ghostGroup = Predator3DModels.createGhostPreview(w, h, isValid, ts);
      this.engine.scene.add(this.ghostGroup);
    } else {
      this.engine.scene.remove(this.ghostGroup);
      this.ghostGroup = Predator3DModels.createGhostPreview(w, h, isValid, ts);
      this.engine.scene.add(this.ghostGroup);
    }

    this.ghostGroup.position.set(posX, 0, posZ);
  }

  /**
   * Culling: Toggle visibility of 3D meshes outside visible viewport
   */
  private updateCulling(bounds: VisibleTileBounds): void {
    this.entities3D.forEach((entry) => {
      const e = entry.entity;
      const isVisible =
        e.gridX + e.width >= bounds.minCol - 3 &&
        e.gridX <= bounds.maxCol + 3 &&
        e.gridY + e.height >= bounds.minRow - 3 &&
        e.gridY <= bounds.maxRow + 3;

      entry.group.visible = isVisible;
    });
  }
}
