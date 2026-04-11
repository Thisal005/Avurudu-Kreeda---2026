"use client";

import { useState, useEffect } from "react";
import { Sparkles, Info } from "lucide-react";

export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }

    const handleShowPopup = () => setIsVisible(true);
    window.addEventListener("show-welcome-popup", handleShowPopup);

    return () => {
      window.removeEventListener("show-welcome-popup", handleShowPopup);
    };
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative w-full max-w-lg overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-100 rounded-3xl shadow-2xl border-[4px] border-yellow-400">
        
        {/* Glow Effects / Particles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-red-400/20 rounded-full blur-3xl mix-blend-multiply" />
        </div>

        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="mb-4 text-orange-500 animate-bounce">
            <Sparkles size={48} className="drop-shadow-lg" fill="currentColor" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-600 mb-2 drop-shadow-sm">
            Welcome to Avurudu Kreeda 2026!
          </h2>
          
          <p className="text-sm font-semibold text-red-700/80 mb-6 tracking-wide uppercase">
            The Official Online Avurudu Games Festival
          </p>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 mb-6 text-left w-full border border-orange-200/50 shadow-inner max-h-[40vh] overflow-y-auto custom-scrollbar">
            <p className="mb-4 text-gray-800 font-medium">
              Live from <strong className="text-orange-600">12th April to 17th April 2026</strong>.
              <br/>Play 5 traditional Avurudu games, collect Kreeda Points (KP), and climb the leaderboard!
            </p>

            <h3 className="font-bold text-red-600 mb-2 border-b-2 border-red-100 pb-1 flex items-center gap-2">
              🏆 Prize Distribution (Real Prizes):
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 mb-4 font-medium">
              <li><span className="text-orange-500 mr-2">🥇</span><strong>Grand Prize</strong> → LKR 25,000</li>
              <li><span className="text-slate-400 mr-2">🥈</span><strong>1st Runner-up</strong> → LKR 15,000</li>
              <li><span className="text-amber-700 mr-2">🥉</span><strong>2nd Runner-up</strong> → LKR 10,000</li>
              <li><span className="text-yellow-600 mr-2">🏅</span><strong>Top 3 to 10</strong> → LKR 2,500 each</li>
              <li><span className="text-green-500 mr-2">📱</span><strong>Top 10 to 100</strong> → Free Mobile Reload (after raffle draw)</li>
            </ul>

            <h3 className="font-bold text-red-600 mb-2 border-b-2 border-red-100 pb-1 flex items-center gap-2">
              📜 Rules:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-medium">
              <li>Play as many times as you want during the event period.</li>
              <li>Your total Kreeda Points will determine your final rank.</li>
              <li>Winners will be announced after 17th April 2026.</li>
              <li>All prizes will be given to real top performers.</li>
            </ul>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm font-bold text-red-600 mb-6 bg-red-100/50 px-4 py-2 rounded-full w-full">
            <Info size={16} /> Play honestly. Have fun. Win awurudu thagi!
          </p>

          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-4 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] transform hover:scale-[1.02] transition-all active:scale-95 text-lg"
          >
            I Understand - Let's Play!
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.8);
        }
      `}</style>
    </div>
  );
}
