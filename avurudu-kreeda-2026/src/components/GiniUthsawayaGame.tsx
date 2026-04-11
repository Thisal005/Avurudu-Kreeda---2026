"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, ChevronRight, Sparkles, X, Info } from "lucide-react";
import { FIRECRACKERS, FirecrackerType } from "./GiniUthsawayaConfig"; // We'll create a separate config file to clean things up

export default function GiniUthsawayaGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const soundsRef = useRef<Record<string, HTMLAudioElement>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLightingMode, setIsLightingMode] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [hasCrashed, setHasCrashed] = useState(false);

  useEffect(() => {
    const onCrash = () => setHasCrashed(true);
    window.addEventListener('nuclear-crash', onCrash);
    return () => window.removeEventListener('nuclear-crash', onCrash);
  }, []);

  // Preload all firecracker sounds once on mount
  useEffect(() => {
    const files: Record<string, string> = {
      patas:    '/firecrackers/patas.mp3',
      bigpatas: '/firecrackers/bigpatas.mp3',
      chakkaram:'/firecrackers/chakra.mp3',
      rocket:   '/firecrackers/rocket.MP3',
      bomb:     '/firecrackers/bomb.mp3',
      timebomb1: '/firecrackers/sound_1.mp3',
      timebomb2: '/firecrackers/timebomb.mp3',
      nuce1:    '/firecrackers/nuce1.mp3',
      nuce2:    '/firecrackers/nuce2.mp3',
    };
    const map: Record<string, HTMLAudioElement> = {};
    Object.entries(files).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      map[key] = audio;
    });
    soundsRef.current = map;
    return () => {
      Object.values(map).forEach(a => { a.pause(); a.src = ''; });
    };
  }, []);

  const playSound = useCallback((key: string, { volume = 1, restart = true }: { volume?: number; restart?: boolean } = {}) => {
    const audio = soundsRef.current[key];
    if (!audio) return;
    if (restart) {
      audio.currentTime = 0;
    }
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.play().catch(() => {/* autoplay policy – user interacted so should be fine */});
  }, []);

  const stopSound = useCallback((key: string) => {
    const audio = soundsRef.current[key];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  // Derived state: what firecrackers do we actually own?
  const ownedItems = Object.keys(inventory).filter((id) => inventory[id] > 0);
  const activeItemIndex = activeItemId ? ownedItems.indexOf(activeItemId) : -1;

  useEffect(() => {
    // Load points & inventory
    const savedPoints = localStorage.getItem("kreedaPoints");
    if (savedPoints) setTotalPoints(parseInt(savedPoints, 10));

    const savedInventory = localStorage.getItem("firecrackerInventory");
    if (savedInventory) {
      const parsed = JSON.parse(savedInventory);
      setInventory(parsed);
      const items = Object.keys(parsed).filter((k) => parsed[k] > 0);
      if (items.length > 0) setActiveItemId(items[0]);
    }
  }, []);

  // Auto-select logic when changing activeItemId or inventory
  useEffect(() => {
    if (activeItemId && inventory[activeItemId] === 0) {
      const items = Object.keys(inventory).filter((k) => inventory[k] > 0);
      setActiveItemId(items.length > 0 ? items[0] : null);
      if (phaserGameRef.current) {
        phaserGameRef.current.events.emit("hide-firecracker");
      }
    } else if (!activeItemId && Object.keys(inventory).filter(k => inventory[k] > 0).length > 0) {
      setActiveItemId(Object.keys(inventory).filter(k => inventory[k] > 0)[0]);
    }
  }, [inventory, activeItemId]);

  // Boot Phaser
  useEffect(() => {
    if (typeof window === "undefined" || !gameRef.current) return;

    const initPhaser = async () => {
      const Phaser = (await import("phaser")).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current!,
        width: window.innerWidth,
        height: window.innerHeight,
        transparent: true,
        physics: { default: "arcade" },
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      if (!phaserGameRef.current) {
        phaserGameRef.current = new Phaser.Game(config);
      }
    };

    initPhaser();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Update Phaser Scene when active item changes
  useEffect(() => {
    if (phaserGameRef.current && activeItemId) {
      phaserGameRef.current.events.emit("show-firecracker", activeItemId);
    }
  }, [activeItemId]);

  const buyItem = (item: FirecrackerType, qty: number = 1) => {
    const cost = item.price * qty;
    if (totalPoints >= cost) {
      const newTotal = totalPoints - cost;
      setTotalPoints(newTotal);
      localStorage.setItem("kreedaPoints", newTotal.toString());

      setInventory((prev) => {
        const next = {
          ...prev,
          [item.id]: (prev[item.id] || 0) + qty,
        };
        localStorage.setItem("firecrackerInventory", JSON.stringify(next));
        return next;
      });
    } else {
      alert("Not enough Kreeda Points!");
    }
  };

  const handleNext = () => {
    if (ownedItems.length <= 1) return;
    const nextIdx = (activeItemIndex + 1) % ownedItems.length;
    setActiveItemId(ownedItems[nextIdx]);
    setIsLightingMode(false); // Cancel light mode on switch
  };

  const handlePrev = () => {
    if (ownedItems.length <= 1) return;
    const prevIdx = (activeItemIndex - 1 + ownedItems.length) % ownedItems.length;
    setActiveItemId(ownedItems[prevIdx]);
    setIsLightingMode(false);
  };

  const activateLightingMode = () => {
    if (!activeItemId) return;
    setIsLightingMode(true);
    if (phaserGameRef.current) {
      phaserGameRef.current.events.emit("enter-lighting-mode");
    }
  };

  // PHASER LOGIC -------------------------------------------
  function preload(this: Phaser.Scene) {
    // Load PNGs for firecrackers
    this.load.image('patas', '/firecrackers/One.png');
    this.load.image('flowerpot', '/firecrackers/Two.png');
    this.load.image('chakkaram', '/firecrackers/Four.png');
    this.load.image('rocket', '/firecrackers/Five.png');
    this.load.image('bomb', '/firecrackers/Eight.png');
    this.load.image('mega', '/firecrackers/Three.png');
    this.load.image('Time Bomb', '/firecrackers/Six.png');
    this.load.image('Nuce', '/firecrackers/Seven.png');

    // Create a particle texture
    const pg = this.add.graphics();
    pg.fillStyle(0xffffff, 1);
    pg.fillCircle(4, 4, 4);
    pg.generateTexture('spark', 8, 8);
    pg.destroy();

    const fg = this.add.graphics();
    fg.fillStyle(0xff8c00, 1);
    fg.fillTriangle(4, 0, 8, 8, 0, 8);
    fg.generateTexture('flame', 8, 8);
    fg.destroy();
  }

  function create(this: Phaser.Scene) {
    // Starry background
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.8));
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2 + 50;

    const fcSprite = this.add.sprite(centerX, centerY, 'patas');
    fcSprite.setVisible(false);

    // Fuse interaction zone
    const fuseZone = this.add.zone(centerX, centerY - 50, 80, 80);
    fuseZone.setInteractive();
    fuseZone.setName('fuse');

    let isLighting = false;
    let currentId: string | null = null;
    let particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    this.game.events.on('show-firecracker', (id: string) => {
      if (particleEmitter) { particleEmitter.stop(); particleEmitter.destroy(); }
      currentId = id;
      fcSprite.setTexture(id);

      const maxVisualSize = 200;
      const scaleRaw = Math.min(maxVisualSize / fcSprite.width, maxVisualSize / fcSprite.height);
      fcSprite.setScale(scaleRaw);

      fcSprite.setVisible(true);
      fcSprite.setPosition(centerX, centerY);
      fcSprite.setRotation(0);
      isLighting = false;

      // No switch sound needed — each ignition plays its own sound

      // reposition fuse roughly based on placeholder shape
      if (id === 'patas') { fuseZone.setPosition(centerX - 30, centerY - 50); }
      else if (id === 'flowerpot') { fuseZone.setPosition(centerX, centerY - 60); }
      else if (id === 'chakkaram') { fuseZone.setPosition(centerX + 50, centerY); }
      else if (id === 'rocket') { fuseZone.setPosition(centerX, centerY + 70); }
      else if (id === 'bomb') { fuseZone.setPosition(centerX, centerY - 50); }
      else if (id === 'mega') { fuseZone.setPosition(centerX, centerY - 60); }
      else if (id === 'Time Bomb') { fuseZone.setPosition(centerX, centerY - 50); }
      else if (id === 'Nuce') { fuseZone.setPosition(centerX, centerY - 60); }
    });

    this.game.events.on('hide-firecracker', () => {
      fcSprite.setVisible(false);
      currentId = null;
    });

    this.game.events.on('enter-lighting-mode', () => {
      isLighting = true;
    });

    // gameobjectdown listener removed to allow clicking anywhere to ignite

    // --- INDIVIDUAL FIRECRACKER ANIMATIONS ---
    const playChakkaramAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      const scene = this;

      // Initial 3D-ish metallic feel 
      sprite.setTint(0xffffee);

      // Phase 1: Fuse Lighting
      const fuseEmitter = scene.add.particles(cx + (sprite.displayWidth / 2), cy, 'spark', {
        speed: { min: 20, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        lifespan: 300,
        blendMode: 'ADD',
        tint: [0xffaa00, 0xff4500]
      });

      playSound('chakkaram', { volume: 0.9 });

      // Tweens the fuse to center
      scene.tweens.add({
        targets: fuseEmitter,
        x: cx,
        y: cy,
        duration: 1500,
        ease: 'Linear'
      });

      scene.time.delayedCall(1500, () => {
        fuseEmitter.stop();

        // Phase 2: Ignition & Spin Start



        // Phase 3: Main Spin - Intense glowing rings
        const redRing = scene.add.particles(cx, cy, 'spark', {
          speed: 150,
          angle: { min: 0, max: 360 },
          scale: { start: 1.5, end: 0 },
          lifespan: 800,
          blendMode: 'ADD',
          tint: 0xff0000,
          frequency: 15
        });

        const orangeRing = scene.add.particles(cx, cy, 'spark', {
          speed: 250,
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          lifespan: 600,
          blendMode: 'ADD',
          tint: 0xff8c00,
          frequency: 10
        });

        const goldRing = scene.add.particles(cx, cy, 'spark', {
          speed: 400,
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          lifespan: 500,
          blendMode: 'ADD',
          tint: [0xffd700, 0xffff00],
          frequency: 5
        });

        // Ground smoke
        const groundSmoke = scene.add.particles(cx, cy + 20, 'spark', {
          speed: { min: 20, max: 100 },
          angle: { min: 180, max: 360 },
          scale: { start: 2, end: 6 },
          lifespan: 2000,
          alpha: { start: 0.4, end: 0 },
          tint: 0x888888,
          frequency: 40
        });

        // Store emitters so they can be properly killed if sequence is interrupted
        sprite.setData('activeEmitters', [fuseEmitter, redRing, orangeRing, goldRing, groundSmoke]);

        scene.tweens.add({
          targets: sprite,
          rotation: Math.PI * 60, // spins incredibly fast!
          duration: 4500,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            // Phase 4: Climax & Final Burst
            redRing.stop();
            orangeRing.stop();
            goldRing.stop();
            groundSmoke.stop();

            sprite.setVisible(false);

            // Chakkaram blast (sound already looping from fuse – let it finish naturally)
            scene.cameras.main.shake(1000, 0.02);

            // Screen flash
            const flash = scene.add.circle(cx, cy, 10, 0xffffff);
            flash.setBlendMode(Phaser.BlendModes.ADD);
            scene.tweens.add({ targets: flash, alpha: 0, scale: 80, duration: 300, onComplete: () => flash.destroy() });



            // Text banner
            scene.time.delayedCall(1000, () => {
              setCelebrationMessage("What a Spin! Subha Avuruddak!");
              setTimeout(() => setCelebrationMessage(""), 4000);
            });

            // Reset sprite for reuse
            scene.time.delayedCall(3000, () => {
              if (sprite.texture.key === 'chakkaram') {
                sprite.clearTint();
                sprite.setPosition(cx, cy);
                sprite.setRotation(0);
                sprite.setVisible(true);
              }
            });
          }
        });

        // Wobble Effect while spinning
        scene.tweens.add({
          targets: sprite,
          x: cx + 2,
          y: cy + 2,
          yoyo: true,
          repeat: 90, // duration roughly matches 4500ms
          duration: 25,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            // Safe fallback if it lands off center
            if (sprite.texture.key === 'chakkaram') sprite.setPosition(cx, cy);
          }
        });
      });
    };

    const playRocketAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      const scene = this;
      const isDesktop = window.innerWidth >= 1024;
      const targetY = isDesktop ? 100 : 50;

      // Phase 1: Fuse Lighting
      const fuseEmitter = scene.add.particles(cx, cy + (sprite.displayHeight / 2), 'spark', {
        speed: { min: 50, max: 150 },
        angle: { min: 250, max: 290 },
        scale: { start: 0.8, end: 0 },
        lifespan: 400,
        blendMode: 'ADD',
        tint: [0xffaa00, 0xff4500]
      });

      const fuseSmoke = scene.add.particles(cx, cy + (sprite.displayHeight / 2), 'spark', {
        speed: { min: 20, max: 50 },
        angle: { min: 200, max: 340 },
        scale: { start: 1, end: 3 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 800,
        tint: 0xcccccc
      });

      playSound('rocket', { volume: 0.95 });

      scene.time.delayedCall(1200, () => {
        fuseEmitter.stop();
        fuseSmoke.stop();

        // Phase 2 & 3: Launch and Flight Phase
        // Rocket is already playing from fuse phase

        const offset = sprite.displayHeight / 2;

        const thrustEmitter = scene.add.particles(0, 0, 'spark', {
          speed: { min: 200, max: 500 },
          angle: { min: 80, max: 100 },
          scale: { start: 2, end: 0 },
          lifespan: 300,
          blendMode: 'ADD',
          tint: [0xffff00, 0xffaa00, 0xff0000]
        });

        const smokeEmitter = scene.add.particles(0, 0, 'spark', {
          speed: { min: 50, max: 100 },
          angle: { min: 80, max: 100 },
          scale: { start: 3, end: 8 },
          lifespan: 1200,
          alpha: { start: 0.6, end: 0 },
          tint: 0xffffff
        });

        const trailEmitter = scene.add.particles(0, 0, 'spark', {
          speed: { min: 50, max: 150 },
          angle: { min: 80, max: 100 },
          scale: { start: 1.5, end: 0 },
          lifespan: 700,
          blendMode: 'ADD',
          tint: [0xff0000, 0xff8c00, 0xffff00]
        });

        const sideSparks = scene.add.particles(0, 0, 'spark', {
          speed: { min: 100, max: 300 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0 },
          lifespan: 500,
          blendMode: 'ADD',
          tint: [0xffffff, 0xffaa00],
          frequency: 50
        });

        // Store emitters so they can be securely wiped upon early restart
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
            // Phase 4: Climax Explosion
            sprite.setVisible(false);
            thrustEmitter.stop();
            smokeEmitter.stop();
            trailEmitter.stop();
            sideSparks.stop();

            // Explosion handled by rocket.MP3 continuing
            scene.cameras.main.shake(1000, 0.03);

            const flash = scene.add.circle(sprite.x, sprite.y, 10, 0xffffff);
            flash.setBlendMode(Phaser.BlendModes.ADD);
            scene.tweens.add({ targets: flash, alpha: 0, scale: 50, duration: 300, onComplete: () => flash.destroy() });

            // PRIMARY EXPLOSION
            scene.add.particles(sprite.x, sprite.y, 'spark', {
              speed: { min: 100, max: 500 },
              angle: { min: 0, max: 360 },
              scale: { start: 2, end: 0 },
              lifespan: 10000,
              blendMode: 'ADD',
              tint: [0xffd700, 0xff0000, 0xffff00, 0xff8c00],
              maxParticles: 400
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
                maxParticles: 40
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
                maxParticles: 300
              });
            });

            scene.add.particles(sprite.x, sprite.y, 'spark', {
              speed: { min: 50, max: 150 },
              angle: { min: 0, max: 360 },
              scale: { start: 3, end: 8 },
              alpha: { start: 0.4, end: 0 },
              lifespan: 10000,
              tint: 0x444444,
              maxParticles: 60
            });

            scene.add.particles(sprite.x, sprite.y, 'spark', {
              speed: { min: 50, max: 200 },
              angle: { min: 0, max: 360 },
              scale: { start: 1.2, end: 0 },
              lifespan: 10000,
              gravityY: 30, // Reduced from 150 so it drifts down beautifully over 10s
              blendMode: 'ADD',
              tint: [0xffaa00, 0xff4500, 0xffffff],
              maxParticles: 200
            });

            // Phase 5: After Effects text shown a bit later to match long explosion
            scene.time.delayedCall(4000, () => {
              setCelebrationMessage("Subha Avuruddak! What a Rocket!");
              setTimeout(() => setCelebrationMessage(""), 5000);
            });

            // Phase 6: Reset
            scene.time.delayedCall(10000, () => {
              if (sprite.texture.key === 'rocket') {
                sprite.clearTint();
                sprite.setPosition(cx, cy);
                sprite.setRotation(0);
                sprite.setVisible(true);
              }
            });
          }
        });
      });
    };

    const playBombAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number, baseScale: number = 1) => {
      const activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
      sprite.setData('activeEmitters', activeEmitters);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const t = (count: number) => isMobile ? Math.ceil(count * 0.4) : count;

      // Phase 1: Thick slow fuse
      const fuseX = cx - 50; 
      const fuseY = cy - 60; // Approximate top/fuse area of the bomb sprite 
      
      const fuseSparks = this.add.particles(fuseX, fuseY, 'spark', {
        speed: { min: 80, max: 250 },
        angle: { min: 220, max: 320 }, // Shooting up and leftwards
        scale: { start: 1.2, end: 0 },
        lifespan: { min: 200, max: 400 },
        frequency: isMobile ? 40 : 20,
        blendMode: 'ADD',
        tint: [0xffaa00, 0xff4500, 0xffffff]
      });
      activeEmitters.push(fuseSparks);

      const fuseSmoke = this.add.particles(fuseX, fuseY, 'spark', {
        speed: { min: 20, max: 80 },
        angle: { min: 220, max: 320 },
        scale: { start: 1, end: 4 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 1000,
        frequency: isMobile ? 80 : 40,
        tint: 0x555555
      });
      activeEmitters.push(fuseSmoke);

      playSound('bomb', { volume: 1.0 });

      // Animate fuse burning down to the center over 2.5s
      this.tweens.add({
        targets: [fuseSparks, fuseSmoke],
        x: cx,
        y: cy,
        duration: 2500,
        ease: 'Linear',
      });

      // Swelling slightly to build tension
      this.tweens.add({
        targets: sprite,
        scale: baseScale * 1.05,
        yoyo: true,
        repeat: -1,
        duration: 200,
      });

      this.time.delayedCall(2500, () => {
        fuseSparks.stop();
        fuseSmoke.stop();
        sprite.setVisible(false);
        this.tweens.killTweensOf(sprite);

        // Phase 2: Massive Explosion
        this.cameras.main.shake(3000, 0.05); // Very strong & prolonged
        // bomb.mp3 continues playing through the explosion

        // Bright intense yellow-orange flash filling entire screen
        const flash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xffaa00);
        flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(100);
        
        // Flash fades quickly into slightly less bright then disappears
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 1000, // 1 second flash
          ease: 'Cubic.easeOut',
          onComplete: () => flash.destroy()
        });

        // Massive spherical blast particles
        const mainBurst = this.add.particles(cx, cy, 'spark', {
          speed: { min: 300, max: 1500 },
          angle: { min: 0, max: 360 },
          scale: { start: 3, end: 0 },
          lifespan: { min: 800, max: 2000 },
          quantity: t(400),
          blendMode: 'ADD',
          tint: [0xff0000, 0xff4500, 0xffaa00, 0xffff00]
        });
        activeEmitters.push(mainBurst);
        this.time.delayedCall(150, () => mainBurst.stop());

        // Shockwaves
        for (let s = 0; s < 3; s++) {
          this.time.delayedCall(s * 150, () => {
            const shockwave = this.add.particles(cx, cy, 'spark', {
              speed: { min: 800 + s * 200, max: 1200 + s * 200 },
              angle: { min: 0, max: 360 },
              scale: { start: 2 - (s * 0.5), end: 0 },
              lifespan: 600,
              quantity: t(150),
              blendMode: 'ADD',
              tint: [0xffaa00, 0xff4500]
            });
            activeEmitters.push(shockwave);
            this.time.delayedCall(100, () => shockwave.stop());
          });
        }

        // Fiery debris flying far
        const debris = this.add.particles(cx, cy, 'spark', {
          speed: { min: 400, max: 1800 },
          angle: { min: 0, max: 360 },
          gravityY: 400,
          scale: { start: 1.5, end: 0 },
          lifespan: { min: 1000, max: 2500 },
          quantity: t(100),
          blendMode: 'ADD',
          tint: [0xffffff, 0xffff00, 0xffaa00]
        });
        activeEmitters.push(debris);
        this.time.delayedCall(200, () => debris.stop());

        // Phase 3: After Effects
        this.time.delayedCall(500, () => {
          // Thick dark smoke rising
          const thickSmoke = this.add.particles(cx, cy + 50, 'spark', {
            speedX: { min: -150, max: 150 },
            speedY: { min: -200, max: -50 },
            scale: { start: 3, end: 10 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 3000, max: 5000 },
            frequency: isMobile ? 60 : 30,
            tint: [0x222222, 0x444444, 0x111111]
          });
          activeEmitters.push(thickSmoke);

          // Embers raining 
          const embers = this.add.particles(cx, cy - 100, 'spark', {
            speedX: { min: -300, max: 300 },
            speedY: { min: -200, max: 50 },
            gravityY: 150,
            scale: { start: 1, end: 0 },
            lifespan: { min: 2000, max: 4000 },
            frequency: isMobile ? 40 : 20,
            blendMode: 'ADD',
            tint: [0xff4500, 0xffaa00]
          });
          activeEmitters.push(embers);

          // Ground dust
          const groundDust = this.add.particles(cx, cy + 100, 'spark', {
            speedX: { min: -400, max: 400 },
            speedY: { min: -100, max: 0 },
            gravityY: 300,
            scale: { start: 2, end: 5 },
            alpha: { start: 0.4, end: 0 },
            lifespan: { min: 1500, max: 2500 },
            quantity: t(100),
            tint: 0x554433
          });
          activeEmitters.push(groundDust);
          this.time.delayedCall(200, () => groundDust.stop());

          this.time.delayedCall(4500, () => {
            thickSmoke.stop();
            embers.stop();
          });
        });

        this.time.delayedCall(1500, () => {
          setCelebrationMessage(Math.random() > 0.5 ? "MASSIVE BLAST!" : "BOOOOOOM!!! 🔥");
          setTimeout(() => setCelebrationMessage(""), 3500);
        });

        // Reset
        this.time.delayedCall(6500, () => {
          sprite.clearTint();
          sprite.setPosition(cx, cy);
          sprite.setRotation(0);
          sprite.setScale(baseScale);
          sprite.setAlpha(1);
          sprite.setVisible(true);
        });
      });
    };

    /** Big Pattas (Shop: `flowerpot`) — heavy-duty fuse + huge festive blast; mobile uses reduced particle counts. */
    const playBigPattasAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number, baseScale: number = 1) => {
      const activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
      sprite.setData('activeEmitters', activeEmitters);
      playSound('bigpatas', { volume: 1.0 });
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const pq = (n: number) => Math.max(8, Math.floor(n * (mobile ? 0.55 : 1)));

      // Phase 1: Slower, thicker fuse — intense orange sparks + smoke (2s tension)
      const fuseFlare = this.add.particles(cx - 120, cy - 46, 'spark', {
        speed: { min: 90, max: 200 },
        angle: { min: 335, max: 385 },
        scale: { start: 1.35, end: 0.2 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 200, max: 380 },
        quantity: pq(9),
        frequency: mobile ? 28 : 26,
        blendMode: 'ADD',
        tint: [0xfff0ac, 0xff9f2f, 0xff4f00, 0xffcc66]
      });
      activeEmitters.push(fuseFlare);

      const fuseThick = this.add.particles(cx - 118, cy - 44, 'spark', {
        speed: { min: 40, max: 120 },
        angle: { min: 330, max: 390 },
        scale: { start: 0.75, end: 0 },
        lifespan: { min: 280, max: 420 },
        quantity: pq(4),
        frequency: 45,
        blendMode: 'ADD',
        tint: [0xff7800, 0xffaa55]
      });
      activeEmitters.push(fuseThick);

      const fuseSmoke = this.add.particles(cx - 120, cy - 42, 'spark', {
        speedX: { min: -22, max: 22 },
        speedY: { min: -52, max: -12 },
        scale: { start: 1.35, end: 2.8 },
        alpha: { start: 0.35, end: 0 },
        lifespan: { min: 800, max: 1300 },
        frequency: mobile ? 80 : 65,
        maxParticles: mobile ? 22 : 32,
        blendMode: 'NORMAL',
        tint: [0x5a5a5a, 0x7a7a7a]
      });
      activeEmitters.push(fuseSmoke);

      this.tweens.add({
        targets: [fuseFlare, fuseThick, fuseSmoke],
        x: cx - 8,
        y: cy - 10,
        duration: 1950,
        ease: 'Cubic.easeInOut',
      });

      this.tweens.add({
        targets: sprite,
        scale: { from: baseScale, to: baseScale * 1.1 },
        yoyo: true,
        repeat: 16,
        duration: 115,
        ease: 'Sine.easeInOut',
      });

      this.time.delayedCall(2000, () => {
        fuseFlare.stop();
        fuseThick.stop();
        fuseSmoke.stop();

        // bigpatas.mp3 started at fuse – continues into explosion

        const flashW = Math.max(this.scale.width, this.scale.height) * (mobile ? 1.1 : 1.35);
        const flashH = Math.max(this.scale.width, this.scale.height) * (mobile ? 0.95 : 1.15);
        const flash = this.add.rectangle(cx, cy, flashW, flashH, 0xfff8d0, 0.92).setDepth(95);
        flash.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 280,
          ease: 'Cubic.easeOut',
          onComplete: () => flash.destroy(),
        });

        sprite.setVisible(false);
        this.cameras.main.shake(mobile ? 420 : 620, mobile ? 0.019 : 0.028, true);

        const megaBurst = this.add.particles(cx, cy, 'spark', {
          speed: { min: 280, max: 1180 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.1, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 620, max: 1550 },
          quantity: pq(320),
          blendMode: 'ADD',
          tint: [0xff1515, 0xff6600, 0xffc400, 0xffee99, 0xfff5c8],
          emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 32) } as Phaser.Types.GameObjects.Particles.EmitZoneData
        });
        activeEmitters.push(megaBurst);

        const ringOne = this.add.particles(cx, cy, 'spark', {
          speed: { min: 380, max: 560 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.55, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 720,
          quantity: pq(110),
          blendMode: 'ADD',
          tint: [0xffee9d, 0xff8d1f]
        });
        activeEmitters.push(ringOne);

        const ringTwo = this.add.particles(cx, cy, 'spark', {
          speed: { min: 560, max: 760 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.15, end: 0 },
          alpha: { start: 0.95, end: 0 },
          lifespan: 580,
          quantity: pq(140),
          blendMode: 'ADD',
          tint: [0xfff7ca, 0xffb749]
        });
        activeEmitters.push(ringTwo);

        this.time.delayedCall(60, () => {
          const ringThree = this.add.particles(cx, cy, 'spark', {
            speed: { min: 680, max: 920 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.85, end: 0 },
            lifespan: 480,
            quantity: pq(100),
            blendMode: 'ADD',
            tint: [0xffe8a0, 0xffaa33]
          });
          activeEmitters.push(ringThree);
          this.time.delayedCall(380, () => ringThree.stop());
        });

        const upwardJets = this.add.particles(cx, cy + 10, 'spark', {
          speed: { min: 420, max: 980 },
          angle: { min: 240, max: 300 },
          gravityY: 130,
          scale: { start: 1.35, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 560, max: 1280 },
          quantity: pq(90),
          blendMode: 'ADD',
          tint: [0xfff7bc, 0xffa12d, 0xff3a12]
        });
        activeEmitters.push(upwardJets);

        const outwardShell = this.add.particles(cx, cy, 'spark', {
          speed: { min: 300, max: 1020 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.6, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 500, max: 1200 },
          quantity: pq(200),
          blendMode: 'ADD',
          tint: [0xff2200, 0xff8800, 0xffdd55]
        });
        activeEmitters.push(outwardShell);

        this.time.delayedCall(380, () => {
          megaBurst.stop();
          ringOne.stop();
          ringTwo.stop();
          upwardJets.stop();
          outwardShell.stop();
        });

        // Phase 3: Embers rain + smoke + ground dust (3–4s)
        this.time.delayedCall(300, () => {
          const emberRain = this.add.particles(cx, cy - 50, 'spark', {
            speedX: { min: -200, max: 200 },
            speedY: { min: -70, max: 50 },
            gravityY: 220,
            scale: { start: 1, end: 0.06 },
            alpha: { start: 0.92, end: 0 },
            lifespan: { min: 1800, max: 3400 },
            frequency: mobile ? 22 : 14,
            maxParticles: mobile ? 110 : 190,
            blendMode: 'ADD',
            tint: [0xfff2be, 0xffbe5f, 0xff6e1f]
          });
          activeEmitters.push(emberRain);

          const thickSmoke = this.add.particles(cx, cy + 12, 'spark', {
            speedX: { min: -50, max: 50 },
            speedY: { min: -110, max: -40 },
            scale: { start: 2, end: 4.2 },
            alpha: { start: 0.36, end: 0 },
            lifespan: { min: 2400, max: 3800 },
            frequency: mobile ? 100 : 88,
            maxParticles: mobile ? 26 : 36,
            blendMode: 'NORMAL',
            tint: [0x454545, 0x6a6a6a, 0x888888]
          });
          activeEmitters.push(thickSmoke);

          const groundDust = this.add.particles(cx, cy + 70, 'spark', {
            speedX: { min: -190, max: 190 },
            speedY: { min: -130, max: -40 },
            gravityY: 210,
            scale: { start: 1.1, end: 2.6 },
            alpha: { start: 0.42, end: 0 },
            lifespan: { min: 950, max: 1750 },
            quantity: pq(95),
            blendMode: 'NORMAL',
            tint: [0x7a6a57, 0x8f7d66, 0x6b5c4a]
          });
          activeEmitters.push(groundDust);

          this.time.delayedCall(3600, () => {
            emberRain.stop();
            thickSmoke.stop();
            groundDust.stop();
          });
        });

        this.time.delayedCall(480, () => {
          setCelebrationMessage(Math.random() > 0.5 ? "BOOM! What a Big Patas!" : "Mega Blast! 🔥");
          setTimeout(() => setCelebrationMessage(""), 2400);
        });

        // Total ~5.6s from ignite → reset
        this.time.delayedCall(5600, () => {
          sprite.clearTint();
          sprite.setPosition(cx, cy);
          sprite.setScale(baseScale);
          sprite.setRotation(0);
          sprite.setAlpha(1);
          sprite.setVisible(true);
        });
      });
    };

    const playPatasAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      const activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
      sprite.setData('activeEmitters', activeEmitters);
      playSound('patas', { volume: 0.9 });

      // Phase 1: Quick fuse race (about 1 second)
      const fuseSpark = this.add.particles(cx - 110, cy - 40, 'spark', {
        speed: { min: 180, max: 360 },
        angle: { min: 340, max: 380 },
        scale: { start: 0.75, end: 0 },
        alpha: { start: 1, end: 0.1 },
        lifespan: { min: 120, max: 220 },
        quantity: 5,
        frequency: 25,
        blendMode: 'ADD',
        tint: [0xfff4a3, 0xffc14a, 0xff6a00]
      });
      activeEmitters.push(fuseSpark);

      this.tweens.add({
        targets: fuseSpark,
        x: cx - 8,
        y: cy - 8,
        duration: 950,
        ease: 'Cubic.easeIn',
      });

      this.tweens.add({
        targets: sprite,
        angle: { from: -2, to: 2 },
        yoyo: true,
        repeat: 8,
        duration: 55,
      });

      this.time.delayedCall(1000, () => {
        fuseSpark.stop();

        // Phase 2: Sharp flash + burst + ring + impact shake
        const flash = this.add.circle(cx, cy, 8, 0xfff2a8, 0.95).setDepth(80);
        this.tweens.add({
          targets: flash,
          radius: 260,
          alpha: 0,
          duration: 130,
          ease: 'Quad.easeOut',
          onComplete: () => flash.destroy(),
        });

        this.cameras.main.shake(180, 0.011, true);
        sprite.setVisible(false);

        const burst = this.add.particles(cx, cy, 'spark', {
          speed: { min: 260, max: 820 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 380, max: 900 },
          quantity: 170,
          blendMode: 'ADD',
          tint: [0xff2a2a, 0xff6a00, 0xffc533, 0xfff0a8]
        });
        activeEmitters.push(burst);

        const shockRing = this.add.particles(cx, cy, 'spark', {
          speed: { min: 420, max: 540 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.95, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 460,
          quantity: 55,
          blendMode: 'ADD',
          tint: [0xfff4a3, 0xff8a00]
        });
        activeEmitters.push(shockRing);

        // Premium glow trails
        const trail = this.add.particles(cx, cy, 'spark', {
          speed: { min: 220, max: 640 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0.25 },
          alpha: { start: 0.95, end: 0 },
          lifespan: { min: 700, max: 1150 },
          quantity: 45,
          blendMode: 'ADD',
          tint: [0xff4f2f, 0xffb14f, 0xfff1c7]
        });
        activeEmitters.push(trail);

        this.time.delayedCall(200, () => {
          burst.stop();
          shockRing.stop();
          trail.stop();
        });

        // Phase 3: Falling embers + smoke (1.5-2s)
        this.time.delayedCall(220, () => {
          const embers = this.add.particles(cx, cy - 12, 'spark', {
            speedX: { min: -70, max: 70 },
            speedY: { min: -100, max: 40 },
            gravityY: 150,
            scale: { start: 0.65, end: 0.05 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 900, max: 1700 },
            frequency: 32,
            maxParticles: 80,
            blendMode: 'ADD',
            tint: [0xfff3be, 0xffbc52, 0xff7a24]
          });
          activeEmitters.push(embers);

          const smoke = this.add.particles(cx, cy + 4, 'spark', {
            speedX: { min: -22, max: 22 },
            speedY: { min: -74, max: -28 },
            scale: { start: 1.25, end: 2.1 },
            alpha: { start: 0.28, end: 0 },
            lifespan: { min: 1200, max: 1900 },
            frequency: 90,
            maxParticles: 20,
            blendMode: 'NORMAL',
            tint: [0x5f5f5f, 0x8c8c8c]
          });
          activeEmitters.push(smoke);

          this.time.delayedCall(1800, () => {
            embers.stop();
            smoke.stop();
          });
        });

        // Celebration text for the Small Patas moment
        this.time.delayedCall(380, () => {
          setCelebrationMessage(Math.random() > 0.5 ? "Paataaas! 🔥" : "Subha Avuruddak!");
          setTimeout(() => setCelebrationMessage(""), 1700);
        });

        // Reset for replay
        this.time.delayedCall(2600, () => {
          sprite.clearTint();
          sprite.setPosition(cx, cy);
          sprite.setRotation(0);
          sprite.setAlpha(1);
          sprite.setVisible(true);
        });
      });
    };

    const playMegaAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      const activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
      sprite.setData('activeEmitters', activeEmitters);

      // Make the sprite shake slightly while fuse is burning
      this.tweens.add({
        targets: sprite,
        angle: { from: -2, to: 2 },
        yoyo: true,
        repeat: 18,
        duration: 80,
      });

      // Phase 1: Multiple fuses burning at different speeds
      const fuseOffsets = [
        { x: -20, y: -40, speed: 1200 },
        { x: 0, y: -45, speed: 1500 },
        { x: 20, y: -38, speed: 1000 },
        { x: -10, y: -42, speed: 1300 },
        { x: 10, y: -35, speed: 1100 }
      ];

      fuseOffsets.forEach((offset) => {
        const fuseSpark = this.add.particles(cx + offset.x, cy + offset.y, 'spark', {
          speed: { min: 50, max: 150 },
          angle: { min: 250, max: 290 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 100, max: 200 },
          frequency: 30,
          blendMode: 'ADD',
          tint: [0xffaa00, 0xff4500, 0xffffff]
        });
        activeEmitters.push(fuseSpark);

        this.tweens.add({
          targets: fuseSpark,
          x: cx,
          y: cy,
          duration: offset.speed,
          ease: 'Linear',
        });
      });

      // Mega pack uses bigpatas as its closest sound effect
      playSound('bigpatas', { volume: 1.0 });

      this.time.delayedCall(1500, () => {
        // Phase 2: Build-up small pops
        activeEmitters.forEach(e => {
          if (e.blendMode === Phaser.BlendModes.ADD) e.stop(); // Stop fuse sparks
        });

        // Small build-up pops – sound continues from fuse
        
        // Small isolated pops
        for (let i = 0; i < 4; i++) {
          this.time.delayedCall(i * 150, () => {
            const px = cx + Phaser.Math.Between(-30, 30);
            const py = cy + Phaser.Math.Between(-20, 20);
            const pop = this.add.particles(px, py, 'spark', {
              speed: { min: 100, max: 300 },
              scale: { start: 0.8, end: 0 },
              lifespan: 300,
              blendMode: 'ADD',
              tint: [0xffffff, 0xffaa00]
            });
            activeEmitters.push(pop);
            this.time.delayedCall(100, () => pop.stop());
            this.cameras.main.shake(100, 0.005);
          });
        }

        // Phase 3: Main Mega Explosion
        this.time.delayedCall(800, () => {
          sprite.setVisible(false);
          this.cameras.main.shake(2500, 0.04);
          // bigpatas.mp3 continues through full mega explosion

          // Flash
          const flash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xffeedd);
          flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(90);
          this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

          // Multiple overlapping explosions
          for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 100 + Phaser.Math.Between(0, 50), () => {
              const ex = cx + Phaser.Math.Between(-60, 60);
              const ey = cy + Phaser.Math.Between(-60, 20);
              const burst = this.add.particles(ex, ey, 'spark', {
                speed: { min: 300, max: 800 },
                angle: { min: 0, max: 360 },
                scale: { start: 1.5, end: 0 },
                lifespan: { min: 400, max: 800 },
                blendMode: 'ADD',
                quantity: 80,
                tint: [0xff0000, 0xff8c00, 0xffd700, 0xffff00, 0xffffff]
              });
              activeEmitters.push(burst);
              this.time.delayedCall(150, () => burst.stop());
            });
          }

          // Dense central chaotic burst
          const massiveBurst = this.add.particles(cx, cy, 'spark', {
            speed: { min: 200, max: 1200 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: { min: 600, max: 1500 },
            frequency: 10,
            blendMode: 'ADD',
            tint: [0xff1100, 0xff6600, 0xffcc00, 0xffeeaa],
            maxParticles: 400
          });
          activeEmitters.push(massiveBurst);

          // Shockwaves
          for (let s = 0; s < 3; s++) {
            this.time.delayedCall(s * 200, () => {
              const ring = this.add.particles(cx, cy, 'spark', {
                speed: { min: 600, max: 1000 },
                angle: { min: 0, max: 360 },
                scale: { start: 1.2, end: 0 },
                lifespan: 500,
                quantity: 100,
                blendMode: 'ADD',
                tint: [0xffddaa, 0xff6600]
              });
              activeEmitters.push(ring);
              this.time.delayedCall(100, () => ring.stop());
            });
          }

          // Mini rockets (small patas shooting up)
          for (let m = 0; m < 5; m++) {
            this.time.delayedCall(m * 150, () => {
              const rx = cx + Phaser.Math.Between(-40, 40);
              const ry = cy;
              const rocketSpark = this.add.particles(rx, ry, 'spark', {
                speed: { min: 300, max: 600 },
                angle: { min: 240, max: 300 },
                scale: { start: 1, end: 0 },
                lifespan: 400,
                blendMode: 'ADD',
                tint: 0xffffaa
              });
              activeEmitters.push(rocketSpark);
              
              // Air pop
              this.time.delayedCall(300 + Phaser.Math.Between(0, 100), () => {
                rocketSpark.stop();
                const tx = rx + Phaser.Math.Between(-30, 30);
                const ty = ry - 150 - Phaser.Math.Between(0, 50);
                const airPop = this.add.particles(tx, ty, 'spark', {
                  speed: { min: 200, max: 400 },
                  scale: { start: 1.2, end: 0 },
                  lifespan: 400,
                  quantity: 40,
                  blendMode: 'ADD',
                  tint: [0xffffff, 0xff0000, 0xffcc00]
                });
                activeEmitters.push(airPop);
                this.time.delayedCall(100, () => airPop.stop());
              });
            });
          }

          // Phase 4: After Effects
          this.time.delayedCall(1000, () => {
            massiveBurst.stop();

            // Long rain of glowing embers
            const embersRain = this.add.particles(cx, cy - 100, 'spark', {
              speedX: { min: -250, max: 250 },
              speedY: { min: -100, max: 50 },
              gravityY: 150,
              scale: { start: 0.8, end: 0 },
              lifespan: { min: 1500, max: 3000 },
              frequency: 20,
              blendMode: 'ADD',
              tint: [0xffcc00, 0xff6600, 0xff2200]
            });
            activeEmitters.push(embersRain);

            // Thick smoke
            const thickSmoke = this.add.particles(cx, cy + 20, 'spark', {
              speedX: { min: -100, max: 100 },
              speedY: { min: -150, max: -50 },
              scale: { start: 2, end: 6 },
              alpha: { start: 0.5, end: 0 },
              lifespan: { min: 2000, max: 4000 },
              frequency: 50,
              blendMode: 'NORMAL',
              tint: [0x444444, 0x666666, 0x888888]
            });
            activeEmitters.push(thickSmoke);

            // Small delayed pops continuing
            for (let d = 0; d < 6; d++) {
              this.time.delayedCall(d * 400 + Phaser.Math.Between(0, 200), () => {
                // Delayed pop – sound continues
                const popx = cx + Phaser.Math.Between(-80, 80);
                const popy = cy + Phaser.Math.Between(-40, 40);
                const pop = this.add.particles(popx, popy, 'spark', {
                  speed: { min: 100, max: 300 },
                  scale: { start: 1, end: 0 },
                  lifespan: 300,
                  quantity: 20,
                  blendMode: 'ADD',
                  tint: [0xffaa00, 0xffffff]
                });
                activeEmitters.push(pop);
                this.time.delayedCall(100, () => pop.stop());
              });
            }

            // Stop effects after a while
            this.time.delayedCall(4000, () => {
              embersRain.stop();
              thickSmoke.stop();
            });
          });
          
          this.time.delayedCall(2000, () => {
            setCelebrationMessage(Math.random() > 0.5 ? "MEGA BLAST! 🔥🔥🔥" : "What a Mega Pack!");
            setTimeout(() => setCelebrationMessage(""), 3000);
          });

          // Reset
          this.time.delayedCall(7000, () => {
            sprite.clearTint();
            sprite.setPosition(cx, cy);
            sprite.setRotation(0);
            sprite.setAlpha(1);
            sprite.setVisible(true);
          });
        });
      });
    };

    const playTimeBombAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number, baseScale: number = 1) => {
      const activeEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
      sprite.setData('activeEmitters', activeEmitters);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const t = (count: number) => isMobile ? Math.ceil(count * 0.4) : count;

      // Phase 1: Fuse Lighting (2 seconds)
      const fuseX = cx; 
      const fuseY = cy - 60; // Top of the bomb
      
      const fuseSparks = this.add.particles(fuseX, fuseY, 'spark', {
        speed: { min: 50, max: 150 },
        angle: { min: 250, max: 290 }, 
        scale: { start: 1, end: 0 },
        lifespan: { min: 200, max: 300 },
        frequency: 30,
        blendMode: 'ADD',
        tint: [0xffaa00, 0xff4500, 0xffffff]
      });
      activeEmitters.push(fuseSparks);

      playSound('timebomb1', { volume: 1.0 });

      this.tweens.add({
        targets: fuseSparks,
        x: cx,
        y: cy,
        duration: 2000,
        ease: 'Linear',
      });

      this.time.delayedCall(2000, () => {
        fuseSparks.stop();
        
        // Phase 2: Tension Build-up (3 seconds ticking)
        // timebomb.mp3 continues ticking through this phase
        
        // Ticking visual effect: pulsing scale and small center spark
        this.tweens.add({
          targets: sprite,
          scale: { from: baseScale, to: baseScale * 1.15 },
          yoyo: true,
          repeat: 14, // Roughly 5 times per second for 3 seconds
          duration: 100, // Faster ticking
          ease: 'Sine.easeInOut'
        });

        // Small timer sparks
        const ticker = this.add.particles(cx, cy, 'spark', {
          speed: { min: 100, max: 200 },
          scale: { start: 1.5, end: 0 },
          lifespan: 200,
          frequency: 200, // Sync with ticking
          blendMode: 'ADD',
          tint: 0xff0000
        });
        activeEmitters.push(ticker);

        // Screen pulsing red slightly
        const tensionFlash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xff0000, 0.2);
        tensionFlash.setBlendMode(Phaser.BlendModes.ADD).setDepth(90);
        
        this.tweens.add({
          targets: tensionFlash,
          alpha: { from: 0.1, to: 0.4 },
          yoyo: true,
          repeat: -1,
          duration: 200,
        });

        this.time.delayedCall(3000, () => {
          ticker.stop();
          sprite.setVisible(false);
          this.tweens.killTweensOf(sprite);
          this.tweens.killTweensOf(tensionFlash);
          tensionFlash.destroy();

          // Phase 3: Massive Explosion (5 seconds bright red and orange screen)
          stopSound('timebomb1');
          playSound('timebomb2', { volume: 1.0 });
          this.cameras.main.shake(5000, 0.06);

          // 5-second intense full-screen flash
          const nukeFlash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xff3300, 0.8);
          nukeFlash.setBlendMode(Phaser.BlendModes.ADD).setDepth(100);

          // Render subtle flickering
          this.tweens.add({
            targets: nukeFlash,
            alpha: { from: 0.7, to: 0.9 },
            yoyo: true,
            repeat: -1,
            duration: 100,
          });

          // Massive center particles
          const massiveCore = this.add.particles(cx, cy, 'spark', {
            speed: { min: 200, max: 1500 },
            angle: { min: 0, max: 360 },
            scale: { start: 4, end: 0 },
            lifespan: { min: 1000, max: 3000 },
            frequency: 15,
            blendMode: 'ADD',
            tint: [0xff0000, 0xff4500, 0xffaa00, 0xffff00],
            maxParticles: t(800)
          });
          activeEmitters.push(massiveCore);

          // Expanding fiery shockwaves
          for (let s = 0; s < 5; s++) {
            this.time.delayedCall(s * 400, () => {
              const shock = this.add.particles(cx, cy, 'spark', {
                speed: { min: 1000 + s*200, max: 1500 + s*200 },
                angle: { min: 0, max: 360 },
                scale: { start: 3, end: 0 },
                lifespan: 800,
                quantity: t(150),
                blendMode: 'ADD',
                tint: [0xff0000, 0xff4500, 0xffaa00]
              });
              activeEmitters.push(shock);
              this.time.delayedCall(100, () => shock.stop());
            });
          }

          // Stop emitting core right before 5s
          this.time.delayedCall(4500, () => massiveCore.stop());

          // Phase 4: After Effects
          this.time.delayedCall(5000, () => {
            // Fade out the 5-sec flash
            this.tweens.killTweensOf(nukeFlash);
            this.tweens.add({
              targets: nukeFlash,
              alpha: 0,
              duration: 2000,
              ease: 'Linear',
              onComplete: () => nukeFlash.destroy()
            });

            // Thick dark smoke
            const smoke = this.add.particles(cx, cy, 'spark', {
              speed: { min: 50, max: 150 },
              angle: { min: 0, max: 360 },
              scale: { start: 5, end: 12 },
              alpha: { start: 0.8, end: 0 },
              lifespan: { min: 3000, max: 6000 },
              frequency: isMobile ? 80 : 40,
              tint: [0x111111, 0x333333, 0x222222]
            });
            activeEmitters.push(smoke);

            // Large glowing embers
            const embers = this.add.particles(cx, cy - 150, 'spark', {
              speedX: { min: -400, max: 400 },
              speedY: { min: -200, max: 100 },
              gravityY: 100,
              scale: { start: 1.5, end: 0 },
              lifespan: { min: 2500, max: 5000 },
              frequency: isMobile ? 60 : 30,
              blendMode: 'ADD',
              tint: [0xff0000, 0xff4500, 0xffaa00]
            });
            activeEmitters.push(embers);

            // Text
            setCelebrationMessage(Math.random() > 0.5 ? "TIME BOMB DETONATED!" : "MASSIVE EXPLOSION!!! 🔥");
            setTimeout(() => setCelebrationMessage(""), 4000);

            this.time.delayedCall(4000, () => {
              smoke.stop();
              embers.stop();
            });
            
            // Reset state
            this.time.delayedCall(6000, () => {
              sprite.clearTint();
              sprite.setPosition(cx, cy);
              sprite.setRotation(0);
              sprite.setScale(baseScale);
              sprite.setAlpha(1);
              sprite.setVisible(true);
            });
          });
        });
      });
    };

    const playNuclearAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number, baseScale: number) => {
      // Step 1: Fuse burning animation with sparks
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('nuclear_fuse'));

      // Step 2: Build tension
      this.tweens.add({
        targets: sprite,
        scale: baseScale * 1.5,
        rotation: 0.1,
        yoyo: true,
        repeat: -1,
        duration: 50,
      });

      playSound('nuce1', { volume: 1.0 });

      // Set timeout for 3 seconds exactly
      this.time.delayedCall(3000, () => {
        // Step 3: Nuclear Explosion flash
        if (particleEmitter) particleEmitter.stop();
        sprite.setVisible(false);

        const flash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xffffff);
        flash.setDepth(100);
        flash.setAlpha(1);

        stopSound('nuce1');
        playSound('nuce2', { volume: 1.0 });

        // Wait 1.5 seconds for flash
        this.time.delayedCall(1500, () => {
          // Fade flash
          this.tweens.add({ targets: flash, alpha: 0, duration: 1000, onComplete: () => flash.destroy() });

          // Step 4: Mushroom cloud & Shake
          particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('nuclear_blast'));
          this.cameras.main.shake(3000, 0.05);

          // Step 5: Fake Crash
          this.time.delayedCall(2000, () => {
            window.dispatchEvent(new Event('nuclear-crash'));
          });
        });
      });
    };

    const triggerFirecrackerAnimation = (id: string, sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      // Clean up orphaned instances of unlimited looping emitters and timer phases if interrupted
      const oldEmitters: any[] = sprite.getData('activeEmitters') || [];
      oldEmitters.forEach(e => e && e.destroy && e.destroy());
      sprite.setData('activeEmitters', []);
      this.time.removeAllEvents();

      // Reset state before animating
      this.tweens.killTweensOf(sprite);
      sprite.clearTint();
      sprite.setAlpha(1);
      sprite.setVisible(true);
      sprite.setPosition(cx, cy);
      sprite.setRotation(0);

      const isDesktop = window.innerWidth >= 1024;
      const maxVisualSize = isDesktop ? 400 : 200;
      const baseScale = Math.min(maxVisualSize / sprite.width, maxVisualSize / sprite.height);
      sprite.setScale(baseScale);

      switch (id) {
        case 'chakkaram': playChakkaramAnimation(sprite, cx, cy); break;
        case 'rocket': playRocketAnimation(sprite, cx, cy); break;
        case 'bomb': playBombAnimation(sprite, cx, cy, baseScale); break;
        case 'patas': playPatasAnimation(sprite, cx, cy); break;
        case 'flowerpot': playBigPattasAnimation(sprite, cx, cy, baseScale); break;
        case 'mega': playMegaAnimation(sprite, cx, cy); break;
        case 'Time Bomb': playTimeBombAnimation(sprite, cx, cy, baseScale); break;
        case 'Nuce': playNuclearAnimation(sprite, cx, cy, baseScale); break;
        default: playPatasAnimation(sprite, cx, cy); break; // fallback
      }
    };

    const igniteFirecracker = (id: string) => {
      setIsLightingMode(false); // tell react
      // Sounds are started inside each individual animation function

      // Remove 1 from inventory
      setInventory(prev => {
        const next = { ...prev };
        next[id] = Math.max(0, next[id] - 1);
        localStorage.setItem("firecrackerInventory", JSON.stringify(next));
        return next;
      });

      // Effect
      triggerFirecrackerAnimation(id, fcSprite, centerX, centerY);

      // Celebrate
      if (id !== 'Nuce' && id !== 'rocket' && id !== 'chakkaram' && id !== 'patas' && id !== 'flowerpot') {
        setTimeout(() => {
          setCelebrationMessage(`You lit a ${FIRECRACKERS.find((f: FirecrackerType) => f.id === id)?.name}!`);
          setTimeout(() => setCelebrationMessage(""), 3000);
          if (particleEmitter) particleEmitter.stop();
        }, 3500);
      }
    }

    // Resize handler
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const cx = gameSize.width / 2;
      const cy = gameSize.height / 2 + 50;
      fcSprite.setPosition(cx, cy);
      fuseZone.setPosition(cx, cy - 50); // rough reset
    });

    // Swiping & Lighting
    let startX = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      if (isLighting && currentId) {
        igniteFirecracker(currentId);
        isLighting = false;
      }
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!isLighting && !isShopOpen) {
        const diffX = pointer.x - startX;
        if (diffX > 50) handlePrev();
        else if (diffX < -50) handleNext();
      }
    });
  }

  function getParticleConfig(id: string): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
    switch (id) {
      case 'flowerpot': return { speed: { min: 200, max: 500 }, angle: { min: 240, max: 300 }, gravityY: 200, lifespan: 1500, scale: { start: 1, end: 0 }, emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, -30, 10) } as any, blendMode: 'ADD', tint: [0xffffff, 0xffff00, 0xff0000] };
      case 'chakkaram': return { speed: 300, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, lifespan: 800, blendMode: 'ADD', tint: 0xffff00 };
      case 'rocket': return { speed: 100, angle: { min: 70, max: 110 }, scale: { start: 1, end: 0 }, lifespan: 500, blendMode: 'ADD', tint: 0xffaa00, followOffset: { x: 0, y: 50 } };
      case 'bomb_explosion': return { speed: { min: 100, max: 800 }, angle: { min: 0, max: 360 }, scale: { start: 2, end: 0 }, lifespan: 1000, maxParticles: 200, blendMode: 'ADD', tint: [0xff0000, 0xffaa00, 0xffffff] };
      case 'bomb': return { speed: 50, angle: { min: -135, max: -45 }, scale: { start: 0.5, end: 0 }, lifespan: 300, blendMode: 'ADD', tint: 0xff4500 }; // fuse burning
      case 'mega': return { speed: { min: 300, max: 1000 }, angle: { min: 0, max: 360 }, scale: { start: 2, end: 0 }, lifespan: 2000, blendMode: 'ADD', frequency: 50, tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff] };
      case 'Time Bomb': return { speed: { min: 400, max: 1000 }, angle: { min: 0, max: 360 }, scale: { start: 2.5, end: 0 }, lifespan: 1500, maxParticles: 200, blendMode: 'ADD', tint: [0xff5500, 0xff0000, 0x880000] };
      case 'Nuce': return { speed: { min: 800, max: 2000 }, angle: { min: 0, max: 360 }, scale: { start: 4, end: 0 }, lifespan: 3000, blendMode: 'ADD', frequency: 10, tint: [0xffffff, 0x00ffff, 0xff00ff] };
      case 'nuclear_fuse': return { speed: { min: 100, max: 400 }, angle: { min: 0, max: 360 }, scale: { start: 1.5, end: 0 }, lifespan: 500, maxParticles: 100, blendMode: 'ADD', tint: [0xffffff, 0xffff00] };
      case 'nuclear_blast': return { speed: { min: 500, max: 2000 }, angle: { min: 0, max: 360 }, scale: { start: 8, end: 0 }, lifespan: 4000, blendMode: 'ADD', frequency: 10, tint: [0xffffffff, 0xffaa00, 0xff0000, 0x550000] };
      case 'patas': default: return { speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, lifespan: 800, maxParticles: 20, blendMode: 'ADD', tint: 0xffffff };
    }
  }

  function update(this: Phaser.Scene) {
    // Dynamic updates if needed
  }

  return (
    <div className={`fixed inset-0 bg-[#0a0a1a] overflow-hidden ${isLightingMode ? "cursor-[url('/matchstick.png'),_pointer]" : ""}`}>

      {hasCrashed && (
        <div className="absolute inset-0 z-[100] bg-red-900 flex flex-col items-center justify-center p-8 text-center" style={{ fontFamily: 'monospace' }}>
          <div className="bg-black text-red-500 p-8 border-4 border-red-600 shadow-[0_0_80px_rgba(255,0,0,0.9)] w-full max-w-4xl relative overflow-hidden">
            <h1 className="text-4xl md:text-7xl font-black mb-6 animate-pulse text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">CRITICAL FATAL ERROR</h1>
            <p className="text-xl md:text-3xl mb-8 font-bold text-white">NUCLEAR DETONATION HAS DESTROYED APPLICATION INTEGRITY.</p>
            <p className="text-sm md:text-xl text-red-400 mb-12 opacity-80">(ERR_CODE: NUCE_EXTREME_OVERLOAD_x892910)</p>

            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white border-4 border-red-300 font-black py-6 px-12 text-2xl hover:bg-white hover:text-red-600 transition-all shadow-xl"
            >
              [ REBOOT SYSTEM TO SAFE MODE ]
            </button>
          </div>
        </div>
      )}

      {/* Phaser Canvas Container */}
      <div ref={gameRef} className="absolute inset-0 z-0" style={{ cursor: isLightingMode ? 'crosshair' : 'default' }}></div>

      {/* Top Header UI */}
      <header className="absolute top-0 left-0 w-full p-4 z-10 flex items-center justify-between">
        <Link href="/games" className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-avurudu-yellow/30 flex items-center gap-2">
          <Sparkles className="text-avurudu-yellow w-5 h-5" />
          <span className="text-white font-bold text-lg">{totalPoints} KP</span>
        </div>
        <button
          onClick={() => setIsShopOpen(true)}
          className="bg-avurudu-orange hover:bg-avurudu-red transition-colors p-3 rounded-full text-white shadow-lg flex items-center justify-center relative"
        >
          <ShoppingCart className="w-6 h-6" />
        </button>
      </header>

      {/* Main Ground UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-end pb-24">
        {celebrationMessage && (
          <div className="absolute top-1/4 bg-avurudu-yellow text-avurudu-dark px-8 py-4 rounded-2xl font-black text-2xl shadow-[0_0_30px_rgba(255,215,0,0.6)] animate-bounce text-center z-20">
            {celebrationMessage}
          </div>
        )}

        {activeItemId && (
          <div className="flex flex-col items-center pointer-events-auto select-none">

            <div className="flex items-center gap-12 mb-16">
              {ownedItems.length > 1 && (
                <button onClick={handlePrev} className="bg-white/10 p-4 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all">
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              <div className="w-32"></div> {/* Spacing for the canvas object */}
              {ownedItems.length > 1 && (
                <button onClick={handleNext} className="bg-white/10 p-4 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all">
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            <div className="bg-black/50 backdrop-blur px-8 py-4 rounded-3xl border border-white/10 shadow-xl flex flex-col items-center">
              <h2 className="text-xl font-bold text-white mb-1">
                {FIRECRACKERS.find((f: FirecrackerType) => f.id === activeItemId)?.name}
              </h2>
              <div className="bg-avurudu-orange text-white text-sm font-black px-4 py-1 rounded-full mb-4">
                Owned: {inventory[activeItemId]}
              </div>

              {!isLightingMode ? (
                <button
                  onClick={activateLightingMode}
                  className="bg-gradient-to-r from-avurudu-yellow to-avurudu-orange text-black font-black text-xl px-10 py-3 rounded-full shadow-[0_0_20px_rgba(255,165,0,0.5)] hover:scale-105 transition-transform"
                >
                  LIGHT UP ✨
                </button>
              ) : (
                <div className="text-avurudu-yellow font-bold text-center animate-pulse">
                  🔥 Tap anywhere to ignite!
                </div>
              )}
            </div>
          </div>
        )}

        {!activeItemId && !isShopOpen && (
          <div className="bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center pointer-events-auto">
            <h2 className="text-3xl font-black text-white mb-2">Ground is Empty!</h2>
            <p className="text-white/70 mb-6">Open the shop to buy some firecrackers.</p>
            <button
              onClick={() => setIsShopOpen(true)}
              className="bg-avurudu-orange text-white font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              Open Shop
            </button>
          </div>
        )}
      </div>

      {/* Shop Modal */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6 overflow-hidden">
          <div className="bg-white w-full sm:max-w-2xl max-h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-avurudu-dark">Firecracker Shop</h2>
                <p className="text-sm text-gray-500 font-medium">Spend Kreeda Points to light up the night!</p>
              </div>
              <button onClick={() => setIsShopOpen(false)} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIRECRACKERS.map((item: FirecrackerType) => (
                  <div key={item.id} className="bg-white border-2 border-avurudu-yellow/20 rounded-2xl p-4 flex flex-col hover:border-avurudu-yellow transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-avurudu-yellow/20 w-32 h-32 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>

                    <div className="relative z-10 w-full flex justify-center mb-4 mt-2">
                      <img src={item.image} alt={item.name} className="h-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-avurudu-dark">{item.name}</h3>
                      <div className="bg-avurudu-orange/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-avurudu-orange" />
                        <span className="text-avurudu-orange font-bold">{item.price}</span>
                      </div>
                    </div>

                    <p className="relative z-10 text-xs text-gray-500 mb-6 flex-1">
                      A dazzling display of lights and sound. (Owned: {inventory[item.id] || 0})
                    </p>

                    <div className="relative z-10 flex gap-2 w-full mt-auto">
                      <button
                        onClick={() => buyItem(item, 1)}
                        disabled={totalPoints < item.price}
                        className={`flex-1 py-2 lg:py-3 rounded-xl font-bold transition-all shadow-sm
                              ${totalPoints >= item.price
                            ? 'bg-avurudu-dark text-white hover:bg-black hover:shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        Buy 1
                      </button>
                      <button
                        onClick={() => buyItem(item, 5)}
                        disabled={totalPoints < item.price * 5}
                        className={`px-4 py-2 lg:py-3 rounded-xl font-bold border-2 transition-all
                              ${totalPoints >= item.price * 5
                            ? 'border-avurudu-dark text-avurudu-dark hover:bg-gray-50'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        x5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center sm:rounded-b-3xl">
              <div className="flex items-center gap-2 text-gray-500">
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">Kreeda Points from other games are shared here.</span>
              </div>
              <div className="flex items-center gap-2 bg-avurudu-yellow/20 px-6 py-3 rounded-full border border-avurudu-yellow">
                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Balance</span>
                <span className="text-2xl font-black text-avurudu-dark">{totalPoints} KP</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
