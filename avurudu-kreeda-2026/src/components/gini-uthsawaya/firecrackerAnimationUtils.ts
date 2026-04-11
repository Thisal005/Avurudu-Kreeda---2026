// ──────────────────────────────────────────────────────────────
// firecrackerAnimationUtils.ts — Shared helpers used by every
// individual firecracker animation module.
// ──────────────────────────────────────────────────────────────

import { MOBILE_BREAKPOINT } from '../GiniUthsawayaConfig';

// ── Types ────────────────────────────────────────────────────

/** Callbacks that animation functions need from the React layer. */
export interface AnimationCallbacks {
  playSound: (key: string, opts?: { volume?: number; restart?: boolean }) => void;
  stopSound: (key: string) => void;
  setCelebrationMessage: (msg: string) => void;
}

/** Common params every animation function receives. */
export interface AnimationParams {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  cx: number;
  cy: number;
  baseScale: number;
  callbacks: AnimationCallbacks;
}

// ── Viewport helpers ─────────────────────────────────────────

/** Returns `true` when the viewport width is below the mobile breakpoint. */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Scale a particle count for mobile devices.
 * @param count – desired count at full (desktop) quality
 * @param mobile – whether we're on a mobile viewport
 * @param factor – multiplier for mobile (default 0.4)
 */
export function mobileParticleCount(
  count: number,
  mobile: boolean,
  factor = 0.4,
): number {
  return mobile ? Math.max(8, Math.ceil(count * factor)) : count;
}

// ── Sprite helpers ───────────────────────────────────────────

/** Reset a sprite to its default idle state (position, rotation, visibility, tint). */
export function resetSprite(
  sprite: Phaser.GameObjects.Sprite,
  cx: number,
  cy: number,
  baseScale: number,
): void {
  sprite.clearTint();
  sprite.setPosition(cx, cy);
  sprite.setRotation(0);
  sprite.setScale(baseScale);
  sprite.setAlpha(1);
  sprite.setVisible(true);
}

// ── VFX helpers ──────────────────────────────────────────────

/**
 * Create a bright full-screen flash rectangle that fades out.
 * Returns the created rectangle so callers can adjust depth etc.
 */
export function createScreenFlash(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  opts: {
    color?: number;
    alpha?: number;
    duration?: number;
    scaleMultiplier?: number;
    depth?: number;
    blendMode?: Phaser.BlendModes | string;
  } = {},
): Phaser.GameObjects.Rectangle {
  const {
    color = 0xffffff,
    alpha = 1,
    duration = 300,
    scaleMultiplier = 2,
    depth = 100,
    blendMode = 'ADD',
  } = opts;

  const w = scene.scale.width * scaleMultiplier;
  const h = scene.scale.height * scaleMultiplier;

  const flash = scene.add.rectangle(cx, cy, w, h, color, alpha);
  flash.setDepth(depth);
  if (blendMode === 'ADD') {
    flash.setBlendMode(Phaser.BlendModes.ADD);
  }

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration,
    ease: 'Cubic.easeOut',
    onComplete: () => flash.destroy(),
  });

  return flash;
}

// ── Celebration message helper ───────────────────────────────

/**
 * Show a celebration message for `durationMs` then clear it.
 * Avoids the repeated `setCelebrationMessage` + `setTimeout` pattern.
 */
export function showCelebration(
  setter: (msg: string) => void,
  message: string,
  durationMs = 3000,
): void {
  setter(message);
  setTimeout(() => setter(''), durationMs);
}

// ── Emitter cleanup ──────────────────────────────────────────

/** Safely stop and destroy an array of particle emitters. */
export function cleanupEmitters(
  emitters: Phaser.GameObjects.Particles.ParticleEmitter[],
): void {
  for (const e of emitters) {
    try {
      if (e && !(e.scene as any)?.sys) continue; // scene already torn down
      e?.stop();
      e?.destroy();
    } catch {
      // emitter may already have been destroyed — swallow the error
    }
  }
}

/**
 * Initialise the `activeEmitters` data key on a sprite and return
 * a mutable array that animation code can push new emitters into.
 */
export function initEmitterTracking(
  sprite: Phaser.GameObjects.Sprite,
): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const arr: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  sprite.setData('activeEmitters', arr);
  return arr;
}
