// ──────────────────────────────────────────────────────────────
// playMegaAnimation.ts — Mega Pack firecracker animation.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  initEmitterTracking,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playMegaAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  const activeEmitters = initEmitterTracking(sprite);

  // Shake while fuse burns
  scene.tweens.add({
    targets: sprite,
    angle: { from: -2, to: 2 },
    yoyo: true,
    repeat: 18,
    duration: 80,
  });

  // ── Phase 1: Multiple fuses ─────────────────────────────────
  const fuseOffsets = [
    { x: -20, y: -40, speed: 1200 },
    { x: 0, y: -45, speed: 1500 },
    { x: 20, y: -38, speed: 1000 },
    { x: -10, y: -42, speed: 1300 },
    { x: 10, y: -35, speed: 1100 },
  ];

  fuseOffsets.forEach((offset) => {
    const fuseSpark = scene.add.particles(cx + offset.x, cy + offset.y, 'spark', {
      speed: { min: 50, max: 150 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 100, max: 200 },
      frequency: 30,
      blendMode: 'ADD',
      tint: [0xffaa00, 0xff4500, 0xffffff],
    });
    activeEmitters.push(fuseSpark);

    scene.tweens.add({
      targets: fuseSpark,
      x: cx,
      y: cy,
      duration: offset.speed,
      ease: 'Linear',
    });
  });

  callbacks.playSound('bigpatas', { volume: 1.0 });

  scene.time.delayedCall(1500, () => {
    // ── Phase 2: Build-up pops ──────────────────────────────────
    activeEmitters.forEach((e) => {
      if (e.blendMode === Phaser.BlendModes.ADD) e.stop();
    });

    for (let i = 0; i < 4; i++) {
      scene.time.delayedCall(i * 150, () => {
        const px = cx + Phaser.Math.Between(-30, 30);
        const py = cy + Phaser.Math.Between(-20, 20);
        const pop = scene.add.particles(px, py, 'spark', {
          speed: { min: 100, max: 300 },
          scale: { start: 0.8, end: 0 },
          lifespan: 300,
          blendMode: 'ADD',
          tint: [0xffffff, 0xffaa00],
        });
        activeEmitters.push(pop);
        scene.time.delayedCall(100, () => pop.stop());
        scene.cameras.main.shake(100, 0.005);
      });
    }

    // ── Phase 3: Main Mega Explosion ────────────────────────────
    scene.time.delayedCall(800, () => {
      sprite.setVisible(false);
      scene.cameras.main.shake(2500, 0.04);

      // Flash
      const flash = scene.add.rectangle(cx, cy, scene.scale.width * 2, scene.scale.height * 2, 0xffeedd);
      flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(90);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });

      // Overlapping explosions
      for (let i = 0; i < 8; i++) {
        scene.time.delayedCall(i * 100 + Phaser.Math.Between(0, 50), () => {
          const ex = cx + Phaser.Math.Between(-60, 60);
          const ey = cy + Phaser.Math.Between(-60, 20);
          const burst = scene.add.particles(ex, ey, 'spark', {
            speed: { min: 300, max: 800 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: { min: 400, max: 800 },
            blendMode: 'ADD',
            quantity: 80,
            tint: [0xff0000, 0xff8c00, 0xffd700, 0xffff00, 0xffffff],
          });
          activeEmitters.push(burst);
          scene.time.delayedCall(150, () => burst.stop());
        });
      }

      // Dense central chaotic burst
      const massiveBurst = scene.add.particles(cx, cy, 'spark', {
        speed: { min: 200, max: 1200 },
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        lifespan: { min: 600, max: 1500 },
        frequency: 10,
        blendMode: 'ADD',
        tint: [0xff1100, 0xff6600, 0xffcc00, 0xffeeaa],
        maxParticles: 400,
      });
      activeEmitters.push(massiveBurst);

      // Shockwaves
      for (let s = 0; s < 3; s++) {
        scene.time.delayedCall(s * 200, () => {
          const ring = scene.add.particles(cx, cy, 'spark', {
            speed: { min: 600, max: 1000 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            lifespan: 500,
            quantity: 100,
            blendMode: 'ADD',
            tint: [0xffddaa, 0xff6600],
          });
          activeEmitters.push(ring);
          scene.time.delayedCall(100, () => ring.stop());
        });
      }

      // Mini rockets (small patas shooting up)
      for (let m = 0; m < 5; m++) {
        scene.time.delayedCall(m * 150, () => {
          const rx = cx + Phaser.Math.Between(-40, 40);
          const ry = cy;
          const rocketSpark = scene.add.particles(rx, ry, 'spark', {
            speed: { min: 300, max: 600 },
            angle: { min: 240, max: 300 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: 0xffffaa,
          });
          activeEmitters.push(rocketSpark);

          scene.time.delayedCall(300 + Phaser.Math.Between(0, 100), () => {
            rocketSpark.stop();
            const tx = rx + Phaser.Math.Between(-30, 30);
            const ty = ry - 150 - Phaser.Math.Between(0, 50);
            const airPop = scene.add.particles(tx, ty, 'spark', {
              speed: { min: 200, max: 400 },
              scale: { start: 1.2, end: 0 },
              lifespan: 400,
              quantity: 40,
              blendMode: 'ADD',
              tint: [0xffffff, 0xff0000, 0xffcc00],
            });
            activeEmitters.push(airPop);
            scene.time.delayedCall(100, () => airPop.stop());
          });
        });
      }

      // ── Phase 4: After Effects ──────────────────────────────────
      scene.time.delayedCall(1000, () => {
        massiveBurst.stop();

        const embersRain = scene.add.particles(cx, cy - 100, 'spark', {
          speedX: { min: -250, max: 250 },
          speedY: { min: -100, max: 50 },
          gravityY: 150,
          scale: { start: 0.8, end: 0 },
          lifespan: { min: 1500, max: 3000 },
          frequency: 20,
          blendMode: 'ADD',
          tint: [0xffcc00, 0xff6600, 0xff2200],
        });
        activeEmitters.push(embersRain);

        const thickSmoke = scene.add.particles(cx, cy + 20, 'spark', {
          speedX: { min: -100, max: 100 },
          speedY: { min: -150, max: -50 },
          scale: { start: 2, end: 6 },
          alpha: { start: 0.5, end: 0 },
          lifespan: { min: 2000, max: 4000 },
          frequency: 50,
          blendMode: 'NORMAL',
          tint: [0x444444, 0x666666, 0x888888],
        });
        activeEmitters.push(thickSmoke);

        // Small delayed pops
        for (let d = 0; d < 6; d++) {
          scene.time.delayedCall(d * 400 + Phaser.Math.Between(0, 200), () => {
            const popx = cx + Phaser.Math.Between(-80, 80);
            const popy = cy + Phaser.Math.Between(-40, 40);
            const pop = scene.add.particles(popx, popy, 'spark', {
              speed: { min: 100, max: 300 },
              scale: { start: 1, end: 0 },
              lifespan: 300,
              quantity: 20,
              blendMode: 'ADD',
              tint: [0xffaa00, 0xffffff],
            });
            activeEmitters.push(pop);
            scene.time.delayedCall(100, () => pop.stop());
          });
        }

        scene.time.delayedCall(4000, () => {
          embersRain.stop();
          thickSmoke.stop();
        });
      });

      scene.time.delayedCall(2000, () => {
        showCelebration(
          callbacks.setCelebrationMessage,
          Math.random() > 0.5 ? 'MEGA BLAST! 🔥🔥🔥' : 'What a Mega Pack!',
          3000,
        );
      });

      // Reset
      scene.time.delayedCall(7000, () => {
        resetSprite(sprite, cx, cy, baseScale);
      });
    });
  });
}
