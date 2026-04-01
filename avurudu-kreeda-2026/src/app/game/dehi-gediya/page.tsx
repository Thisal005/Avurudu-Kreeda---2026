"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

// Phaser must be loaded dynamically with SSR disabled
const GameWrapper = dynamic(() => import("@/components/DehiGediyaGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-avurudu-yellow">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-bold text-xl animate-pulse">Loading Game...</p>
    </div>
  ),
});

export default function DehiGediyaPage() {
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameOver(true);
    
    // Save points to localStorage
    const currentPoints = parseInt(localStorage.getItem("kreedaPoints") || "0", 10);
    localStorage.setItem("kreedaPoints", (currentPoints + score).toString());

    // Trigger confetti if score is decent
    if (score > 10) {
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#32CD32', '#fcd116', '#ffffff'] // Lime themed confetti
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#32CD32', '#fcd116', '#ffffff']
      });
    }, 250);
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      {!gameOver && (
        <header className="absolute top-4 left-4 z-20">
          <Link href="/games" className="bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors flex items-center gap-2 pr-4 font-bold">
            <ChevronLeft className="w-6 h-6" />
            Quit
          </Link>
        </header>
      )}

      {/* Game Area */}
      {/* Full screen on mobile, 16:9 container on desktop */}
      <div className="absolute inset-0 md:relative w-full h-full md:h-auto md:max-w-4xl md:aspect-[16/9] bg-white md:rounded-3xl shadow-2xl z-10 overflow-hidden md:border-4 border-avurudu-yellow">
        
        {!gameOver ? (
          <GameWrapper onGameOver={handleGameOver} />
        ) : (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <h2 className="text-4xl font-black text-avurudu-dark mb-2 drop-shadow-sm">
              Game Over!
            </h2>
            <div className="w-24 h-24 bg-avurudu-yellow/20 rounded-full flex items-center justify-center text-5xl my-6 border-4 border-avurudu-yellow shadow-xl">
              🍋
            </div>
            
            <p className="text-avurudu-dark/80 text-xl font-medium mb-1">Distance Run</p>
            <p className="text-6xl font-black text-avurudu-dark mb-8 drop-shadow-md">
              {finalScore}m
            </p>
            
            <p className="text-avurudu-green font-bold text-lg mb-8 bg-avurudu-green/20 px-8 py-3 rounded-full border border-avurudu-green shadow-sm">
              + {finalScore} Kreeda Points Added!
            </p>

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={() => setGameOver(false)}
                className="flex-1 bg-avurudu-yellow text-avurudu-dark py-4 rounded-full font-bold shadow-lg hover:bg-avurudu-orange transition-colors"
              >
                PLAY AGAIN
              </button>
              
              <Link 
                href="/games"
                className="flex-1 bg-white border-2 border-avurudu-red text-avurudu-red py-4 rounded-full font-bold shadow-sm hover:bg-avurudu-red hover:text-white transition-colors flex items-center justify-center"
              >
                GAMES HUB
              </Link>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
