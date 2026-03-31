"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Lock, Trophy } from "lucide-react";

function getRank(points: number): string {
  if (points >= 1000) return "Avurudu Champion 🏆";
  if (points >= 500) return "Kreeda Master 🎯";
  if (points >= 200) return "Sweet Catcher 🍬";
  if (points >= 50) return "Newcomer ⭐";
  return "Beginner";
}

export default function GamesHub() {
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("kreedaPoints");
    if (saved) setTotalPoints(parseInt(saved, 10));
  }, []);

  const upcomingGames = [
    { id: 4, title: "Mark Elephant's Eye", image: "🐘" },
  ];

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      <header className="w-full flex items-center justify-between z-10 mb-8 max-w-4xl mx-auto">
        <Link href="/" className="bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-extrabold text-avurudu-dark drop-shadow-sm text-center flex-1">
          Avurudu Games
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Stats/Points Header */}
      <div className="z-10 bg-white/90 rounded-2xl p-5 shadow-md max-w-sm mx-auto w-full mb-8 border border-avurudu-yellow/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-avurudu-orange/15 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-avurudu-orange" />
            </div>
            <div>
              <p className="text-xs text-avurudu-dark/50 font-medium uppercase tracking-wider">Total Kreeda Points</p>
              <p className="text-3xl font-black text-avurudu-orange leading-tight">{totalPoints} <span className="text-base font-bold">KP</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-avurudu-dark/50 font-medium uppercase tracking-wider">Rank</p>
            <p className="text-base font-bold text-avurudu-red">{getRank(totalPoints)}</p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full pb-20">
        
        {/* Active Game: Catch Kavili */}
        <Link href="/game/catch-kavili" className="group block relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-avurudu-red to-avurudu-yellow rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-24 h-24 bg-avurudu-yellow/20 rounded-full flex items-center justify-center text-5xl">
              🍬
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-avurudu-dark mb-1">Catch Kavili</h2>
              <p className="text-sm text-avurudu-dark/70 font-medium">Catch the falling sweets! Avoid the chili.</p>
            </div>
            <button className="mt-2 w-full bg-avurudu-red text-white py-3 rounded-full font-bold shadow-md group-hover:bg-avurudu-orange transition-colors">
              PLAY NOW
            </button>
          </div>
        </Link>

        {/* Active Game: Kana Mutti Bindeema */}
        <Link href="/game/kanamutti-bindeema" className="group block relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-avurudu-red to-avurudu-yellow rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-24 h-24 bg-avurudu-yellow/20 rounded-full flex items-center justify-center text-5xl">
              🏺
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-avurudu-dark mb-1">Kana Mutti Bindeema</h2>
              <p className="text-sm text-avurudu-dark/70 font-medium">Break the hanging pot blindfolded!</p>
            </div>
            <button className="mt-2 w-full bg-avurudu-red text-white py-3 rounded-full font-bold shadow-md group-hover:bg-avurudu-orange transition-colors">
              PLAY NOW
            </button>
          </div>
        </Link>

        {/* Active Game: Imposter Koha */}
        <Link href="/game/imposter-koha" className="group block relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-avurudu-red to-avurudu-yellow rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-24 h-24 bg-avurudu-yellow/20 rounded-full flex items-center justify-center text-5xl">
              🐦‍⬛
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-avurudu-dark mb-1">Find the Imposter Koha</h2>
              <p className="text-sm text-avurudu-dark/70 font-medium whitespace-pre-line">
                Spot the clever Koha hiding among the crows!
              </p>
            </div>
            <button className="mt-2 w-full bg-avurudu-red text-white py-3 rounded-full font-bold shadow-md group-hover:bg-avurudu-orange transition-colors">
              PLAY NOW
            </button>
          </div>
        </Link>

        {/* Active Game: Kotta Pora */}
        <Link href="/game/kotta-pora" className="group block relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-avurudu-red to-avurudu-yellow rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative bg-white rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow flex flex-col items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-24 h-24 bg-avurudu-yellow/20 rounded-full flex items-center justify-center text-5xl">
              🛌
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-avurudu-dark mb-1">Kotta Pora</h2>
              <p className="text-sm text-avurudu-dark/70 font-medium">Pillow fight on the pole – last one standing wins!</p>
            </div>
            <button className="mt-2 w-full bg-avurudu-red text-white py-3 rounded-full font-bold shadow-md group-hover:bg-avurudu-orange transition-colors">
              PLAY NOW
            </button>
          </div>
        </Link>

        {/* Coming Soon Games */}
        {upcomingGames.map((game) => (
          <div key={game.id} className="relative bg-white/60 rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col items-center gap-4 opacity-80 cursor-not-allowed">
            <div className="absolute top-4 right-4 bg-black/10 p-2 rounded-full">
              <Lock className="w-4 h-4 text-black/40" />
            </div>
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center text-4xl grayscale">
              {game.image}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-avurudu-dark/60 mb-1">{game.title}</h2>
              <span className="inline-block bg-black/5 text-black/50 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
        
      </div>
    </main>
  );
}
