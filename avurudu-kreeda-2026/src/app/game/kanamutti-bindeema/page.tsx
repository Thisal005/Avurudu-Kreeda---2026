"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, RotateCcw, Home } from "lucide-react";

// Dynamically import the Phaser game so it doesn't cause SSR issues
const KanamuttiGame = dynamic(() => import("@/components/KanamuttiGame"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-avurudu-yellow"></div>
    </div>
  ),
});

export default function KanamuttiBindeemaPage() {
  const [gameOver, setGameOver] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [resultType, setResultType] = useState<'win' | 'bonus' | 'miss'>('miss');
  const [totalPoints, setTotalPoints] = useState(0);
  const [attempts, setAttempts] = useState(1);

  // Load points on mount
  useEffect(() => {
    const saved = localStorage.getItem("kreedaPoints");
    if (saved) {
      setTotalPoints(parseInt(saved, 10));
    }
  }, []);

  const handleGameOver = (result: 'win' | 'bonus' | 'miss') => {
    let score = 0;
    if (result === 'win') {
      if (attempts === 1) score = 5000;
      else if (attempts >= 2 && attempts <= 4) score = 4000;
      else if (attempts >= 5 && attempts <= 7) score = 3000;
      else score = 1000;
    } else if (result === 'bonus') {
      score = 500;
    } else {
      score = 0;
    }

    setRoundScore(score);
    setResultType(result);
    setGameOver(true);

    const newTotal = totalPoints + score;
    setTotalPoints(newTotal);
    localStorage.setItem("kreedaPoints", newTotal.toString());
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setRoundScore(0);
    if (resultType === 'win') {
      setAttempts(1);
    } else {
      setAttempts(prev => prev + 1);
    }
  };

  const isPositive = resultType === 'win' || resultType === 'bonus';

  const resultEmoji = resultType === 'win' ? '🎉' : resultType === 'bonus' ? '🪙' : '💥';
  const resultTitle = resultType === 'win' ? 'Jackpot!' : resultType === 'bonus' ? 'Bonus Pot!' : 'Missed!';
  const resultMsg = resultType === 'win'
    ? `You smashed the treasure pot in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`
    : resultType === 'bonus'
    ? `You found the bonus pot! +500 KP (Attempt ${attempts})`
    : 'Oops, you hit the wrong pot.';

  return (
    <main className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
        <Link 
          href="/games" 
          className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white shadow-lg pointer-events-auto hover:bg-white/20 transition-all border border-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-avurudu-yellow/30 pointer-events-auto cursor-default">
          <p className="text-sm text-white/70 font-bold uppercase tracking-widest text-center">Score</p>
          <p className="text-xl font-black text-avurudu-yellow">{totalPoints} KP</p>
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        {!gameOver ? (
          <>
            <KanamuttiGame key="playing" onGameOver={handleGameOver} />
            <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-none z-10 text-white/50 text-sm font-bold uppercase tracking-widest">
              Attempt {attempts}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-black/80 flex items-center justify-center p-6 z-30 absolute top-0 left-0">
            <div className={`bg-gradient-to-br ${resultType === 'win' ? 'from-green-900 to-green-600' : resultType === 'bonus' ? 'from-amber-900 to-amber-600' : 'from-gray-900 to-gray-700'} p-1 rounded-3xl shadow-2xl max-w-sm w-full`}>
              <div className="bg-black/40 backdrop-blur-xl rounded-[22px] p-8 text-center flex flex-col items-center border border-white/10">
                <div className="text-6xl mb-4">{resultEmoji}</div>
                
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">
                  {resultTitle}
                </h2>
                
                <p className="text-white/80 font-medium mb-6">
                  {resultMsg}
                </p>

                <div className="bg-black/50 w-full rounded-2xl py-4 mb-8 border border-white/5">
                  <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-1">Points Earned</p>
                  <p className={`text-5xl font-black ${isPositive ? 'text-avurudu-yellow' : 'text-gray-300'}`}>
                    +{roundScore}
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <button 
                    onClick={handlePlayAgain}
                    className="w-full bg-avurudu-yellow text-black font-extrabold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Next Round
                  </button>
                  
                  <Link 
                    href="/games"
                    className="w-full bg-white/10 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                  >
                    <Home className="w-5 h-5" />
                    Back to Hub
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
