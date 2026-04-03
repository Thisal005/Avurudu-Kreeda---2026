"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, ChevronRight, Sparkles, X, Info } from "lucide-react";
import { FIRECRACKERS, FirecrackerType } from "./GiniUthsawayaConfig"; // We'll create a separate config file to clean things up

export default function GiniUthsawayaGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
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

      // Optional placeholder sound play (AudioContext requires user gesture so it might warn, but placeholder is requested)
      // We skip sound object creation for now and log it per user instructions.
      console.log("Plays switch sound for", id);

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
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('chakkaram'));
      this.tweens.add({ targets: sprite, rotation: Math.PI * 10, duration: 3000, ease: 'Cubic.easeIn' });
    };

    const playRocketAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('rocket'));
      this.tweens.add({ targets: sprite, y: -200, duration: 1500, ease: 'Cubic.easeIn', delay: 500 });
    };

    const playBombAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number, baseScale: number = 1) => {
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('bomb'));
      this.tweens.add({
        targets: sprite, scale: baseScale * 1.2, yoyo: true, repeat: 5, duration: 200, onComplete: () => {
          sprite.setVisible(false);
          if (particleEmitter) particleEmitter.stop();
          particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('bomb_explosion'));
        }
      });
    };

    const playPatasAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('patas'));
      this.tweens.add({ targets: sprite, alpha: 0, duration: 50, delay: 500 });
    };

    const playFlowerpotAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('flowerpot'));
      // Easy to add sprite logic later here
    };

    const playMegaAnimation = (sprite: Phaser.GameObjects.Sprite, cx: number, cy: number) => {
      particleEmitter = this.add.particles(cx, cy, 'spark', getParticleConfig('mega'));
      // Easy to add sprite logic later here
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

      console.log("Playing intense low rumble sound");

      // Set timeout for 3 seconds exactly
      this.time.delayedCall(3000, () => {
        // Step 3: Nuclear Explosion flash
        if (particleEmitter) particleEmitter.stop();
        sprite.setVisible(false);

        const flash = this.add.rectangle(cx, cy, this.scale.width * 2, this.scale.height * 2, 0xffffff);
        flash.setDepth(100);
        flash.setAlpha(1);

        console.log("Playing extremely loud blast sound");

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
      // Reset state before animating
      sprite.setAlpha(1);
      const isDesktop = window.innerWidth >= 1024;
      const maxVisualSize = isDesktop ? 400 : 200;
      const baseScale = Math.min(maxVisualSize / sprite.width, maxVisualSize / sprite.height);
      sprite.setScale(baseScale);

      switch (id) {
        case 'chakkaram': playChakkaramAnimation(sprite, cx, cy); break;
        case 'rocket': playRocketAnimation(sprite, cx, cy); break;
        case 'bomb': playBombAnimation(sprite, cx, cy, baseScale); break;
        case 'patas': playPatasAnimation(sprite, cx, cy); break;
        case 'flowerpot': playFlowerpotAnimation(sprite, cx, cy); break;
        case 'mega': playMegaAnimation(sprite, cx, cy); break;
        case 'Time Bomb': playBombAnimation(sprite, cx, cy, baseScale); break;
        case 'Nuce': playNuclearAnimation(sprite, cx, cy, baseScale); break;
        default: playPatasAnimation(sprite, cx, cy); break; // fallback
      }
    };

    const igniteFirecracker = (id: string) => {
      setIsLightingMode(false); // tell react
      console.log("Playing ignite sound placeholder for", id);

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
      if (id !== 'Nuce') {
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
