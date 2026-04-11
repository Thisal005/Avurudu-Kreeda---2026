// ──────────────────────────────────────────────────────────────
// playPatasAnimation.ts — Small Patas firecracker animation.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  initEmitterTracking,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playPatasAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  const activeEmitters = initEmitterTracking(sprite);
  callbacks.playSound('patas', { volume: 0.9 });

  // ── Phase 1: Quick fuse race (~1 second) ────────────────────
  const fuseSpark = scene.add.particles(cx - 110, cy - 40, 'spark', {
    speed: { min: 180, max: 360 },
    angle: { min: 340, max: 380 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 1, end: 0.1 },
    lifespan: { min: 120, max: 220 },
    quantity: 5,
    frequency: 25,
    blendMode: 'ADD',
    tint: [0xfff4a3, 0xffc14a, 0xff6a00],
  });
  activeEmitters.push(fuseSpark);

  scene.tweens.add({
    targets: fuseSpark,
    x: cx - 8,
    y: cy - 8,
    duration: 950,
    ease: 'Cubic.easeIn',
  });

  scene.tweens.add({
    targets: sprite,
    angle: { from: -2, to: 2 },
    yoyo: true,
    repeat: 8,
    duration: 55,
  });

  scene.time.delayedCall(1000, () => {
    fuseSpark.stop();

    // ── Phase 2: Sharp flash + burst + ring + impact shake ─────
    const flash = scene.add.circle(cx, cy, 8, 0xfff2a8, 0.95).setDepth(80);
    scene.tweens.add({
      targets: flash,
      radius: 260,
      alpha: 0,
      duration: 130,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    scene.cameras.main.shake(180, 0.011, true);
    sprite.setVisible(false);

    const burst = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 260, max: 820 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 380, max: 900 },
      quantity: 170,
      blendMode: 'ADD',
      tint: [0xff2a2a, 0xff6a00, 0xffc533, 0xfff0a8],
    });
    activeEmitters.push(burst);

    const shockRing = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 420, max: 540 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.95, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 460,
      quantity: 55,
      blendMode: 'ADD',
      tint: [0xfff4a3, 0xff8a00],
    });
    activeEmitters.push(shockRing);

    const trail = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 220, max: 640 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0.25 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 700, max: 1150 },
      quantity: 45,
      blendMode: 'ADD',
      tint: [0xff4f2f, 0xffb14f, 0xfff1c7],
    });
    activeEmitters.push(trail);

    scene.time.delayedCall(200, () => {
      burst.stop();
      shockRing.stop();
      trail.stop();
    });

    // ── Phase 3: Falling embers + smoke (1.5-2s) ──────────────
    scene.time.delayedCall(220, () => {
      const embers = scene.add.particles(cx, cy - 12, 'spark', {
        speedX: { min: -70, max: 70 },
        speedY: { min: -100, max: 40 },
        gravityY: 150,
        scale: { start: 0.65, end: 0.05 },
        alpha: { start: 0.8, end: 0 },
        lifespan: { min: 900, max: 1700 },
        frequency: 32,
        maxParticles: 80,
        blendMode: 'ADD',
        tint: [0xfff3be, 0xffbc52, 0xff7a24],
      });
      activeEmitters.push(embers);

      const smoke = scene.add.particles(cx, cy + 4, 'spark', {
        speedX: { min: -22, max: 22 },
        speedY: { min: -74, max: -28 },
        scale: { start: 1.25, end: 2.1 },
        alpha: { start: 0.28, end: 0 },
        lifespan: { min: 1200, max: 1900 },
        frequency: 90,
        maxParticles: 20,
        blendMode: 'NORMAL',
        tint: [0x5f5f5f, 0x8c8c8c],
      });
      activeEmitters.push(smoke);

      scene.time.delayedCall(1800, () => {
        embers.stop();
        smoke.stop();
      });
    });

    // Celebration text
    scene.time.delayedCall(380, () => {
      showCelebration(
        callbacks.setCelebrationMessage,
        Math.random() > 0.5 ? 'Paataaas! 🔥' : 'Subha Avuruddak!',
        1700,
      );
    });

    // Reset
    scene.time.delayedCall(2600, () => {
      resetSprite(sprite, cx, cy, baseScale);
    });
  });
}
