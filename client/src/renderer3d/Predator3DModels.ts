import * as THREE from 'three';

export interface ModelAnimationHooks {
  rotatingRotor?: THREE.Object3D;
  floatingCore?: THREE.Object3D;
  shadowDisc?: THREE.Mesh;
  pulsingMaterials?: THREE.MeshBasicMaterial[];
  baseHeight?: number;
  bobbingSpeed?: number;
  bobbingAmp?: number;
}

/**
 * Predator3DModels: Factory for high-fidelity Procedural 3D assets in Predator Cyberpunk theme.
 * Provides detailed geometry, metallic PBR shading, and hooks for idle animations.
 */
export class Predator3DModels {
  // Shared Color Palette
  public static readonly PALETTE = {
    alloyDark: 0x0c0e14,
    alloyBody: 0x141822,
    alloyLight: 0x222836,
    gunmetal: 0x2d3444,
    titanium: 0x3d4556,
    cyanNeon: 0x00ffe8,
    cyanCore: 0xd0fffa,
    electricBlue: 0x0077fe,
    nitroOrange: 0xff4500,
    nitroBright: 0xff7700,
    aspireGreen: 0x10b981,
    bronzeAlloy: 0x7a461e,
    bronzeTrim: 0xcd7f32,
    silverAlloy: 0x8a95a5,
    silverTrim: 0xc0c0c0,
    goldAlloy: 0xaa8218,
    goldTrim: 0xffd700,
    platinumAlloy: 0x1e293b,
    platinumTrim: 0x00ffe8,
  };

  /**
   * 1. TRẠM NĂNG LƯỢNG AEROBLADE PREDATOR
   * Features:
   * - Chamfered matte black base
   * - Central glowing cyan reactor core
   * - 4 aerodynamic metallic fan blades spinning rapidly
   * - Breathing pulse cyan LEDs
   */
  public static createAeroBladeStation(scale: number = 10): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const group = new THREE.Group();
    group.name = 'Station_AeroBlade';

    const hooks: ModelAnimationHooks = {
      pulsingMaterials: [],
    };

