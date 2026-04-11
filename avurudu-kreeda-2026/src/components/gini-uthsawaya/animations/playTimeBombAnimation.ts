// ──────────────────────────────────────────────────────────────
// playTimeBombAnimation.ts — Time Bomb firecracker animation.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  initEmitterTracking,
  isMobileViewport,
  mobileParticleCount,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playTimeBombAnimation({
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

  // ── Phase 1: Fuse Lighting (2 s) ───────────────────────────
  const fuseX = cx;
  const fuseY = cy - 60;

  const fuseSparks = scene.add.particles(fuseX, fuseY, 'spark', {
    speed: { min: 50, max: 150 },
    angle: { min: 250, max: 290 },
    scale: { start: 1, end: 0 },
    lifespan: { min: 200, max: 300 },
    frequency: 30,
    blendMode: 'ADD',
    tint: [0xffaa00, 0xff4500, 0xffffff],
  });
  activeEmitters.push(fuseSparks);

  callbacks.playSound('timebomb1', { volume: 1.0 });

  scene.tweens.add({
    targets: fuseSparks,
    x: cx,
    y: cy,
    duration: 2000,
    ease: 'Linear',
  });

  scene.time.delayedCall(2000, () => {
    fuseSparks.stop();

    // ── Phase 2: Tension Build-up (3 s ticking) ─────────────────
    scene.tweens.add({
      targets: sprite,
      scale: { from: baseScale, to: baseScale * 1.15 },
      yoyo: true,
      repeat: 14,
      duration: 100,
      ease: 'Sine.easeInOut',
    });

    const ticker = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 100, max: 200 },
      scale: { start: 1.5, end: 0 },
      lifespan: 200,
      frequency: 200,
      blendMode: 'ADD',
      tint: 0xff0000,
    });
    activeEmitters.push(ticker);

    const tensionFlash = scene.add
      .rectangle(cx, cy, scene.scale.width * 2, scene.scale.height * 2, 0xff0000, 0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(90);

    scene.tweens.add({
      targets: tensionFlash,
      alpha: { from: 0.1, to: 0.4 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    scene.time.delayedCall(3000, () => {
      ticker.stop();
      sprite.setVisible(false);
      scene.tweens.killTweensOf(sprite);
      scene.tweens.killTweensOf(tensionFlash);
      tensionFlash.destroy();

      // ── Phase 3: Massive Explosion (5 s) ────────────────────────
      callbacks.stopSound('timebomb1');
      callbacks.playSound('timebomb2', { volume: 1.0 });
      scene.cameras.main.shake(5000, 0.06);

      const nukeFlash = scene.add
        .rectangle(cx, cy, scene.scale.width * 2, scene.scale.height * 2, 0xff3300, 0.8)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(100);

      scene.tweens.add({
        targets: nukeFlash,
        alpha: { from: 0.7, to: 0.9 },
        yoyo: true,
        repeat: -1,
        duration: 100,
      });

      const massiveCore = scene.add.particles(cx, cy, 'spark', {
        speed: { min: 200, max: 1500 },
        angle: { min: 0, max: 360 },
        scale: { start: 4, end: 0 },
        lifespan: { min: 1000, max: 3000 },
        frequency: 15,
        blendMode: 'ADD',
        tint: [0xff0000, 0xff4500, 0xffaa00, 0xffff00],
        maxParticles: t(800),
      });
      activeEmitters.push(massiveCore);

      // Expanding shockwaves
      for (let s = 0; s < 5; s++) {
        scene.time.delayedCall(s * 400, () => {
          const shock = scene.add.particles(cx, cy, 'spark', {
            speed: { min: 1000 + s * 200, max: 1500 + s * 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 3, end: 0 },
            lifespan: 800,
            quantity: t(150),
            blendMode: 'ADD',
            tint: [0xff0000, 0xff4500, 0xffaa00],
          });
          activeEmitters.push(shock);
          scene.time.delayedCall(100, () => shock.stop());
        });
      }

      scene.time.delayedCall(4500, () => massiveCore.stop());

      // ── Phase 4: After Effects ──────────────────────────────────
      scene.time.delayedCall(5000, () => {
        scene.tweens.killTweensOf(nukeFlash);
        scene.tweens.add({
          targets: nukeFlash,
          alpha: 0,
          duration: 2000,
          ease: 'Linear',
          onComplete: () => nukeFlash.destroy(),
        });

        const smoke = scene.add.particles(cx, cy, 'spark', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 5, end: 12 },
          alpha: { start: 0.8, end: 0 },
          lifespan: { min: 3000, max: 6000 },
          frequency: isMobile ? 80 : 40,
          tint: [0x111111, 0x333333, 0x222222],
        });
        activeEmitters.push(smoke);

        const embers = scene.add.particles(cx, cy - 150, 'spark', {
          speedX: { min: -400, max: 400 },
          speedY: { min: -200, max: 100 },
          gravityY: 100,
          scale: { start: 1.5, end: 0 },
          lifespan: { min: 2500, max: 5000 },
          frequency: isMobile ? 60 : 30,
          blendMode: 'ADD',
          tint: [0xff0000, 0xff4500, 0xffaa00],
        });
        activeEmitters.push(embers);

        showCelebration(
          callbacks.setCelebrationMessage,
          Math.random() > 0.5 ? 'TIME BOMB DETONATED!' : 'MASSIVE EXPLOSION!!! 🔥',
          4000,
        );

        scene.time.delayedCall(4000, () => {
          smoke.stop();
          embers.stop();
        });

        scene.time.delayedCall(6000, () => {
          resetSprite(sprite, cx, cy, baseScale);
        });
      });
    });
  });
}
