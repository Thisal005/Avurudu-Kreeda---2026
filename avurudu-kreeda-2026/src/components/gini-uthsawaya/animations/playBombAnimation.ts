// ──────────────────────────────────────────────────────────────
// playBombAnimation.ts — Big Bomb firecracker animation.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  initEmitterTracking,
  isMobileViewport,
  mobileParticleCount,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playBombAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  const activeEmitters = initEmitterTracking(sprite);
  const isMobile = isMobileViewport();
  const t = (count: number) => mobileParticleCount(count, isMobile);

  // ── Phase 1: Thick slow fuse ────────────────────────────────
  const fuseX = cx - 50;
  const fuseY = cy - 60;

  const fuseSparks = scene.add.particles(fuseX, fuseY, 'spark', {
    speed: { min: 80, max: 250 },
    angle: { min: 220, max: 320 },
    scale: { start: 1.2, end: 0 },
    lifespan: { min: 200, max: 400 },
    frequency: isMobile ? 40 : 20,
    blendMode: 'ADD',
    tint: [0xffaa00, 0xff4500, 0xffffff],
  });
  activeEmitters.push(fuseSparks);

  const fuseSmoke = scene.add.particles(fuseX, fuseY, 'spark', {
    speed: { min: 20, max: 80 },
    angle: { min: 220, max: 320 },
    scale: { start: 1, end: 4 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 1000,
    frequency: isMobile ? 80 : 40,
    tint: 0x555555,
  });
  activeEmitters.push(fuseSmoke);

  callbacks.playSound('bomb', { volume: 1.0 });

  scene.tweens.add({
    targets: [fuseSparks, fuseSmoke],
    x: cx,
    y: cy,
    duration: 2500,
    ease: 'Linear',
  });

  scene.tweens.add({
    targets: sprite,
    scale: baseScale * 1.05,
    yoyo: true,
    repeat: -1,
    duration: 200,
  });

  scene.time.delayedCall(2500, () => {
    fuseSparks.stop();
    fuseSmoke.stop();
    sprite.setVisible(false);
    scene.tweens.killTweensOf(sprite);

    // ── Phase 2: Massive Explosion ──────────────────────────────
    scene.cameras.main.shake(3000, 0.05);

    const flash = scene.add.rectangle(cx, cy, scene.scale.width * 2, scene.scale.height * 2, 0xffaa00);
    flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(100);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    const mainBurst = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 300, max: 1500 },
      angle: { min: 0, max: 360 },
      scale: { start: 3, end: 0 },
      lifespan: { min: 800, max: 2000 },
      quantity: t(400),
      blendMode: 'ADD',
      tint: [0xff0000, 0xff4500, 0xffaa00, 0xffff00],
    });
    activeEmitters.push(mainBurst);
    scene.time.delayedCall(150, () => mainBurst.stop());

    // Shockwaves
    for (let s = 0; s < 3; s++) {
      scene.time.delayedCall(s * 150, () => {
        const shockwave = scene.add.particles(cx, cy, 'spark', {
          speed: { min: 800 + s * 200, max: 1200 + s * 200 },
          angle: { min: 0, max: 360 },
          scale: { start: 2 - s * 0.5, end: 0 },
          lifespan: 600,
          quantity: t(150),
          blendMode: 'ADD',
          tint: [0xffaa00, 0xff4500],
        });
        activeEmitters.push(shockwave);
        scene.time.delayedCall(100, () => shockwave.stop());
      });
    }

    // Fiery debris
    const debris = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 400, max: 1800 },
      angle: { min: 0, max: 360 },
      gravityY: 400,
      scale: { start: 1.5, end: 0 },
      lifespan: { min: 1000, max: 2500 },
      quantity: t(100),
      blendMode: 'ADD',
      tint: [0xffffff, 0xffff00, 0xffaa00],
    });
    activeEmitters.push(debris);
    scene.time.delayedCall(200, () => debris.stop());

    // ── Phase 3: After Effects ──────────────────────────────────
    scene.time.delayedCall(500, () => {
      const thickSmoke = scene.add.particles(cx, cy + 50, 'spark', {
        speedX: { min: -150, max: 150 },
        speedY: { min: -200, max: -50 },
        scale: { start: 3, end: 10 },
        alpha: { start: 0.8, end: 0 },
        lifespan: { min: 3000, max: 5000 },
        frequency: isMobile ? 60 : 30,
        tint: [0x222222, 0x444444, 0x111111],
      });
      activeEmitters.push(thickSmoke);

      const embers = scene.add.particles(cx, cy - 100, 'spark', {
        speedX: { min: -300, max: 300 },
        speedY: { min: -200, max: 50 },
        gravityY: 150,
        scale: { start: 1, end: 0 },
        lifespan: { min: 2000, max: 4000 },
        frequency: isMobile ? 40 : 20,
        blendMode: 'ADD',
        tint: [0xff4500, 0xffaa00],
      });
      activeEmitters.push(embers);

      const groundDust = scene.add.particles(cx, cy + 100, 'spark', {
        speedX: { min: -400, max: 400 },
        speedY: { min: -100, max: 0 },
        gravityY: 300,
        scale: { start: 2, end: 5 },
        alpha: { start: 0.4, end: 0 },
        lifespan: { min: 1500, max: 2500 },
        quantity: t(100),
        tint: 0x554433,
      });
      activeEmitters.push(groundDust);
      scene.time.delayedCall(200, () => groundDust.stop());

      scene.time.delayedCall(4500, () => {
        thickSmoke.stop();
        embers.stop();
      });
    });

    scene.time.delayedCall(1500, () => {
      showCelebration(
        callbacks.setCelebrationMessage,
        Math.random() > 0.5 ? 'MASSIVE BLAST!' : 'BOOOOOOM!!! 🔥',
        3500,
      );
    });

    // Reset
    scene.time.delayedCall(6500, () => {
      resetSprite(sprite, cx, cy, baseScale);
    });
  });
}