    const darkMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.alloyDark,
      roughness: 0.35,
      metalness: 0.85,
    });

    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.alloyBody,
      roughness: 0.3,
      metalness: 0.8,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: this.PALETTE.cyanNeon,
    });
    hooks.pulsingMaterials!.push(cyanGlowMat);

    // 1. Base Stepped Platform
    const subBaseGeom = new THREE.CylinderGeometry(2.4 * scale, 2.7 * scale, 0.35 * scale, 8);
    const subBase = new THREE.Mesh(subBaseGeom, darkMat);
    subBase.position.y = 0.175 * scale;
    subBase.castShadow = true;
    subBase.receiveShadow = true;
    group.add(subBase);

    const mainBaseGeom = new THREE.CylinderGeometry(2.1 * scale, 2.3 * scale, 0.45 * scale, 8);
    const mainBase = new THREE.Mesh(mainBaseGeom, bodyMat);
    mainBase.position.y = 0.55 * scale;
    mainBase.castShadow = true;
    mainBase.receiveShadow = true;
    group.add(mainBase);

    // Glow ring on base
    const baseGlowRingGeom = new THREE.CylinderGeometry(2.12 * scale, 2.12 * scale, 0.08 * scale, 8, 1, true);
    const baseGlowRing = new THREE.Mesh(baseGlowRingGeom, cyanGlowMat);
    baseGlowRing.position.y = 0.65 * scale;
    group.add(baseGlowRing);

    // 4 Corner Cooling Pylons with LEDs
    const pylonGeom = new THREE.BoxGeometry(0.55 * scale, 0.8 * scale, 0.9 * scale);
    pylonGeom.translate(0, 0.4 * scale, 0);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.gunmetal,
      roughness: 0.3,
      metalness: 0.85,
    });

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const pylon = new THREE.Mesh(pylonGeom, pylonMat);
      pylon.position.set(Math.cos(angle) * 1.9 * scale, 0.2 * scale, Math.sin(angle) * 1.9 * scale);
      pylon.rotation.y = -angle;
      pylon.castShadow = true;
      group.add(pylon);

      // Cyan LED strip
      const ledGeom = new THREE.BoxGeometry(0.12 * scale, 0.35 * scale, 0.05 * scale);
      const led = new THREE.Mesh(ledGeom, cyanGlowMat);
      led.position.set(0, 0.5 * scale, 0.46 * scale);
      pylon.add(led);
    }

    // 2. Central Cyan Energy Reactor Core
    const coreGeom = new THREE.CylinderGeometry(0.7 * scale, 0.7 * scale, 2.2 * scale, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.cyanNeon,
      emissive: this.PALETTE.cyanNeon,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 1.8 * scale;
    group.add(core);

    // Exoskeleton ribs around core
    const ribGeom = new THREE.BoxGeometry(0.14 * scale, 2.2 * scale, 0.25 * scale);
    for (let i = 0; i < 6; i++) {
      const ribAngle = (i * Math.PI) / 3;
      const rib = new THREE.Mesh(ribGeom, pylonMat);
      rib.position.set(Math.cos(ribAngle) * 0.82 * scale, 1.8 * scale, Math.sin(ribAngle) * 0.82 * scale);
      rib.rotation.y = -ribAngle;
      rib.castShadow = true;
      group.add(rib);
    }

    // 3. Cowling Shroud
    const cowlGeom = new THREE.CylinderGeometry(1.35 * scale, 1.35 * scale, 0.45 * scale, 24, 1, true);
    const cowl = new THREE.Mesh(cowlGeom, darkMat);
    cowl.position.y = 3.0 * scale;
    group.add(cowl);

    // 4. ROTATING AEROBLADE 3D FAN ROTOR (4 Cánh quạt kim loại)
    const fanAssembly = new THREE.Group();
    fanAssembly.name = 'AeroBlade_FanAssembly';
    fanAssembly.position.y = 3.0 * scale;

    // Center Spinner Nose Cone
    const spinnerGeom = new THREE.ConeGeometry(0.35 * scale, 0.45 * scale, 16);
    const spinnerMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.titanium,
      metalness: 0.9,
      roughness: 0.25,
    });
    const spinner = new THREE.Mesh(spinnerGeom, spinnerMat);
    spinner.position.y = 0.1 * scale;
    fanAssembly.add(spinner);

    // 4 Aerodynamic Blades with Cyan Glowing Tips
    const bladeMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.gunmetal,
      metalness: 0.92,
      roughness: 0.2,
    });

    const bladeCount = 4;
    for (let b = 0; b < bladeCount; b++) {
      const bladeGroup = new THREE.Group();
      const bladeAngle = (b * Math.PI * 2) / bladeCount;
      bladeGroup.rotation.y = bladeAngle;

      const bladeGeom = new THREE.BoxGeometry(0.95 * scale, 0.04 * scale, 0.28 * scale);
      bladeGeom.translate(0.55 * scale, 0, 0);
      const bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
      bladeMesh.rotation.x = THREE.MathUtils.degToRad(28); // 28 deg pitch
      bladeMesh.castShadow = true;
      bladeGroup.add(bladeMesh);

      // Cyan Tip
      const tipGeom = new THREE.BoxGeometry(0.18 * scale, 0.05 * scale, 0.26 * scale);
      tipGeom.translate(1.05 * scale, 0, 0);
      const tipMesh = new THREE.Mesh(tipGeom, cyanGlowMat);
      tipMesh.rotation.x = THREE.MathUtils.degToRad(28);
      bladeGroup.add(tipMesh);

      fanAssembly.add(bladeGroup);
    }

    group.add(fanAssembly);
    hooks.rotatingRotor = fanAssembly;

    return { group, hooks };
  }

  /**
   * 2. RƯƠNG KHO BÁU (CHESTS - SILVER, GOLD, PLATINUM)
   * Features:
   * - Chamfered sci-fi chest body with metallic rim trims
   * - Central energy lock gem
   * - Floating bobbing animation (sine wave)
   * - Ground soft shadow disc that scales inversely with height
   */
  public static createChest(
    tier: 'silver' | 'gold' | 'platinum' = 'silver',
    scale: number = 10
  ): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const group = new THREE.Group();
    group.name = `Chest_${tier}`;

    let bodyColor = this.PALETTE.silverAlloy;
    let trimColor = this.PALETTE.silverTrim;
    let glowColor = this.PALETTE.cyanNeon;

    if (tier === 'gold') {
      bodyColor = this.PALETTE.goldAlloy;
      trimColor = this.PALETTE.goldTrim;
      glowColor = 0xfff066;
    } else if (tier === 'platinum') {
      bodyColor = this.PALETTE.platinumAlloy;
      trimColor = this.PALETTE.platinumTrim;
      glowColor = this.PALETTE.cyanNeon;
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.85,
      roughness: 0.25,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      metalness: 0.95,
      roughness: 0.15,
    });

    const gemMat = new THREE.MeshBasicMaterial({
      color: glowColor,
    });

    // 1. Soft Shadow Disc on Ground
    const shadowGeom = new THREE.CircleGeometry(1.2 * scale, 24);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const shadowDisc = new THREE.Mesh(shadowGeom, shadowMat);
    shadowDisc.position.y = 0.05 * scale;
    group.add(shadowDisc);

    // 2. Floating Chest Container
    const floatingGroup = new THREE.Group();
    floatingGroup.position.y = 1.0 * scale; // Elevated from ground

    // Main Chest Base Box
    const chestBaseGeom = new THREE.BoxGeometry(1.8 * scale, 0.9 * scale, 1.3 * scale);
    const chestBase = new THREE.Mesh(chestBaseGeom, bodyMat);
    chestBase.position.y = 0.45 * scale;
    chestBase.castShadow = true;
    floatingGroup.add(chestBase);

    // Domed / Vaulted Lid
    const lidGeom = new THREE.CylinderGeometry(0.65 * scale, 0.65 * scale, 1.84 * scale, 16, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    const lid = new THREE.Mesh(lidGeom, trimMat);
    lid.position.y = 0.9 * scale;
    lid.castShadow = true;
    floatingGroup.add(lid);

    // Glowing Central Energy Lock Diamond
    const lockGeom = new THREE.OctahedronGeometry(0.24 * scale);
    const lockMesh = new THREE.Mesh(lockGeom, gemMat);
    lockMesh.position.set(0, 0.7 * scale, 0.68 * scale);
    floatingGroup.add(lockMesh);

    group.add(floatingGroup);

    const hooks: ModelAnimationHooks = {
      floatingCore: floatingGroup,
      shadowDisc,
      baseHeight: 1.0 * scale,
      bobbingSpeed: 2.8,
      bobbingAmp: 0.25 * scale,
      pulsingMaterials: [gemMat],
    };

    return { group, hooks };
  }

  /**
   * 3. ĐỈNH FANSIPAN 3D
   * Features:
   * - 3-tier stepped hexagonal black stone plinth
   * - Highly reflective stainless steel pyramidal apex
   * - Glowing cyan laser beacon
   */
  public static createFansipan(scale: number = 8): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const group = new THREE.Group();
    group.name = 'Landmark_Fansipan';

    const stoneMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.alloyDark,
      roughness: 0.6,
      metalness: 0.3,
    });

    const inoxMat = new THREE.MeshStandardMaterial({
      color: 0xf0f5ff,
      roughness: 0.1,
      metalness: 0.98,
    });

    const laserMat = new THREE.MeshBasicMaterial({
      color: this.PALETTE.cyanNeon,
    });

    // 3 Terraces
    for (let i = 0; i < 3; i++) {
      const r = (3.2 - i * 0.7) * scale;
      const stepGeom = new THREE.CylinderGeometry(r, r + 0.3 * scale, 0.5 * scale, 6);
      const step = new THREE.Mesh(stepGeom, stoneMat);
      step.position.y = (0.25 + i * 0.5) * scale;
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    // Apex Cone (Pyramidal 3-sided inox landmark)
    const apexGeom = new THREE.ConeGeometry(1.2 * scale, 2.8 * scale, 3);
    const apex = new THREE.Mesh(apexGeom, inoxMat);
    apex.position.y = (1.75 + 1.4) * scale;
    apex.castShadow = true;
    group.add(apex);

    // Laser Antenna
    const laserGeom = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 3.5 * scale, 8);
    const laser = new THREE.Mesh(laserGeom, laserMat);
    laser.position.y = 5.2 * scale;
    group.add(laser);

    return { group, hooks: { pulsingMaterials: [laserMat] } };
  }

  /**
   * 4. TOÀ NHÀ BITEXCO 3D
   * Features:
   * - Aerodynamic curved lotus bud skyscraper
   * - Cantilevered round helipad with cyan glow ring
   * - Pinnacle spire
   */
  public static createBitexco(scale: number = 7): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const group = new THREE.Group();
    group.name = 'Landmark_Bitexco';

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.85,
    });

    const alloyMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.gunmetal,
      metalness: 0.9,
      roughness: 0.2,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: this.PALETTE.cyanNeon,
    });

    // Main Lotus Tower
    const towerGeom = new THREE.CylinderGeometry(1.2 * scale, 1.8 * scale, 9.0 * scale, 16);
    const tower = new THREE.Mesh(towerGeom, glassMat);
    tower.scale.set(0.85, 1.0, 1.35);
    tower.position.y = 4.5 * scale;
    tower.castShadow = true;
    group.add(tower);

    // Helipad Disk protruding outward
    const padGeom = new THREE.CylinderGeometry(1.3 * scale, 1.3 * scale, 0.2 * scale, 24);
    const pad = new THREE.Mesh(padGeom, alloyMat);
    pad.position.set(0, 6.8 * scale, 1.6 * scale);
    pad.castShadow = true;
    group.add(pad);

    // Helipad glowing cyan ring
    const ringGeom = new THREE.TorusGeometry(1.1 * scale, 0.06 * scale, 8, 32);
    ringGeom.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeom, cyanGlowMat);
    ring.position.set(0, 6.92 * scale, 1.6 * scale);
    group.add(ring);

    // Spire
    const spireGeom = new THREE.ConeGeometry(0.4 * scale, 2.5 * scale, 12);
    const spire = new THREE.Mesh(spireGeom, cyanGlowMat);
    spire.position.y = 10.25 * scale;
    group.add(spire);

    return { group, hooks: { pulsingMaterials: [cyanGlowMat] } };
  }

  /**
   * 5. TRỤ SỞ TRƯỜNG ĐẠI HỌC (HEADQUARTERS 3D MONOLITH)
   */
  public static createHeadquarters(
    colorHex: string = '#0099ff',
    scale: number = 8
  ): { group: THREE.Group; hooks: ModelAnimationHooks } {
    const group = new THREE.Group();
    group.name = 'Headquarters_Monolith';

    const primaryColor = parseInt(colorHex.replace('#', '0x'), 16);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: this.PALETTE.alloyDark,
      roughness: 0.4,
      metalness: 0.7,
    });

    const schoolMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.25,
      metalness: 0.8,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
    });

    // 2-tier Octagonal Base
    const base1Geom = new THREE.CylinderGeometry(3.2 * scale, 3.6 * scale, 0.5 * scale, 8);
    const base1 = new THREE.Mesh(base1Geom, stoneMat);
    base1.position.y = 0.25 * scale;
    base1.castShadow = true;
    base1.receiveShadow = true;
    group.add(base1);

    const base2Geom = new THREE.CylinderGeometry(2.7 * scale, 2.9 * scale, 0.4 * scale, 8);
    const base2 = new THREE.Mesh(base2Geom, stoneMat);
    base2.position.y = 0.7 * scale;
    base2.castShadow = true;
    group.add(base2);

    // Central Monolith
    const monoGeom = new THREE.BoxGeometry(2.4 * scale, 4.5 * scale, 2.4 * scale);
    const mono = new THREE.Mesh(monoGeom, schoolMat);
    mono.position.y = 3.15 * scale;
    mono.castShadow = true;
    group.add(mono);

    // Glowing Crown Light
    const crownGeom = new THREE.BoxGeometry(2.6 * scale, 0.4 * scale, 2.6 * scale);
    const crown = new THREE.Mesh(crownGeom, glowMat);
    crown.position.y = 5.6 * scale;
    group.add(crown);

    return { group, hooks: { pulsingMaterials: [glowMat] } };
  }

  /**
   * 6. HOLOGRAPHIC GHOST MESH PREVIEW FOR THE SIMS MAP EDITOR
   */
  public static createGhostPreview(
    width: number,
    height: number,
    isValid: boolean = true,
    scale: number = 32
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'GhostPlacement_Preview';

    const color = isValid ? this.PALETTE.cyanNeon : 0xff2a55;

    // Translucent box
    const geom = new THREE.BoxGeometry(width * scale, 3.5 * scale, height * scale);
    geom.translate((width * scale) / 2, (3.5 * scale) / 2, (height * scale) / 2);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Solid inner translucent core
    const solidMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
    });
    const solidMesh = new THREE.Mesh(geom, solidMat);
    group.add(solidMesh);

    return group;
  }
}
