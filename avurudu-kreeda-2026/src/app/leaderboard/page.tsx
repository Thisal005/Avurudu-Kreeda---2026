"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Trophy, Crown, RefreshCw, Medal } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  isUser: boolean;
};

const FAKE_LEADERBOARD: Omit<LeaderboardEntry, "isUser">[] = [
  { rank: 1, name: "Nuwan Kumara", score: 32540 },
  { rank: 2, name: "S. Karthick", score: 29800 },
  { rank: 3, name: "Kasun Perera", score: 27550 },
  { rank: 4, name: "Thilini Silva", score: 25100 },
  { rank: 5, name: "M. Ramesh", score: 23950 },
  { rank: 6, name: "Malini Fernando", score: 21400 },
  { rank: 7, name: "Kamal Jayasuriya", score: 19800 },
  { rank: 8, name: "V. Vani", score: 17200 },
  { rank: 9, name: "A. Roshan", score: 15850 },
  { rank: 10, name: "Niroshan De Silva", score: 13900 },
];

function getUserRankAndScore(points: number): { rank: number; score: number } {
  if (points >= 30000) return { rank: 1, score: points };
  if (points >= 28000) return { rank: 2, score: points };
  if (points >= 26000) return { rank: 3, score: points };
  if (points >= 24000) return { rank: 4, score: points };
  if (points >= 22000) return { rank: 5, score: points };
  if (points >= 20000) return { rank: 6, score: points };
  if (points >= 18500) return { rank: 7, score: points };
  if (points >= 16000) return { rank: 8, score: points };
  if (points >= 14000) return { rank: 9, score: points };
  if (points >= 12000) return { rank: 10, score: points };
  if (points >= 10000) return { rank: 14, score: points };
  if (points >= 8000) return { rank: 21, score: points };
  if (points >= 7000) return { rank: 35, score: points };
  if (points >= 5000) return { rank: 40, score: points };
  if (points >= 2000) return { rank: 60, score: points };
  if (points >= 1000) return { rank: 100, score: points };
  return { rank: 150, score: points }; // default for below 1000
}

