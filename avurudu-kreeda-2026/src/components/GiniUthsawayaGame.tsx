"use client";

// ──────────────────────────────────────────────────────────────
// GiniUthsawayaGame.tsx — Slim orchestrator component.
// Wires together: Phaser scene, audio, inventory, and React UI.
// ──────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingCart,
  ChevronRight,
  Sparkles,
  X,
  Info,
} from "lucide-react";

import { FIRECRACKERS, FirecrackerType } from "./GiniUthsawayaConfig";
import { useAudioManager } from "./gini-uthsawaya/useAudioManager";
import { useFirecrackerInventory } from "./gini-uthsawaya/useFirecrackerInventory";
import {
  createGiniUthsawayaScene,
  SceneCallbacks,
  CALLBACKS_KEY,
} from "./gini-uthsawaya/GiniUthsawayaScene";

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function GiniUthsawayaGame() {
  // ── Refs ────────────────────────────────────────────────────
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // ── State ───────────────────────────────────────────────────
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLightingMode, setIsLightingMode] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [hasCrashed, setHasCrashed] = useState(false);

  // ── Hooks ───────────────────────────────────────────────────
  const { playSound, stopSound } = useAudioManager();
  const {
    totalPoints,
    inventory,
    activeItemId,
    setActiveItemId,
    ownedItems,
    buyItem,
    consumeItem,
  } = useFirecrackerInventory();

  // ── Derived ─────────────────────────────────────────────────
  const activeItemIndex = activeItemId ? ownedItems.indexOf(activeItemId) : -1;

  // ── Nuclear crash listener ──────────────────────────────────
  useEffect(() => {
    const onCrash = () => setHasCrashed(true);
    window.addEventListener("nuclear-crash", onCrash);
    return () => window.removeEventListener("nuclear-crash", onCrash);
  }, []);

  // ── Navigation helpers ──────────────────────────────────────
  const handleNext = useCallback(() => {
    if (ownedItems.length <= 1) return;
    const nextIdx = (activeItemIndex + 1) % ownedItems.length;
    setActiveItemId(ownedItems[nextIdx]);
    setIsLightingMode(false);
  }, [ownedItems, activeItemIndex, setActiveItemId]);

  const handlePrev = useCallback(() => {
    if (ownedItems.length <= 1) return;
    const prevIdx =
      (activeItemIndex - 1 + ownedItems.length) % ownedItems.length;
    setActiveItemId(ownedItems[prevIdx]);
    setIsLightingMode(false);
  }, [ownedItems, activeItemIndex, setActiveItemId]);

  // ── Light-up mode ───────────────────────────────────────────
  const activateLightingMode = useCallback(() => {
    if (!activeItemId) return;
    setIsLightingMode(true);
    phaserGameRef.current?.events.emit("enter-lighting-mode");
  }, [activeItemId]);

  // ── Boot Phaser ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !gameRef.current) return;

    const initPhaser = async () => {
      const Phaser = (await import("phaser")).default;

      // Create scene class now that Phaser is loaded
      const SceneClass = createGiniUthsawayaScene(Phaser);

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current!,
        width: window.innerWidth,
        height: window.innerHeight,
        transparent: true,
        physics: { default: "arcade" },
        scene: [SceneClass],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the scene callbacks in sync with the latest React state.
  // We store a mutable object on the game registry so the scene
  // always reads the latest versions without needing re-creation.
  useEffect(() => {
    if (!phaserGameRef.current) return;

    const callbacks: SceneCallbacks = {
      playSound,
      stopSound,
      setCelebrationMessage,
      setIsLightingMode,
      consumeItem,
      handleNext,
      handlePrev,
      isShopOpen: () => isShopOpen,
    };

    phaserGameRef.current.registry.set(CALLBACKS_KEY, callbacks);
  }, [
    playSound,
    stopSound,
    consumeItem,
    handleNext,
    handlePrev,
    isShopOpen,
  ]);

  // ── Sync active item with Phaser scene ──────────────────────
  useEffect(() => {
    if (phaserGameRef.current && activeItemId) {
      phaserGameRef.current.events.emit("show-firecracker", activeItemId);
    }
  }, [activeItemId]);

  // When active item is depleted, tell Phaser to hide it
  useEffect(() => {
    if (activeItemId && inventory[activeItemId] === 0 && phaserGameRef.current) {
      phaserGameRef.current.events.emit("hide-firecracker");
    }
  }, [activeItemId, inventory]);

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <div
      className={`fixed inset-0 bg-[#0a0a1a] overflow-hidden ${
        isLightingMode ? "cursor-[url('/matchstick.png'),_pointer]" : ""
      }`}
    >
      {/* ── Nuclear Crash Overlay ─────────────────────────────── */}
      {hasCrashed && (
        <div
          className="absolute inset-0 z-[100] bg-red-900 flex flex-col items-center justify-center p-8 text-center"
          style={{ fontFamily: "monospace" }}
        >
          <div className="bg-black text-red-500 p-8 border-4 border-red-600 shadow-[0_0_80px_rgba(255,0,0,0.9)] w-full max-w-4xl relative overflow-hidden">
            <h1 className="text-4xl md:text-7xl font-black mb-6 animate-pulse text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
              CRITICAL FATAL ERROR
            </h1>
            <p className="text-xl md:text-3xl mb-8 font-bold text-white">
              NUCLEAR DETONATION HAS DESTROYED APPLICATION INTEGRITY.
            </p>
            <p className="text-sm md:text-xl text-red-400 mb-12 opacity-80">
              (ERR_CODE: NUCE_EXTREME_OVERLOAD_x892910)
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white border-4 border-red-300 font-black py-6 px-12 text-2xl hover:bg-white hover:text-red-600 transition-all shadow-xl"
            >
              [ REBOOT SYSTEM TO SAFE MODE ]
            </button>
          </div>
        </div>
      )}

      {/* ── Phaser Canvas ─────────────────────────────────────── */}
      <div
        ref={gameRef}
        className="absolute inset-0 z-0"
        style={{ cursor: isLightingMode ? "crosshair" : "default" }}
      />

      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 w-full p-4 z-10 flex items-center justify-between">
        <Link
          href="/games"
          className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>

        <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-avurudu-yellow/30 flex items-center gap-2">
          <Sparkles className="text-avurudu-yellow w-5 h-5" />
          <span className="text-white font-bold text-lg">
            {totalPoints} KP
          </span>
        </div>

        <button
          onClick={() => setIsShopOpen(true)}
          className="bg-avurudu-orange hover:bg-avurudu-red transition-colors p-3 rounded-full text-white shadow-lg flex items-center justify-center relative"
        >
          <ShoppingCart className="w-6 h-6" />
        </button>
      </header>

      {/* ── Ground UI Overlay ─────────────────────────────────── */}
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
                <button
                  onClick={handlePrev}
                  disabled={isLightingMode}
                  className={`bg-white/10 p-4 rounded-full text-white transition-all ${
                    isLightingMode
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white/20 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              <div className="w-32" /> {/* Spacing for the canvas object */}
              {ownedItems.length > 1 && (
                <button
                  onClick={handleNext}
                  disabled={isLightingMode}
                  className={`bg-white/10 p-4 rounded-full text-white transition-all ${
                    isLightingMode
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white/20 active:scale-95"
                  }`}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            <div className="bg-black/50 backdrop-blur px-8 py-4 rounded-3xl border border-white/10 shadow-xl flex flex-col items-center">
              <h2 className="text-xl font-bold text-white mb-1">
                {
                  FIRECRACKERS.find(
                    (f: FirecrackerType) => f.id === activeItemId
                  )?.name
                }
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
            <h2 className="text-3xl font-black text-white mb-2">
              Ground is Empty!
            </h2>
            <p className="text-white/70 mb-6">
              Open the shop to buy some firecrackers.
            </p>
            <button
              onClick={() => setIsShopOpen(true)}
              className="bg-avurudu-orange text-white font-bold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              Open Shop
            </button>
          </div>
        )}
      </div>

      {/* ── Shop Modal ────────────────────────────────────────── */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6 overflow-hidden">
          <div className="bg-white w-full sm:max-w-2xl max-h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Shop Header */}
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-avurudu-dark">
                  Firecracker Shop
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Spend Kreeda Points to light up the night!
                </p>
              </div>
              <button
                onClick={() => setIsShopOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Shop Grid */}
            <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIRECRACKERS.map((item: FirecrackerType) => (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-avurudu-yellow/20 rounded-2xl p-4 flex flex-col hover:border-avurudu-yellow transition-colors relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 bg-avurudu-yellow/20 w-32 h-32 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 ease-out z-0" />

                    <div className="relative z-10 w-full flex justify-center mb-4 mt-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                      />
                    </div>

                    <div className="relative z-10 flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-avurudu-dark">
                        {item.name}
                      </h3>
                      <div className="bg-avurudu-orange/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-avurudu-orange" />
                        <span className="text-avurudu-orange font-bold">
                          {item.price}
                        </span>
                      </div>
                    </div>

                    <p className="relative z-10 text-xs text-gray-500 mb-6 flex-1">
                      A dazzling display of lights and sound. (Owned:{" "}
                      {inventory[item.id] || 0})
                    </p>

                    <div className="relative z-10 flex gap-2 w-full mt-auto">
                      <button
                        onClick={() => buyItem(item, 1)}
                        disabled={totalPoints < item.price}
                        className={`flex-1 py-2 lg:py-3 rounded-xl font-bold transition-all shadow-sm
                              ${
                                totalPoints >= item.price
                                  ? "bg-avurudu-dark text-white hover:bg-black hover:shadow-md"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                      >
                        Buy 1
                      </button>
                      <button
                        onClick={() => buyItem(item, 5)}
                        disabled={totalPoints < item.price * 5}
                        className={`px-4 py-2 lg:py-3 rounded-xl font-bold border-2 transition-all
                              ${
                                totalPoints >= item.price * 5
                                  ? "border-avurudu-dark text-avurudu-dark hover:bg-gray-50"
                                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                      >
                        x5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center sm:rounded-b-3xl">
              <div className="flex items-center gap-2 text-gray-500">
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Kreeda Points from other games are shared here.
                </span>
              </div>
              <div className="flex items-center gap-2 bg-avurudu-yellow/20 px-6 py-3 rounded-full border border-avurudu-yellow">
                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Balance
                </span>
                <span className="text-2xl font-black text-avurudu-dark">
                  {totalPoints} KP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
