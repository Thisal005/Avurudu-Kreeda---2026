"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

// Phaser must be loaded dynamically with SSR disabled
const GameWrapper = dynamic(() => import("@/components/KohaGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-avurudu-dark">
      <Loader2 className="w-12 h-12 animate-spin mb-4" aria-hidden="true" />
      <p className="font-bold text-xl animate-pulse">Loading Game...</p>
    </div>
  ),
});

const CONFETTI_DURATION_MS = 3000;
const CONFETTI_COLORS = ['#da291c', '#fcd116', '#f58220', '#2ecc71'];

/**
 * Utility function to safely update score in localStorage.
 * Incorporates error handling for scenarios where localStorage might be disabled or unavailable.
 */
const savePointsSecurely = (score: number): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const currentPoints = parseInt(localStorage.getItem("kreedaPoints") || "0", 10);
      const updatedPoints = isNaN(currentPoints) ? score : currentPoints + score;
      localStorage.setItem("kreedaPoints", updatedPoints.toString());
    }
  } catch (error) {
    console.error("Failed to save Kreeda points. LocalStorage might be restricted.", error);
  }
};

export default function ImposterKohaPage() {
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const confettiIntervalRef = useRef<number | null>(null);

  // Clear interval cleanup helper
  const clearConfetti = useCallback(() => {
    if (confettiIntervalRef.current !== null) {
      window.clearInterval(confettiIntervalRef.current);
      confettiIntervalRef.current = null;
    }
  }, []);

  // Ensure interval is cleared when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => clearConfetti();
  }, [clearConfetti]);

  const triggerConfetti = useCallback(() => {
    const animationEnd = Date.now() + CONFETTI_DURATION_MS;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    // Clear any existing intervals before starting a new one
    clearConfetti();

    confettiIntervalRef.current = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearConfetti();
        return;
      }

      const particleCount = Math.floor(50 * (timeLeft / CONFETTI_DURATION_MS));
      
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: CONFETTI_COLORS
      });
      confetti({
        ...defaults, 
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: CONFETTI_COLORS
      });
    }, 250);
  }, [clearConfetti]);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setGameOver(true);
    
    savePointsSecurely(score);

    // Trigger confetti if score is decent
    if (score > 0) {
      triggerConfetti();
    }
  }, [triggerConfetti]);

  const handlePlayAgain = useCallback(() => {
    setGameOver(false);
    setFinalScore(0);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('/pattern.png')] bg-repeat" 
        aria-hidden="true"
      />

      {/* Header */}
      {!gameOver && (
        <header className="absolute top-4 left-4 z-20">
          <Link 
            href="/games" 
            className="bg-avurudu-bg p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors flex items-center gap-2 pr-4 font-bold border border-avurudu-yellow focus:outline-none focus:ring-2 focus:ring-avurudu-orange"
            aria-label="Quit game and return to games hub"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            Quit
          </Link>
        </header>
      )}

      {/* Game Area */}
      <div className="w-full max-w-lg aspect-[9/16] md:aspect-[3/4] bg-white rounded-3xl shadow-2xl relative z-10 overflow-hidden border-4 border-avurudu-yellow">
        
        {!gameOver ? (
          <GameWrapper onGameOver={handleGameOver} />
        ) : (
          <div 
            className="absolute inset-0 bg-avurudu-dark flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500"
            role="dialog"
            aria-labelledby="game-over-title"
          >
            <h2 id="game-over-title" className="text-4xl font-black text-avurudu-yellow mb-2 drop-shadow-md">
              Game Over!
            </h2>
            <div 
              className="w-24 h-24 bg-avurudu-orange rounded-full flex items-center justify-center text-5xl my-6 border-4 border-white shadow-xl"
              aria-hidden="true"
            >
              🐦‍⬛
            </div>
            
            <p className="text-white text-xl font-medium mb-1">Final Score</p>
            <p className="text-6xl font-black text-avurudu-yellow mb-8 drop-shadow-lg" aria-live="polite">
              {finalScore}
            </p>
            
            {finalScore > 0 && (
              <p className="text-avurudu-green font-bold text-lg mb-8 bg-avurudu-green/20 px-4 py-2 rounded-full border border-avurudu-green pb-2 pt-3">
                + {finalScore} Kreeda Points Added!
              </p>
            )}

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={handlePlayAgain}
                className="w-full bg-avurudu-yellow text-avurudu-dark py-4 rounded-full font-bold shadow-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-avurudu-dark"
                aria-label="Play Again"
              >
                PLAY AGAIN
              </button>
              
              <Link 
                href="/games"
                className="w-full bg-avurudu-red/20 border-2 border-avurudu-red text-avurudu-red py-4 rounded-full flex items-center justify-center font-bold shadow-sm hover:bg-avurudu-red hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-avurudu-red focus:ring-offset-2 focus:ring-offset-avurudu-dark"
                aria-label="Back to Games Hub"
              >
                BACK TO GAMES Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
