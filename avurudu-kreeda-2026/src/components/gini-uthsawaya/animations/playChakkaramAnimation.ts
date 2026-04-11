// ──────────────────────────────────────────────────────────────
// playChakkaramAnimation.ts — Chakkaram / Wheel firecracker.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playChakkaramAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  // Initial metallic tint
  sprite.setTint(0xffffee);

  // ── Phase 1: Fuse Lighting ──────────────────────────────────
  const fuseEmitter = scene.add.particles(cx + sprite.displayWidth / 2, cy, 'spark', {
    speed: { min: 20, max: 80 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    lifespan: 300,
    blendMode: 'ADD',
    tint: [0xffaa00, 0xff4500],
  });

  callbacks.playSound('chakkaram', { volume: 0.9 });

  scene.tweens.add({
    targets: fuseEmitter,
    x: cx,
    y: cy,
    duration: 1500,
    ease: 'Linear',
  });

  scene.time.delayedCall(1500, () => {
    fuseEmitter.stop();

    // ── Phase 3: Main Spin — Intense glowing rings ─────────────
    const redRing = scene.add.particles(cx, cy, 'spark', {
      speed: 150,
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      tint: 0xff0000,
      frequency: 15,
    });

    const orangeRing = scene.add.particles(cx, cy, 'spark', {
      speed: 250,
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      tint: 0xff8c00,
      frequency: 10,
    });

    const goldRing = scene.add.particles(cx, cy, 'spark', {
      speed: 400,
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      tint: [0xffd700, 0xffff00],
      frequency: 5,
    });

    const groundSmoke = scene.add.particles(cx, cy + 20, 'spark', {
      speed: { min: 20, max: 100 },
      angle: { min: 180, max: 360 },
      scale: { start: 2, end: 6 },
      lifespan: 2000,
      alpha: { start: 0.4, end: 0 },
      tint: 0x888888,
      frequency: 40,
    });

    sprite.setData('activeEmitters', [fuseEmitter, redRing, orangeRing, goldRing, groundSmoke]);

    scene.tweens.add({
      targets: sprite,
      rotation: Math.PI * 60,
      duration: 4500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // ── Phase 4: Climax & Final Burst ─────────────────────────
        redRing.stop();
        orangeRing.stop();
        goldRing.stop();
        groundSmoke.stop();

        sprite.setVisible(false);

        scene.cameras.main.shake(1000, 0.02);

        const flash = scene.add.circle(cx, cy, 10, 0xffffff);
        flash.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 80,
          duration: 300,
          onComplete: () => flash.destroy(),
        });

        scene.time.delayedCall(1000, () => {
          showCelebration(
            callbacks.setCelebrationMessage,
            'What a Spin! Subha Avuruddak!',
            4000,
          );
        });

        scene.time.delayedCall(3000, () => {
          if (sprite.texture.key === 'chakkaram') {
            resetSprite(sprite, cx, cy, baseScale);
          }
        });
      },
    });

    // Wobble while spinning
    scene.tweens.add({
      targets: sprite,
      x: cx + 2,
      y: cy + 2,
      yoyo: true,
      repeat: 90,
      duration: 25,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (sprite.texture.key === 'chakkaram') sprite.setPosition(cx, cy);
      },
    });
  });
}
