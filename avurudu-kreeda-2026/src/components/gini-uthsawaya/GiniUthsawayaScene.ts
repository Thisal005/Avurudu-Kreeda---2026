// ──────────────────────────────────────────────────────────────
// GiniUthsawayaScene.ts — Factory that creates the Phaser.Scene
// subclass *after* Phaser has been dynamically imported, avoiding
// the "Phaser is not defined" error on module evaluation in SSR.
// ──────────────────────────────────────────────────────────────

import {
  FIRECRACKER_TEXTURES,
  FUSE_ZONE_OFFSETS,
  STAR_COUNT,
  DESKTOP_BREAKPOINT,
  MAX_VISUAL_SIZE_DESKTOP,
  MAX_VISUAL_SIZE_MOBILE,
  FIRECRACKERS,
  FirecrackerType,
} from '../GiniUthsawayaConfig';

import {
  AnimationCallbacks,
  cleanupEmitters,
  showCelebration,
} from './firecrackerAnimationUtils';

import {
  playPatasAnimation,
  playBigPattasAnimation,
  playChakkaramAnimation,
  playRocketAnimation,
  playBombAnimation,
  playMegaAnimation,
  playTimeBombAnimation,
  playNuclearAnimation,
} from './animations';

// ── Scene-level types ────────────────────────────────────────

export interface SceneCallbacks extends AnimationCallbacks {
  setIsLightingMode: (v: boolean) => void;
  consumeItem: (id: string) => void;
  handleNext: () => void;
  handlePrev: () => void;
  isShopOpen: () => boolean;
}

/** Key used to pass callbacks into the scene via game.registry. */
export const CALLBACKS_KEY = '__sceneCallbacks';

// ──────────────────────────────────────────────────────────────
// Factory: call this AFTER `const Phaser = await import("phaser")`
// so that `Phaser.Scene` is available for class extension.
// ──────────────────────────────────────────────────────────────

