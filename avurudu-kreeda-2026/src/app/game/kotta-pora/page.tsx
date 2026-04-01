"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

const GameWrapper = dynamic(() => import("@/components/KottaPoraGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-avurudu-dark">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold text-xl animate-pulse">Loading Kotta Pora...</p>
    </div>
  ),
});

export default function KottaPoraPage() {
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0); // force remount on play again

  const handleMatchEnd = (playerWon: boolean, score: number) => {
    setWon(playerWon);
    setFinalScore(score);
    setGameOver(true);

    // Persist Kreeda Points
    const current = parseInt(localStorage.getItem("kreedaPoints") || "0", 10);
    localStorage.setItem("kreedaPoints", (current + score).toString());

    if (playerWon) {
      triggerWinConfetti();
    }
  };

  const triggerWinConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#da291c", "#fcd116", "#f58220", "#2ecc71", "#ffffff"];

    const fire = () => {
      if (Date.now() > end) return;
      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 60,
        zIndex: 100,
        particleCount: 60,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors,
      });
      requestAnimationFrame(fire);
    };
    setTimeout(fire, 100);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('/pattern.png')] bg-repeat" />

      {/* Back button (visible only during gameplay) */}
      {!gameOver && (
        <header className="absolute top-4 left-4 z-20">
          <Link
            href="/games"
            className="bg-avurudu-bg p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors flex items-center gap-2 pr-4 font-bold border border-avurudu-yellow"
          >
            <ChevronLeft className="w-6 h-6" />
            Quit
          </Link>
        </header>
      )}

      {/* Game canvas */}
      <div className="w-full max-w-lg aspect-[9/18] md:aspect-[3/4] bg-white rounded-3xl shadow-2xl relative z-10 overflow-hidden border-4 border-avurudu-yellow">
        {!gameOver ? (
          <GameWrapper key={gameKey} onMatchEnd={handleMatchEnd} />
        ) : (
          <div className="absolute inset-0 bg-avurudu-dark flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            {/* Result icon */}
            <div className="w-28 h-28 bg-avurudu-orange/20 rounded-full flex items-center justify-center text-6xl mb-4 border-4 border-avurudu-yellow shadow-xl">
              {won ? "🏆" : "😢"}
            </div>

            <h2 className="text-4xl font-black text-avurudu-yellow mb-1 drop-shadow-md">
              {won ? "Kotta Pora Champion!" : "You Lost!"}
            </h2>
            <p className="text-white/70 text-base mb-5">
              {won
                ? "The crowd goes wild! You are the pillow-fight champion! 🎊"
                : "The CPU knocked you off the pole! Try again!"}
            </p>

            {/* Score */}
            <div className="bg-avurudu-orange/20 border-2 border-avurudu-orange rounded-2xl px-8 py-4 mb-6 w-full max-w-xs">
              <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
                Kreeda Points Earned
              </p>
              <p className="text-5xl font-black text-avurudu-yellow leading-tight">
                +{finalScore}
                <span className="text-xl font-bold"> KP</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => {
                  setGameOver(false);
                  setGameKey((k) => k + 1);
                }}
                className="w-full bg-avurudu-yellow text-avurudu-dark py-4 rounded-full font-bold shadow-lg hover:bg-white transition-colors text-lg"
              >
                🎮 Play Again
              </button>
              <Link
                href="/games"
                className="w-full text-center bg-avurudu-red/20 border-2 border-avurudu-red text-avurudu-red py-4 rounded-full font-bold shadow-sm hover:bg-avurudu-red hover:text-white transition-colors text-lg"
              >
                Back to Games Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
