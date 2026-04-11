// ──────────────────────────────────────────────────────────────
// playBigPattasAnimation.ts — Big Pattas (flowerpot) animation.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  initEmitterTracking,
  isMobileViewport,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playBigPattasAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  const activeEmitters = initEmitterTracking(sprite);
  callbacks.playSound('bigpatas', { volume: 1.0 });

  const mobile = isMobileViewport();
  const pq = (n: number) => Math.max(8, Math.floor(n * (mobile ? 0.55 : 1)));

  // ── Phase 1: Thick fuse (2 s tension) ───────────────────────
  const fuseFlare = scene.add.particles(cx - 120, cy - 46, 'spark', {
    speed: { min: 90, max: 200 },
    angle: { min: 335, max: 385 },
    scale: { start: 1.35, end: 0.2 },
    alpha: { start: 1, end: 0 },
    lifespan: { min: 200, max: 380 },
    quantity: pq(9),
    frequency: mobile ? 28 : 26,
    blendMode: 'ADD',
    tint: [0xfff0ac, 0xff9f2f, 0xff4f00, 0xffcc66],
  });
  activeEmitters.push(fuseFlare);

  const fuseThick = scene.add.particles(cx - 118, cy - 44, 'spark', {
    speed: { min: 40, max: 120 },
    angle: { min: 330, max: 390 },
    scale: { start: 0.75, end: 0 },
    lifespan: { min: 280, max: 420 },
    quantity: pq(4),
    frequency: 45,
    blendMode: 'ADD',
    tint: [0xff7800, 0xffaa55],
  });
  activeEmitters.push(fuseThick);

  const fuseSmoke = scene.add.particles(cx - 120, cy - 42, 'spark', {
    speedX: { min: -22, max: 22 },
    speedY: { min: -52, max: -12 },
    scale: { start: 1.35, end: 2.8 },
    alpha: { start: 0.35, end: 0 },
    lifespan: { min: 800, max: 1300 },
    frequency: mobile ? 80 : 65,
    maxParticles: mobile ? 22 : 32,
    blendMode: 'NORMAL',
    tint: [0x5a5a5a, 0x7a7a7a],
  });
  activeEmitters.push(fuseSmoke);

  scene.tweens.add({
    targets: [fuseFlare, fuseThick, fuseSmoke],
    x: cx - 8,
    y: cy - 10,
    duration: 1950,
    ease: 'Cubic.easeInOut',
  });

  scene.tweens.add({
    targets: sprite,
    scale: { from: baseScale, to: baseScale * 1.1 },
    yoyo: true,
    repeat: 16,
    duration: 115,
    ease: 'Sine.easeInOut',
  });

  scene.time.delayedCall(2000, () => {
    fuseFlare.stop();
    fuseThick.stop();
    fuseSmoke.stop();

    // ── Phase 2: Ignition flash + blast rings ───────────────────
    const flashW = Math.max(scene.scale.width, scene.scale.height) * (mobile ? 1.1 : 1.35);
    const flashH = Math.max(scene.scale.width, scene.scale.height) * (mobile ? 0.95 : 1.15);
    const flash = scene.add.rectangle(cx, cy, flashW, flashH, 0xfff8d0, 0.92).setDepth(95);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    sprite.setVisible(false);
    scene.cameras.main.shake(mobile ? 420 : 620, mobile ? 0.019 : 0.028, true);

    const megaBurst = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 280, max: 1180 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 620, max: 1550 },
      quantity: pq(320),
      blendMode: 'ADD',
      tint: [0xff1515, 0xff6600, 0xffc400, 0xffee99, 0xfff5c8],
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 32) } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    activeEmitters.push(megaBurst);

    const ringOne = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 380, max: 560 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.55, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 720,
      quantity: pq(110),
      blendMode: 'ADD',
      tint: [0xffee9d, 0xff8d1f],
    });
    activeEmitters.push(ringOne);

    const ringTwo = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 560, max: 760 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.15, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 580,
      quantity: pq(140),
      blendMode: 'ADD',
      tint: [0xfff7ca, 0xffb749],
    });
    activeEmitters.push(ringTwo);

    scene.time.delayedCall(60, () => {
      const ringThree = scene.add.particles(cx, cy, 'spark', {
        speed: { min: 680, max: 920 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.85, end: 0 },
        lifespan: 480,
        quantity: pq(100),
        blendMode: 'ADD',
        tint: [0xffe8a0, 0xffaa33],
      });
      activeEmitters.push(ringThree);
      scene.time.delayedCall(380, () => ringThree.stop());
    });

    const upwardJets = scene.add.particles(cx, cy + 10, 'spark', {
      speed: { min: 420, max: 980 },
      angle: { min: 240, max: 300 },
      gravityY: 130,
      scale: { start: 1.35, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 560, max: 1280 },
      quantity: pq(90),
      blendMode: 'ADD',
      tint: [0xfff7bc, 0xffa12d, 0xff3a12],
    });
    activeEmitters.push(upwardJets);

    const outwardShell = scene.add.particles(cx, cy, 'spark', {
      speed: { min: 300, max: 1020 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 500, max: 1200 },
      quantity: pq(200),
      blendMode: 'ADD',
      tint: [0xff2200, 0xff8800, 0xffdd55],
    });
    activeEmitters.push(outwardShell);

    scene.time.delayedCall(380, () => {
      megaBurst.stop();
      ringOne.stop();
      ringTwo.stop();
      upwardJets.stop();
      outwardShell.stop();
    });

    // ── Phase 3: Embers + smoke + ground dust (3-4 s) ──────────
    scene.time.delayedCall(300, () => {
      const emberRain = scene.add.particles(cx, cy - 50, 'spark', {
        speedX: { min: -200, max: 200 },
        speedY: { min: -70, max: 50 },
        gravityY: 220,
        scale: { start: 1, end: 0.06 },
        alpha: { start: 0.92, end: 0 },
        lifespan: { min: 1800, max: 3400 },
        frequency: mobile ? 22 : 14,
        maxParticles: mobile ? 110 : 190,
        blendMode: 'ADD',
        tint: [0xfff2be, 0xffbe5f, 0xff6e1f],
      });
      activeEmitters.push(emberRain);

      const thickSmoke = scene.add.particles(cx, cy + 12, 'spark', {
        speedX: { min: -50, max: 50 },
        speedY: { min: -110, max: -40 },
        scale: { start: 2, end: 4.2 },
        alpha: { start: 0.36, end: 0 },
        lifespan: { min: 2400, max: 3800 },
        frequency: mobile ? 100 : 88,
        maxParticles: mobile ? 26 : 36,
        blendMode: 'NORMAL',
        tint: [0x454545, 0x6a6a6a, 0x888888],
      });
      activeEmitters.push(thickSmoke);

      const groundDust = scene.add.particles(cx, cy + 70, 'spark', {
        speedX: { min: -190, max: 190 },
        speedY: { min: -130, max: -40 },
        gravityY: 210,
        scale: { start: 1.1, end: 2.6 },
        alpha: { start: 0.42, end: 0 },
        lifespan: { min: 950, max: 1750 },
        quantity: pq(95),
        blendMode: 'NORMAL',
        tint: [0x7a6a57, 0x8f7d66, 0x6b5c4a],
      });
      activeEmitters.push(groundDust);

      scene.time.delayedCall(3600, () => {
        emberRain.stop();
        thickSmoke.stop();
        groundDust.stop();
      });
    });

    scene.time.delayedCall(480, () => {
      showCelebration(
        callbacks.setCelebrationMessage,
        Math.random() > 0.5 ? 'BOOM! What a Big Patas!' : 'Mega Blast! 🔥',
        2400,
      );
    });

    // Reset (~5.6 s from ignite)
    scene.time.delayedCall(5600, () => {
      resetSprite(sprite, cx, cy, baseScale);
    });
  });
}
