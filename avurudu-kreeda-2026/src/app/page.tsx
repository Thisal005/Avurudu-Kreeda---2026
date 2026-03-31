"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Trophy, ShieldAlert } from "lucide-react";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Basic user interaction allows auto-play
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col items-center justify-between p-6 overflow-hidden relative">
      {/* Background Audio */}
      <audio ref={audioRef} loop src="/avurudu-music.mp3" />
      
      {/* Decorative background elements (Placeholder for actual images) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />
      
      {/* Header / Music Toggle */}
      <header className="w-full max-w-md flex justify-end z-10 pt-4">
        <button 
          onClick={toggleMusic}
          className="bg-avurudu-yellow text-avurudu-dark p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="sr-only">Toggle Music</span>
        </button>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full max-w-md mt-10">
        
        {/* Main Title Badge */}
        <div className="bg-avurudu-red border-4 border-avurudu-yellow rounded-2xl p-6 shadow-2xl relative animate-bounce-slow mb-12">
          {/* Top decoration */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-avurudu-yellow px-4 py-1 rounded-full border-2 border-avurudu-red text-avurudu-red font-bold text-sm tracking-wider">
            LEO CLUB PRESENTS
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-avurudu-yellow drop-shadow-md mb-2">
            සුභ අලුත් අවුරුද්දක් වේවා!
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">
            Avurudu Kreeda 2026
          </h2>
          <p className="text-avurudu-yellow/90 font-medium font-sans">
            இனிய புத்தாண்டு நல்வாழ்த்துக்கள்!
          </p>
        </div>

        {/* Call to Action */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl w-full border border-avurudu-yellow/30">
          <Trophy className="w-16 h-16 text-avurudu-orange mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-avurudu-dark mb-6">
            Play Traditional Games & Win Exciting Prizes!
          </h3>
          
          <Link 
            href="/games"
            className="block w-full bg-gradient-to-r from-avurudu-orange to-avurudu-red text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-avurudu-yellow/50"
          >
            PLAY NOW
          </Link>
        </div>
      </div>

      {/* Footer / Cyber Security Warning (Subtle) */}
      <footer className="w-full text-center py-6 z-10 mt-10 flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-avurudu-dark/60 text-sm font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>Educational Cyber Security Awareness Project</span>
        </div>
        <p className="text-avurudu-dark/50 text-xs mt-1">
          &copy; 2026 Leo Club. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