export function createGiniUthsawayaScene(
  PhaserModule: typeof Phaser,
): typeof Phaser.Scene {
  return class GiniUthsawayaScene extends PhaserModule.Scene {
    private fcSprite!: Phaser.GameObjects.Sprite;
    private fuseZone!: Phaser.GameObjects.Zone;
    private centerX = 0;
    private centerY = 0;
    private isLighting = false;
    private currentId: string | null = null;
    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    constructor() {
      super({ key: 'GiniUthsawayaScene' });
    }

    /** Typed accessor for the callbacks stored on the game registry. */
    private get cb(): SceneCallbacks {
      return this.game.registry.get(CALLBACKS_KEY) as SceneCallbacks;
    }

    // ── Lifecycle: preload ─────────────────────────────────────

    preload(): void {
      for (const [key, path] of Object.entries(FIRECRACKER_TEXTURES)) {
        this.load.image(key, path);
      }

      // Generate 'spark' procedural texture
      const pg = this.add.graphics();
      pg.fillStyle(0xffffff, 1);
      pg.fillCircle(4, 4, 4);
      pg.generateTexture('spark', 8, 8);
      pg.destroy();

      // Generate 'flame' procedural texture
      const fg = this.add.graphics();
      fg.fillStyle(0xff8c00, 1);
      fg.fillTriangle(4, 0, 8, 8, 0, 8);
      fg.generateTexture('flame', 8, 8);
      fg.destroy();
    }

    // ── Lifecycle: create ──────────────────────────────────────

    create(): void {
      this.centerX = this.scale.width / 2;
      this.centerY = this.scale.height / 2 + 50;

      // Starry background
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = PhaserModule.Math.Between(0, this.scale.width);
        const y = PhaserModule.Math.Between(0, this.scale.height);
        const r = PhaserModule.Math.FloatBetween(0.5, 2);
        this.add.circle(x, y, r, 0xffffff, PhaserModule.Math.FloatBetween(0.1, 0.8));
      }

      // Firecracker sprite (hidden until selected)
      this.fcSprite = this.add.sprite(this.centerX, this.centerY, 'patas');
      this.fcSprite.setVisible(false);

      // Fuse interaction zone
      this.fuseZone = this.add.zone(this.centerX, this.centerY - 50, 80, 80);
      this.fuseZone.setInteractive();
      this.fuseZone.setName('fuse');

      this.setupGameEvents();
      this.setupInputHandlers();
      this.setupResizeHandler();
    }

    // ── Lifecycle: update ──────────────────────────────────────

    update(): void {
      // Reserved for future per-frame logic
    }

    // ── Internal helpers ───────────────────────────────────────

    private setupGameEvents(): void {
      this.game.events.on('show-firecracker', (id: string) => {
        if (this.particleEmitter) {
          this.particleEmitter.stop();
          this.particleEmitter.destroy();
        }

        this.currentId = id;
        this.fcSprite.setTexture(id);

        const maxVisualSize = 200;
        const scaleRaw = Math.min(maxVisualSize / this.fcSprite.width, maxVisualSize / this.fcSprite.height);
        this.fcSprite.setScale(scaleRaw);
        this.fcSprite.setVisible(true);
        this.fcSprite.setPosition(this.centerX, this.centerY);
        this.fcSprite.setRotation(0);
        this.isLighting = false;

        // Position fuse zone
        const offsets = FUSE_ZONE_OFFSETS[id] ?? { dx: 0, dy: -50 };
        this.fuseZone.setPosition(this.centerX + offsets.dx, this.centerY + offsets.dy);
      });

      this.game.events.on('hide-firecracker', () => {
        this.fcSprite.setVisible(false);
        this.currentId = null;
      });

      this.game.events.on('enter-lighting-mode', () => {
        this.isLighting = true;
      });
    }

    private setupInputHandlers(): void {
      let startX = 0;

      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        startX = pointer.x;
        if (this.isLighting && this.currentId) {
          this.igniteFirecracker(this.currentId);
          this.isLighting = false;
        }
      });

      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.isLighting && !this.cb.isShopOpen()) {
          const diffX = pointer.x - startX;
          if (diffX > 50) this.cb.handlePrev();
          else if (diffX < -50) this.cb.handleNext();
        }
      });
    }

    private setupResizeHandler(): void {
      this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        this.centerX = gameSize.width / 2;
        this.centerY = gameSize.height / 2 + 50;
        this.fcSprite.setPosition(this.centerX, this.centerY);
        this.fuseZone.setPosition(this.centerX, this.centerY - 50);
      });
    }

    /** Dispatch to the correct animation module, consume inventory item. */
    private igniteFirecracker(id: string): void {
      const { setIsLightingMode, consumeItem, setCelebrationMessage, playSound, stopSound } = this.cb;

      setIsLightingMode(false);
      consumeItem(id);

      // Clean up orphaned emitters from previous animations
      const oldEmitters: any[] = this.fcSprite.getData('activeEmitters') || [];
      cleanupEmitters(oldEmitters);
      this.fcSprite.setData('activeEmitters', []);
      this.time.removeAllEvents();

      // Reset sprite state
      this.tweens.killTweensOf(this.fcSprite);
      this.fcSprite.clearTint();
      this.fcSprite.setAlpha(1);
      this.fcSprite.setVisible(true);
      this.fcSprite.setPosition(this.centerX, this.centerY);
      this.fcSprite.setRotation(0);

      const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      const maxVisualSize = isDesktop ? MAX_VISUAL_SIZE_DESKTOP : MAX_VISUAL_SIZE_MOBILE;
      const baseScale = Math.min(maxVisualSize / this.fcSprite.width, maxVisualSize / this.fcSprite.height);
      this.fcSprite.setScale(baseScale);

      const params = {
        scene: this as Phaser.Scene,
        sprite: this.fcSprite,
        cx: this.centerX,
        cy: this.centerY,
        baseScale,
        callbacks: { playSound, stopSound, setCelebrationMessage },
      };

      switch (id) {
        case 'patas':     playPatasAnimation(params);       break;
        case 'flowerpot': playBigPattasAnimation(params);   break;
        case 'chakkaram': playChakkaramAnimation(params);   break;
        case 'rocket':    playRocketAnimation(params);      break;
        case 'bomb':      playBombAnimation(params);        break;
        case 'mega':      playMegaAnimation(params);        break;
        case 'Time Bomb': playTimeBombAnimation(params);    break;
        case 'Nuce':      playNuclearAnimation(params);     break;
        default:          playPatasAnimation(params);       break;
      }

      // Generic celebration for types that don't set their own inside the animation
      if (!['Nuce', 'rocket', 'chakkaram', 'patas', 'flowerpot'].includes(id)) {
        setTimeout(() => {
          const name = FIRECRACKERS.find((f: FirecrackerType) => f.id === id)?.name ?? id;
          showCelebration(setCelebrationMessage, `You lit a ${name}!`, 3000);
          if (this.particleEmitter) this.particleEmitter.stop();
        }, 3500);
      }
    }
  };
}
