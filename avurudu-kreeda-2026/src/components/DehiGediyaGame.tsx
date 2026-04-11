"use client";

// ──────────────────────────────────────────────────────────────
// DehiGediyaGame.tsx — Slim React orchestrator.
// Boots the Phaser engine with the DehiGediya scene and passes
// the onGameOver callback via the game registry.
// ──────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createDehiGediyaScene, GAMEOVER_CB_KEY } from "./dehi-gediya/DehiGediyaScene";

interface DehiGediyaGameProps {
  onGameOver: (score: number) => void;
}

export default function DehiGediyaGame({ onGameOver }: DehiGediyaGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGame.current) return;

    const SceneClass = createDehiGediyaScene(Phaser);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: gameRef.current,
      backgroundColor: "#d0e8ff",
      scene: SceneClass,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    phaserGame.current = new Phaser.Game(config);
    phaserGame.current.registry.set(GAMEOVER_CB_KEY, onGameOver);

    return () => {
      phaserGame.current?.destroy(true);
      phaserGame.current = null;
    };
  }, [onGameOver]);

  return <div ref={gameRef} className="w-full h-full" />;
}
