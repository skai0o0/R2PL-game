import { Texture } from 'pixi.js';

/**
 * Procedural Texture Generator for Predator High-Tech / Cyberpunk Theme
 * Produces crisp, seamless tileable textures for Carbon Fiber, Circuit Traces & Predator Decals.
 */
export class TextureGenerator {
  /**
   * Generates a 64x64 seamless Carbon Fiber weave texture
   */
  public static createCarbonTexture(): Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base dark matte
    ctx.fillStyle = '#08090D';
    ctx.fillRect(0, 0, size, size);

    // Diagonal carbon fiber weaves
    const step = 8;
    for (let x = 0; x < size; x += step) {
      for (let y = 0; y < size; y += step) {
        const isAlternate = ((x / step) + (y / step)) % 2 === 0;
        
        ctx.fillStyle = isAlternate ? '#0F121A' : '#141824';
        ctx.fillRect(x, y, step, step);

        // Specular highlight lines
        ctx.strokeStyle = isAlternate ? '#1C2233' : '#0B0D12';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step);
        ctx.stroke();

        // Cross subtle thread
        ctx.strokeStyle = 'rgba(0, 255, 232, 0.04)'; // Tiny hint of Predator cyan sheen
        ctx.beginPath();
        ctx.moveTo(x + step, y);
        ctx.lineTo(x, y + step);
        ctx.stroke();
      }
    }

    return Texture.from(canvas);
  }

  /**
   * Generates a seamless 256x256 Cyber Circuit Trace texture
   */
  public static createCircuitTexture(): Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Trace paths
    ctx.strokeStyle = 'rgba(0, 255, 232, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const traces = [
      [[10, 20], [60, 20], [90, 50], [180, 50], [210, 80], [246, 80]],
      [[40, 100], [100, 100], [140, 140], [200, 140]],
      [[20, 220], [80, 220], [120, 180], [170, 180], [200, 210], [240, 210]],
      [[128, 10], [128, 60], [160, 92], [160, 160], [190, 190], [190, 246]],
      [[70, 140], [70, 190], [50, 210], [10, 210]],
    ];

    traces.forEach((points) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    });

    // Circuit solder pads / glowing nodes
    ctx.fillStyle = 'rgba(0, 255, 232, 0.35)';
    const nodes = [
      [60, 20], [180, 50], [100, 100], [140, 140], [80, 220], [128, 60], [160, 92], [190, 190]
    ];
    nodes.forEach(([nx, ny]) => {
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(0, 255, 232, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    return Texture.from(canvas);
  }

  /**
   * Generates a Predator Triangle / Claw Emblem Texture
   */
  public static createPredatorEmblem(colorHex: string = '#00FFE8'): Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    // Glow effect
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 12;

    // Predator triangular tri-laser targeting glyph
    ctx.fillStyle = colorHex;
    const cx = size / 2;
    const cy = size / 2;

    // Center triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx + 22, cy + 18);
    ctx.lineTo(cx - 22, cy + 18);
    ctx.closePath();
    ctx.fill();

    // 3 dot targeting lasers
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy - 36, 4, 0, Math.PI * 2);
    ctx.arc(cx + 34, cy + 28, 4, 0, Math.PI * 2);
    ctx.arc(cx - 34, cy + 28, 4, 0, Math.PI * 2);
    ctx.fill();

    return Texture.from(canvas);
  }
}
