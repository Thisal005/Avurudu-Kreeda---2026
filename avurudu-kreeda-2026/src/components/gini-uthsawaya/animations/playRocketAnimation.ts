// ──────────────────────────────────────────────────────────────
// playRocketAnimation.ts — Rocket firecracker animation.
// ──────────────────────────────────────────────────────────────

import { DESKTOP_BREAKPOINT } from '../../GiniUthsawayaConfig';
import {
  AnimationParams,
  resetSprite,
  showCelebration,
} from '../firecrackerAnimationUtils';

export function playRocketAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
  const targetY = isDesktop ? 100 : 50;

  // ── Phase 1: Fuse Lighting ──────────────────────────────────
  const fuseEmitter = scene.add.particles(cx, cy + sprite.displayHeight / 2, 'spark', {
    speed: { min: 50, max: 150 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.8, end: 0 },
    lifespan: 400,
    blendMode: 'ADD',
    tint: [0xffaa00, 0xff4500],
  });

  const fuseSmoke = scene.add.particles(cx, cy + sprite.displayHeight / 2, 'spark', {
    speed: { min: 20, max: 50 },
    angle: { min: 200, max: 340 },
    scale: { start: 1, end: 3 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 800,
    tint: 0xcccccc,
  });

  callbacks.playSound('rocket', { volume: 0.95 });

  scene.time.delayedCall(1200, () => {
    fuseEmitter.stop();
    fuseSmoke.stop();

    // ── Phase 2 & 3: Launch and Flight ──────────────────────────
    const offset = sprite.displayHeight / 2;

    const thrustEmitter = scene.add.particles(0, 0, 'spark', {
      speed: { min: 200, max: 500 },
      angle: { min: 80, max: 100 },
      scale: { start: 2, end: 0 },
      lifespan: 300,
      blendMode: 'ADD',
      tint: [0xffff00, 0xffaa00, 0xff0000],
    });

    const smokeEmitter = scene.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 100 },
      angle: { min: 80, max: 100 },
      scale: { start: 3, end: 8 },
      lifespan: 1200,
      alpha: { start: 0.6, end: 0 },
      tint: 0xffffff,
    });

    const trailEmitter = scene.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 150 },
      angle: { min: 80, max: 100 },
      scale: { start: 1.5, end: 0 },
      lifespan: 700,
      blendMode: 'ADD',
      tint: [0xff0000, 0xff8c00, 0xffff00],
    });

    const sideSparks = scene.add.particles(0, 0, 'spark', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      tint: [0xffffff, 0xffaa00],
      frequency: 50,
    });

    sprite.setData('activeEmitters', [fuseEmitter, fuseSmoke, thrustEmitter, smokeEmitter, trailEmitter, sideSparks]);

    thrustEmitter.startFollow(sprite, 0, offset);
    smokeEmitter.startFollow(sprite, 0, offset);
    trailEmitter.startFollow(sprite, 0, offset);
    sideSparks.startFollow(sprite, 0, 0);

    scene.cameras.main.shake(2000, 0.005);
    sprite.setTint(0xffeedd);

    const flightPathX = cx + (Math.random() > 0.5 ? 150 : -150);

    scene.tweens.add({
      targets: sprite,
      y: targetY,
      x: flightPathX,
      rotation: flightPathX > cx ? 0.3 : -0.3,
      duration: 2000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // ── Phase 4: Climax Explosion ─────────────────────────────
        sprite.setVisible(false);
        thrustEmitter.stop();
        smokeEmitter.stop();
        trailEmitter.stop();
        sideSparks.stop();

        scene.cameras.main.shake(1000, 0.03);

        const flash = scene.add.circle(sprite.x, sprite.y, 10, 0xffffff);
        flash.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 50,
          duration: 300,
          onComplete: () => flash.destroy(),
        });

        // PRIMARY EXPLOSION
        scene.add.particles(sprite.x, sprite.y, 'spark', {
          speed: { min: 100, max: 500 },
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          lifespan: 10000,
          blendMode: 'ADD',
          tint: [0xffd700, 0xff0000, 0xffff00, 0xff8c00],
          maxParticles: 400,
        });

        for (let i = 0; i < 6; i++) {
          const angle = -180 + i * 36;
          scene.add.particles(sprite.x, sprite.y, 'spark', {
            speed: 300,
            angle: { min: angle - 8, max: angle + 8 },
            scale: { start: 2.5, end: 0 },
            lifespan: 10000,
            blendMode: 'ADD',
            tint: [0xff00ff, 0xffd700, 0xffaa00],
            maxParticles: 40,
          });
        }

        // SECONDARY STAGGERED EXPLOSION
        scene.time.delayedCall(300, () => {
          scene.cameras.main.shake(800, 0.02);
          scene.add.particles(sprite.x, sprite.y, 'spark', {
            speed: { min: 200, max: 800 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: 10000,
            blendMode: 'ADD',
            tint: [0xffffff, 0x00ffff, 0x00ff00],
            maxParticles: 300,
          });
        });

        scene.add.particles(sprite.x, sprite.y, 'spark', {
          speed: { min: 50, max: 150 },
          angle: { min: 0, max: 360 },
          scale: { start: 3, end: 8 },
          alpha: { start: 0.4, end: 0 },
          lifespan: 10000,
          tint: 0x444444,
          maxParticles: 60,
        });

        scene.add.particles(sprite.x, sprite.y, 'spark', {
          speed: { min: 50, max: 200 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          lifespan: 10000,
          gravityY: 30,
          blendMode: 'ADD',
          tint: [0xffaa00, 0xff4500, 0xffffff],
          maxParticles: 200,
        });

        // Phase 5: After Effects
        scene.time.delayedCall(4000, () => {
          showCelebration(
            callbacks.setCelebrationMessage,
            'Subha Avuruddak! What a Rocket!',
            5000,
          );
        });

        // Phase 6: Reset
        scene.time.delayedCall(10000, () => {
          if (sprite.texture.key === 'rocket') {
            resetSprite(sprite, cx, cy, baseScale);
          }
        });
      },
    });
  });
}
