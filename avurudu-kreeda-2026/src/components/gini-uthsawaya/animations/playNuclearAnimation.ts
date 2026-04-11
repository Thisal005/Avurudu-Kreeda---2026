// ──────────────────────────────────────────────────────────────
// playNuclearAnimation.ts — Nuclear (Nuce) firecracker animation.
// Ends with a fake system crash.
// ──────────────────────────────────────────────────────────────

import {
  AnimationParams,
  AnimationCallbacks,
} from '../firecrackerAnimationUtils';

/** Centralised particle configs used by the nuclear animation. */
function getParticleConfig(id: string): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  switch (id) {
    case 'nuclear_fuse':
      return {
        speed: { min: 100, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        lifespan: 500,
        maxParticles: 100,
        blendMode: 'ADD',
        tint: [0xffffff, 0xffff00],
      };
    case 'nuclear_blast':
      return {
        speed: { min: 500, max: 2000 },
        angle: { min: 0, max: 360 },
        scale: { start: 8, end: 0 },
        lifespan: 4000,
        blendMode: 'ADD',
        frequency: 10,
        tint: [0xffffffff, 0xffaa00, 0xff0000, 0x550000],
      };
    default:
      return {};
  }
}

export function playNuclearAnimation({
  scene,
  sprite,
  cx,
  cy,
  baseScale,
  callbacks,
}: AnimationParams): void {
  // Step 1: Fuse burning with sparks
  let particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  particleEmitter = scene.add.particles(cx, cy, 'spark', getParticleConfig('nuclear_fuse'));

  // Step 2: Build tension
  scene.tweens.add({
    targets: sprite,
    scale: baseScale * 1.5,
    rotation: 0.1,
    yoyo: true,
    repeat: -1,
    duration: 50,
  });

  callbacks.playSound('nuce1', { volume: 1.0 });

  // Set timeout for 3 seconds exactly
  scene.time.delayedCall(3000, () => {
    // Step 3: Nuclear Explosion flash
    if (particleEmitter) particleEmitter.stop();
    sprite.setVisible(false);

    const flash = scene.add.rectangle(cx, cy, scene.scale.width * 2, scene.scale.height * 2, 0xffffff);
    flash.setDepth(100);
    flash.setAlpha(1);

    callbacks.stopSound('nuce1');
    callbacks.playSound('nuce2', { volume: 1.0 });

    // Wait 1.5 seconds for flash
    scene.time.delayedCall(1500, () => {
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 1000,
        onComplete: () => flash.destroy(),
      });

      // Step 4: Mushroom cloud & Shake
      particleEmitter = scene.add.particles(cx, cy, 'spark', getParticleConfig('nuclear_blast'));
      scene.cameras.main.shake(3000, 0.05);

      // Step 5: Fake Crash
      scene.time.delayedCall(2000, () => {
        window.dispatchEvent(new Event('nuclear-crash'));
      });
    });
  });
}
