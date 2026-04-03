"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Dynamically import the Phaser game component with ssr: false
// This is required because Phaser uses the window object
const GiniUthsawayaGame = dynamic(
  () => import("../../../components/GiniUthsawayaGame"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white">
        <Loader2 className="w-12 h-12 text-avurudu-orange animate-spin mb-4" />
        <p className="text-xl font-bold animate-pulse">Setting up the grounds...</p>
      </div>
    )
  }
);

export default function GiniUthsawayaPage() {
  return (
    <main className="min-h-screen bg-[#0a0a1a] overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white">
          <Loader2 className="w-12 h-12 text-avurudu-orange animate-spin mb-4" />
          <p className="text-xl font-bold animate-pulse">Lighting the matches...</p>
        </div>
      }>
        <GiniUthsawayaGame />
      </Suspense>
    </main>
  );
}