export default function LeaderboardPage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboard = () => {
    setIsRefreshing(true);
    const saved = localStorage.getItem("kreedaPoints");
    const points = saved ? parseInt(saved, 10) : 0;
    setTotalPoints(points);

    const { rank: userRank, score: userScore } = getUserRankAndScore(points);
    
    // Mix the user into the fake leaderboard
    const processedLeaderboard = FAKE_LEADERBOARD.map(entry => ({
      ...entry,
      isUser: false,
    }));

    // If user is top 10, replace or insert them appropriately.
    // Actually, simpler logic: just build a combined list, sort, and slice top 10?
    // The prompt asks to "Show a beautiful top 10 ranking list with fake names... Show the user's rank prominently at the top or bottom of the leaderboard with a 'You' label... Highlight the user's row clearly (different background or crown icon if they are in top 10)"
    
    // We can inject user in the main list if rank <= 10.
    const combinedList = [...processedLeaderboard];
    
    if (userRank <= 10) {
      // Find the position to insert/replace
      const existingRecordIndex = combinedList.findIndex(e => e.rank === userRank);
      if (existingRecordIndex !== -1) {
        // Just shift the ranks or replace. Let's replace for simplicity but keep 10 items.
        // Actually, let's just insert and re-rank or update the existing rank 
        // Better: let's filter out by score and push
        // Let's just create a dynamic list and sort by score, taking top 10!
        combinedList.push({
          rank: userRank, // will re-evaluate later anyway, or just keep
          name: "You (Player)",
          score: userScore,
          isUser: true,
        });
      }
    }
    
    // Sort all by score descending
    combinedList.sort((a, b) => b.score - a.score);
    
    // Assign ranks 1 to 10
    const top10 = combinedList.slice(0, 10).map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setLeaderboard(top10);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const { rank: userRank, score: userScore } = getUserRankAndScore(totalPoints);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold shadow-lg shadow-yellow-400/50 border-2 border-yellow-200">1</div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold shadow-lg shadow-slate-300/50 border-2 border-white">2</div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-600/50 border-2 border-amber-400">3</div>;
    return <div className="w-8 h-8 rounded-full bg-avurudu-bg flex items-center justify-center text-avurudu-dark font-bold border-2 border-avurudu-yellow/50">{rank}</div>;
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      <header className="w-full flex items-center justify-between z-10 mb-8 max-w-2xl mx-auto">
        <Link href="/games" className="bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex flex-col items-center flex-1">
          <p className="text-sm font-bold text-avurudu-red tracking-widest uppercase">Avurudu Kreeda</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-avurudu-dark drop-shadow-sm text-center">
            Championship 2026
          </h1>
        </div>
        <button 
          onClick={loadLeaderboard}
          className={`bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </header>

      <div className="w-full max-w-2xl mx-auto z-10 flex flex-col gap-6 pb-20">
        
        {/* User Stats Card */}
        <div className="bg-gradient-to-r from-avurudu-red via-avurudu-orange to-avurudu-yellow p-[3px] rounded-3xl shadow-xl">
          <div className="bg-white rounded-[21px] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-avurudu-yellow/30 rounded-full flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-avurudu-red" />
                </div>
                {userRank <= 10 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 p-1 rounded-full animate-bounce-slow">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-avurudu-dark/60 font-bold uppercase">Your Rank</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-avurudu-dark">#{userRank}</span>
                  {userRank > 100 && <span className="text-sm text-avurudu-dark/50">(Keep Playing!)</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-avurudu-dark/60 font-bold uppercase">Points</p>
              <p className="text-2xl font-black text-avurudu-orange">{totalPoints} KP</p>
            </div>
          </div>
        </div>

        {/* Claim Prize Link */}
        {totalPoints > 0 && (
          <div className="w-full animate-pulse-slow">
            <Link href="/claim-prize" className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-white hover:scale-[1.02] transition-transform overflow-hidden relative group">
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              <span className="relative flex items-center justify-center gap-2 drop-shadow-md">
                🎁 Claim Your Grand Avurudu Prize!
              </span>
            </Link>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow relative overflow-hidden">
          {/* Decorative lamps */}
          <div className="absolute top-4 left-4 text-3xl opacity-50">🪔</div>
          <div className="absolute top-4 right-4 text-3xl opacity-50">🪔</div>
          
          <h2 className="text-center text-xl font-bold text-avurudu-dark mb-6 mt-2 flex items-center justify-center gap-2">
            <Medal className="w-6 h-6 text-avurudu-red" />
            Top 10 Heroes
            <Medal className="w-6 h-6 text-avurudu-red" />
          </h2>

          <div className="flex flex-col gap-3">
            {leaderboard.map((entry, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 ${
                  entry.isUser 
                    ? 'bg-avurudu-yellow/30 border-2 border-avurudu-orange shadow-md transform scale-[1.02]' 
                    : 'bg-avurudu-bg/50 hover:bg-avurudu-yellow/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  {getRankBadge(entry.rank)}
                  <div className="flex flex-col">
                    <span className={`font-bold ${entry.isUser ? 'text-avurudu-red text-lg' : 'text-avurudu-dark text-base'}`}>
                      {entry.name} {entry.isUser && "⭐"}
                    </span>
                    {entry.isUser && <span className="text-xs font-bold text-avurudu-orange">This is You!</span>}
                  </div>
                </div>
                <div className="font-black text-avurudu-dark">
                  {entry.score.toLocaleString()} <span className="text-xs text-avurudu-dark/50">KP</span>
                </div>
              </div>
            ))}
          </div>

          {userRank > 10 && (
            <>
              <div className="flex justify-center my-4">
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-1.5 h-1.5 bg-avurudu-dark/20 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-avurudu-dark/20 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-avurudu-dark/20 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-avurudu-yellow/30 border-2 border-avurudu-orange shadow-md transform scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-avurudu-bg flex items-center justify-center text-avurudu-dark font-bold border-2 border-avurudu-yellow/50">
                    {userRank}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-avurudu-red text-lg">You (Player) ⭐</span>
                    <span className="text-xs font-bold text-avurudu-orange">Current Position</span>
                  </div>
                </div>
                <div className="font-black text-avurudu-dark">
                  {totalPoints} <span className="text-xs text-avurudu-dark/50">KP</span>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
