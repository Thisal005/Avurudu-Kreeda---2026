"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Trophy, Crown, RefreshCw, Medal, Gift, Activity } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  isUser: boolean;
};

const FAKE_NAMES = [
  "Nuwan Kumara",
  "S. Karthick",
  "Kasun Perera",
  "Thilini Silva",
  "M. Ramesh",
  "Malini Fernando",
  "Kamal Jayasuriya",
  "V. Vani",
  "A. Roshan",
  "Niroshan De Silva",
  "Dinithi Perera",
  "Sajeewa Bandara",
  "Piyumi Senanayake",
];

function getUserRankAndScore(points: number): { rank: number; score: number } {
  if (points >= 100000) return { rank: 1, score: points };
  if (points >= 85000) return { rank: 2, score: points };
  if (points >= 70000) return { rank: 3, score: points };
  if (points >= 65000) return { rank: 4, score: points };
  if (points >= 60000) return { rank: 5, score: points };
  if (points >= 55000) return { rank: 6, score: points };
  if (points >= 50000) return { rank: 8, score: points };
  if (points >= 40000) return { rank: 15, score: points };
  if (points >= 30000) return { rank: 45, score: points };
  if (points >= 25000) return { rank: 80, score: points };
  if (points >= 15000) return { rank: 120, score: points };
  if (points >= 5000) return { rank: 250, score: points };
  return { rank: 500, score: points };
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
    
    // Generate 10 fake users with random scores between 92,000 - 135,000
    const shuffledNames = [...FAKE_NAMES].sort(() => 0.5 - Math.random());
    const fakeUsers = [];
    for(let i=0; i<10; i++) {
        fakeUsers.push({
            name: shuffledNames[i],
            score: Math.floor(Math.random() * (135000 - 92000 + 1)) + 92000,
            isUser: false,
            rank: 0,
        });
    }

    const combinedList = [...fakeUsers];
    
    if (userRank <= 10) {
      combinedList.push({
        rank: 0,
        name: "YOU",
        score: userScore,
        isUser: true,
      });
    }
    
    combinedList.sort((a, b) => b.score - a.score);
    
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

    // Setup an interval to "refresh" scores every 30 seconds automatically to make it feel alive
    const interval = setInterval(() => {
        loadLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const { rank: userRank } = getUserRankAndScore(totalPoints);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="min-w-8 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold shadow-lg shadow-yellow-400/50 border-2 border-yellow-200">1</div>;
    if (rank === 2) return <div className="min-w-8 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold shadow-lg shadow-slate-300/50 border-2 border-white">2</div>;
    if (rank === 3) return <div className="min-w-8 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-600/50 border-2 border-amber-400">3</div>;
    return <div className="min-w-8 w-8 h-8 rounded-full bg-avurudu-bg flex items-center justify-center text-avurudu-dark font-bold border-2 border-avurudu-yellow/50">{rank}</div>;
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      <header className="w-full flex items-center justify-between z-10 mb-6 max-w-2xl mx-auto">
        <Link href="/games" className="bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex flex-col items-center flex-1">
          <p className="text-xs md:text-sm font-bold text-avurudu-red tracking-widest uppercase">Avurudu Kreeda Championship 2026</p>
          <h1 className="text-xl md:text-3xl font-extrabold text-avurudu-dark drop-shadow-sm text-center flex items-center gap-2">
            Live Leaderboard
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </h1>
        </div>
        <button 
          onClick={loadLeaderboard}
          className={`bg-white/80 p-2 rounded-full shadow-md text-avurudu-dark hover:bg-avurudu-yellow transition-colors ${isRefreshing ? 'animate-spin text-avurudu-orange' : ''}`}
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </header>

      <div className="text-center z-10 mb-6 max-w-2xl mx-auto w-full">
         <p className="text-sm font-bold text-avurudu-dark bg-white/70 inline-block px-4 py-2 rounded-full shadow-sm border border-avurudu-yellow/50">
            Event Period: 12th April - 17th April 2026
         </p>
         <p className="text-xs font-semibold text-avurudu-red mt-2">
            * Final winners will be announced after 17th April 2026
         </p>
      </div>

      <div className="w-full max-w-2xl mx-auto z-10 flex flex-col gap-6 pb-20">
        
        {/* Real Prize Structure Card */}
        <div className="bg-gradient-to-br from-yellow-100 to-orange-50 rounded-3xl p-5 shadow-lg border border-yellow-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <Trophy className="w-32 h-32 text-orange-600" />
          </div>
          <h2 className="text-lg font-black text-avurudu-dark mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-avurudu-red" /> 
            Real Prize Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
             <div className="bg-white/80 rounded-xl p-3 flex flex-col justify-between shadow-sm border border-yellow-200">
                <span className="font-bold text-avurudu-dark flex items-center justify-between mb-1">
                   <span className="flex items-center gap-2">👑 Grand Prize</span>
                   <span className="font-black text-avurudu-red text-lg">LKR 25,000</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">100,000+ KP</span>
             </div>
             <div className="bg-white/80 rounded-xl p-3 flex flex-col justify-between shadow-sm border border-yellow-200">
                <span className="font-bold text-slate-700 flex items-center justify-between mb-1">
                   <span className="flex items-center gap-2">🥈 1st Runner-up</span>
                   <span className="font-black text-avurudu-orange text-lg">LKR 15,000</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">85,000 – 99,999 KP</span>
             </div>
             <div className="bg-white/80 rounded-xl p-3 flex flex-col justify-between shadow-sm border border-yellow-200">
                <span className="font-bold text-amber-700 flex items-center justify-between mb-1">
                   <span className="flex items-center gap-2">🥉 2nd Runner-up</span>
                   <span className="font-black text-avurudu-orange text-lg">LKR 10,000</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">70,000 – 84,999 KP</span>
             </div>
             <div className="bg-white/80 rounded-xl p-3 flex flex-col justify-between shadow-sm border border-yellow-200">
                <span className="font-bold text-avurudu-dark flex items-center justify-between mb-1 text-sm">
                   <span>Positions 4 to 10</span>
                   <span className="font-bold text-avurudu-red text-lg">LKR 2,500 <span className="text-xs">each</span></span>
                </span>
                <span className="text-xs font-semibold text-slate-500">50,000 – 69,999 KP</span>
             </div>
          </div>
          <div className="mt-3 bg-white/80 rounded-xl p-3 flex flex-col justify-between shadow-sm border border-yellow-200 relative z-10">
            <span className="font-bold text-avurudu-dark flex items-center justify-between mb-1 text-sm">
               <span>Positions 11 to 100</span>
               <span className="font-bold text-green-700 text-lg">Free Mobile Reload</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">25,000 – 49,999 KP</span>
          </div>
          
        </div>

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
          <div className="w-full flex flex-col gap-3">
             <div className="bg-white/80 p-3 rounded-xl border border-avurudu-yellow text-center shadow-sm">
                <p className="text-sm font-bold text-avurudu-dark">
                   Play more games and collect as many Kreeda Points as possible before 17th April 2026 to increase your chances of winning big prizes!
                </p>
             </div>
             <div className="animate-pulse-slow">
              <Link href="/claim-prize" className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-white hover:scale-[1.02] transition-transform overflow-hidden relative group">
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                <span className="relative flex items-center justify-center gap-2 drop-shadow-md">
                  🎯 Register to Win Real Prizes
                </span>
              </Link>
             </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-avurudu-yellow relative overflow-hidden">
          {/* Decorative lamps */}
          <div className="absolute top-4 left-4 text-3xl opacity-50">🪔</div>
          <div className="absolute top-4 right-4 text-3xl opacity-50">🪔</div>
          
          <h2 className="text-center text-xl font-bold text-avurudu-dark mb-6 mt-2 flex items-center justify-center gap-2">
            <Activity className="w-6 h-6 text-avurudu-red animate-pulse" />
            Top 10 Heroes
            <Activity className="w-6 h-6 text-avurudu-red animate-pulse" />
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
                  <div className="min-w-8 w-8 h-8 rounded-full bg-avurudu-bg flex items-center justify-center text-avurudu-dark font-bold border-2 border-avurudu-yellow/50">
                    {userRank}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-avurudu-red text-lg">YOU ⭐</span>
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
