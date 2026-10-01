import * as THREE from 'three';
import { GRID_CONFIG, THEME_COLORS } from '../constants/terminology';
import { ThreeOverlayEngine } from './ThreeOverlayEngine';

interface PulseRing {
  mesh: THREE.Mesh;
  currentRadius: number;
  maxRadius: number;
  speed: number;
  life: number;
  maxLife: number;
}

interface BeaconParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

/**
 * VFXManager: Controls 3D visual effects:
 * - Pulse Ripple shockwave when unlocking Knowledge tiles
 * - 3D Flame / Plasma Particle System for Beacons
 * - Cyber Circuit Sparks running along grid lines
 */
export class VFXManager {
  private readonly engine: ThreeOverlayEngine;
  private vfxContainer: THREE.Group;

  // Pulse Shockwaves
  private activePulses: PulseRing[] = [];

  // Beacon Flame Particles
  private particleGeom: THREE.BufferGeometry;
  private particleMat: THREE.PointsMaterial;
  private particlePoints: THREE.Points;
  private particles: BeaconParticle[] = [];
  private readonly MAX_PARTICLES = 600;

  // Active Beacon Positions
  private beaconSources: Map<string, { x: number; z: number; colorHex: string }> = new Map();

  constructor(engine: ThreeOverlayEngine) {
    this.engine = engine;
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'R2PL_VFX_Container';
    this.engine.scene.add(this.vfxContainer);

    // Setup Particle System for Beacon Flame
    const positions = new Float32Array(this.MAX_PARTICLES * 3);
    const colors = new Float32Array(this.MAX_PARTICLES * 3);

    this.particleGeom = new THREE.BufferGeometry();
    this.particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Canvas circular particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const ctx = pCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(0, 255, 232, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const pTex = new THREE.CanvasTexture(pCanvas);

    this.particleMat = new THREE.PointsMaterial({
      size: 14,
      vertexColors: true,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.particleGeom, this.particleMat);
    this.vfxContainer.add(this.particlePoints);

    // Register update hook
    this.engine.onUpdate((delta, elapsed) => this.update(delta, elapsed));
  }

  /**
   * Spawns a glowing neon shockwave ripple at world coordinate (X, Z)
   * e.g. when opening a Knowledge tile in radius R=5
   */
  public triggerPulseRipple(worldX: number, worldZ: number, radiusTiles: number = 5, colorHex: string = '#00ffe8'): void {
    const ts = GRID_CONFIG.TILE_SIZE;
    const maxRadius = radiusTiles * ts;

    const ringGeom = new THREE.RingGeometry(1, 3, 48);
    ringGeom.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: parseInt(colorHex.replace('#', '0x'), 16),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(ringGeom, ringMat);
    mesh.position.set(worldX, 2, worldZ);
    this.vfxContainer.add(mesh);

    this.activePulses.push({
      mesh,
      currentRadius: 1,
      maxRadius,
      speed: (maxRadius / 0.6), // Expand in 0.6 seconds
      life: 0,
      maxLife: 0.65,
    });
  }

  public registerBeaconVFX(id: string, worldX: number, worldZ: number, colorHex: string = '#00ffe8'): void {
    this.beaconSources.set(id, { x: worldX, z: worldZ, colorHex });
  }

  public removeBeaconVFX(id: string): void {
    this.beaconSources.delete(id);
  }

  private update(delta: number, elapsed: number): void {
    // 1. Update Shockwave Pulses
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const p = this.activePulses[i];
      p.life += delta;
      p.currentRadius += p.speed * delta;

      const progress = p.life / p.maxLife;
      if (progress >= 1.0) {
        this.vfxContainer.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.activePulses.splice(i, 1);
        continue;
      }

      // Scale ring
      const scale = p.currentRadius;
      p.mesh.scale.set(scale, 1, scale);

      // Fade out
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.9;
    }

    // 2. Spawn and Update Beacon Flame Particles
    this.updateBeaconParticles(delta);
  }

  private updateBeaconParticles(delta: number): void {
    // Spawn new particles from active beacons
    this.beaconSources.forEach((src) => {
      if (this.particles.length < this.MAX_PARTICLES) {
        const pColor = new THREE.Color(src.colorHex);
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 12;
          this.particles.push({
            position: new THREE.Vector3(src.x + Math.cos(angle) * r, 10 + Math.random() * 5, src.z + Math.sin(angle) * r),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 15, 60 + Math.random() * 40, (Math.random() - 0.5) * 15),
            life: 0,
            maxLife: 0.8 + Math.random() * 0.6,
            size: 10 + Math.random() * 10,
            color: pColor,
          });
        }
      }
    });

    const posAttr = this.particleGeom.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeom.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    let activeCount = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, delta);
      // Slight inward pull or spiral
      p.velocity.y += 10 * delta;

      const idx = activeCount * 3;
      positions[idx] = p.position.x;
      positions[idx + 1] = p.position.y;
      positions[idx + 2] = p.position.z;

      const alpha = 1 - (p.life / p.maxLife);
      colors[idx] = p.color.r * alpha;
      colors[idx + 1] = p.color.g * alpha;
      colors[idx + 2] = p.color.b * alpha;

      activeCount++;
      if (activeCount >= this.MAX_PARTICLES) break;
    }

    // Zero out unused
    for (let i = activeCount * 3; i < this.MAX_PARTICLES * 3; i++) {
      positions[i] = 0;
      colors[i] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }
}
