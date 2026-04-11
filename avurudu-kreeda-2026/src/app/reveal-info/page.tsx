"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Share2, Globe, Home, Gamepad2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";

type Language = "en" | "si" | "ta";

// Content translations
const CONTENT = {
  en: [
    "Everything you just saw was a simulation...",
    "This entire Avurudu Kreeda experience was created as a personal cyber security awareness project.",
    "During every Aluth Avurudu, scammers create fake games, prize competitions, and gift hampers exactly like this.",
    "In 2025, Sri Lanka CERT received over 12,650 complaints related to online scams.",
    "Globally, the FBI’s Internet Crime Complaint Center reported nearly $21 billion in cybercrime losses in 2025.",
    "When you filled that form, in real life, your personal data would have been stolen and misused.",
    "But today, you learned how these scams work.\n\nYou are now aware.\n\nYou have the power to protect yourself and your family.",
    "CREDITS",
    "Suba Aluth Awuruddak Wewa!",
  ],
  si: [
    "ඔබ දැන් දුටු සියල්ලම අනුකරණයක් (Simulation) පමණි...",
    "මෙම සම්පූර්ණ අලුත් අවුරුදු ක්‍රීඩා අත්දැකීම නිර්මාණය කළේ පුද්ගලික සයිබර් ආරක්ෂණ දැනුවත් කිරීමේ ව්‍යාපෘතියක් ලෙසයි.",
    "සෑම අලුත් අවුරුද්දකදීම, වංචාකරුවන් මෙවැනිම ව්‍යාජ ක්‍රීඩා, ත්‍යාග තරඟ දිනාගැනීම් සහ තෑගි මලු නිර්මාණය කරයි.",
    "2025 වසරේදී ශ්‍රී ලංකා CERT ආයතනයට අන්තර්ජාල වංචා සම්බන්ධ පැමිණිලි 12,650 කට වඩා ලැබී ඇත.",
    "ගෝලීය වශයෙන්, FBI හි අන්තර්ජාල අපරාධ පැමිණිලි මධ්‍යස්ථානය 2025 දී ඩොලර් බිලියන 21 කට ආසන්න සයිබර් අපරාධ අලාභ වාර්තා කර ඇත.",
    "ඔබ එම පෝරමය පුරවන විට, සැබෑ ජීවිතයේදී නම් ඔබේ පුද්ගලික දත්ත සොරාගෙන අවභාවිතා වන්නට ඉඩ තිබුණි.",
    "නමුත් අද, මේ වංචාවන් සිදුවන ආකාරය ඔබ ඉගෙන ගත්තා.\n\nඔබ දැන් අවබෝධයෙන් සිටී.\n\nඔබට ඔබ සහ ඔබේ පවුල ආරක්ෂා කර ගැනීමේ බලය ඇත.",
    "CREDITS",
    "සුභ අලුත් අවුරුද්දක් වේවා!",
  ],
  ta: [
    "நீங்கள் இப்போது பார்த்த அனைத்தும் ஒரு உருவகப்படுத்துதல் மட்டுமே...",
    "இந்த முழுமையான சித்திரைப் புத்தாண்டு விளையாட்டு அனுபவம் ஒரு தனிப்பட்ட இணையப் பாதுகாப்பு விழிப்புணர்வு செயற்றிட்டமாக உருவாக்கப்பட்டது.",
    "ஒவ்வொரு புத்தாண்டு காலத்திலும், மோசடிக்காரர்கள் இது போன்ற போலி விளையாட்டுகள், பரிசுக் போட்டிகள் மற்றும் பரிசுப் பொதிகளை உருவாக்குகிறார்கள்.",
    "2025 ஆம் ஆண்டில், இலங்கை CERT இணைய மோசடிகள் தொடர்பான 12,650 க்கும் மேற்பட்ட முறைப்பாடுகளைப் பெற்றுள்ளது.",
    "உலகளாவிய ரீதியில், FBI இன் இணைய குற்ற முறைப்பாட்டு மையம் 2025 இல் 21 பில்லியன் டொலர்களுக்கும் அதிகமான இணைய குற்ற இழப்புகளைப் பதிவு செய்துள்ளது.",
    "நீங்கள் அந்தப் படிவத்தை நிரப்பியபோது, உண்மையான வாழ்க்கையில் உங்கள் தனிப்பட்ட தரவுகள் திருடப்பட்டு தவறாகப் பயன்படுத்தப்பட்டிருக்கலாம்.",
    "ஆனால் இன்று, இந்த மோசடிகள் எவ்வாறு செயல்படுகின்றன என்பதை நீங்கள் கற்றுக்கொண்டீர்கள்.\n\nநீங்கள் இப்போது விழிப்புடன் இருக்கிறீர்கள்.\n\nஉங்களையும் உங்கள் குடும்பத்தையும் பாதுகாக்கும் சக்தி உங்களிடம் உள்ளது.",
    "CREDITS",
    "இனிய புத்தாண்டு நல்வாழ்த்துக்கள்!",
  ],
};

const CREDITS_CONTENT = `This is idea and concept by Thisal Thiranjith
thisalth.dev

Prompts : Grok
Implemented using : Antigravity (Claude Opus 4.6 and Gemini 3.1 Pro)
Optimized using : Cursor (Composer 2)
Images and assets : Google Flow (Nano Banana Pro)
Video assets : Google (VEO 3)
Music : YouTube (respect authors)`;

/* Typewriter Component */
const TypewriterText = ({ 
  text, 
  onComplete, 
  isCredits,
  isFinal
}: { 
  text: string; 
  onComplete: () => void;
  isCredits?: boolean;
  isFinal?: boolean;
}) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    
    // Split texts by lines to render properly or process whole
    const speed = isCredits ? 15 : 45; // Faster for credits
    
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        
        // Wait longer on the final scene so it doesn't fade, or trigger buttons
        if (isFinal) {
          onComplete(); // Instantly show buttons
        } else {
          // Stay on screen based on length
          const stayDuration = isCredits ? 5000 : Math.max(3000, text.length * 60);
          setTimeout(onComplete, stayDuration);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, onComplete, isCredits, isFinal]);

  const output = displayed.split('\n').map((line, idx) => (
    <React.Fragment key={idx}>
      {line}
      {idx < displayed.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div 
      className={`relative z-10 transition-opacity duration-1000 
        ${isFinal ? "text-4xl md:text-6xl font-black text-[#ffaa55] drop-shadow-[0_0_25px_rgba(255,100,0,0.8)]" : 
        isCredits ? "text-lg md:text-2xl font-mono text-center text-[#ffddbb] drop-shadow-[0_0_15px_rgba(255,50,0,0.5)]" : 
        "text-2xl md:text-4xl font-bold text-center text-white drop-shadow-[0_0_20px_rgba(255,50,50,0.9)]"}
      `}
      style={{
        lineHeight: isCredits ? "1.8" : "1.5"
      }}
    >
      {output}
      <span className="animate-pulse ml-1 inline-block text-[#ff5555]">_</span>
    </div>
  );
};


export default function RevealInfoPage() {
  const router = useRouter();
  const [currentScene, setCurrentScene] = useState(0);
  const [lang, setLang] = useState<Language>("en");
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [showButtons, setShowButtons] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalScenes = CONTENT[lang].length;

  const handleTextComplete = () => {
    if (currentScene < totalScenes - 1) {
      setFadeState("out");
      setTimeout(() => {
        setCurrentScene(s => s + 1);
        setFadeState("in");
      }, 1200); // Wait for fade out to complete before next scene
    } else {
      setTimeout(() => {
        setShowButtons(true);
      }, 1000);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Avurudu Kreeda - Scam Awareness',
          text: 'I just learned how online scammers target us during Avurudu! Learn how to protect yourself.',
          url: window.location.origin, // Share the home page URL
        });
      } else {
        navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard!');
      }
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  // Skip feature for debugging or impatient users
  const skipToNext = () => {
    if (currentScene < totalScenes - 1) {
      setFadeState("out");
      setTimeout(() => {
        setCurrentScene(s => s + 1);
        setFadeState("in");
      }, 500);
    }
  };

  const currentContent = CONTENT[lang][currentScene];
  const isCreditsScene = currentScene === totalScenes - 2;
  const isFinalScene = currentScene === totalScenes - 1;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans select-none" onClick={skipToNext}>
      
      {/* --- INLINE STYLES FOR ANIMATIONS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float-up {
          0% { transform: translateY(100vh); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-20vh); opacity: 0; }
        }
        @keyframes flicker {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes cin-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
      `}} />

      {/* --- BACKGROUND EFFECTS --- */}
      {/* Deep intense gradient background */}
      <div 
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_#3a0000_0%,_#110000_60%,_#000000_100%)] opacity-80"
        style={{ animation: 'cin-zoom 30s infinite alternate ease-in-out' }}
      />
      
      {/* Light glow (Oil lamps effect) */}
      <div className="absolute z-0 bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-[radial-gradient(circle_at_center,_rgba(255,100,0,0.15)_0%,_transparent_70%)] mix-blend-screen" style={{ animation: 'flicker 4s infinite ease-in-out' }} />
      <div className="absolute z-0 top-[10%] right-[10%] w-[30vw] h-[30vw] bg-[radial-gradient(circle_at_center,_rgba(200,20,0,0.1)_0%,_transparent_70%)] mix-blend-screen" style={{ animation: 'flicker 6s infinite ease-in-out 1s' }} />

      {/* Digital / ember particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {mounted && Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              background: Math.random() > 0.5 ? '#ff3300' : '#ffaa00',
              boxShadow: '0 0 8px currentColor',
              animation: `float-up ${10 + Math.random() * 15}s linear infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* --- LANGUAGE TOGGLE --- */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        {(["en", "si", "ta"] as Language[]).map((l) => (
          <button
            key={l}
            onClick={(e) => { e.stopPropagation(); setLang(l); }}
            className={`px-3 py-1 rounded text-sm font-semibold transition-all border
              ${lang === l 
                ? "bg-red-900/80 text-white border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.5)]" 
                : "bg-black/50 text-gray-500 border-gray-800 hover:text-gray-300"
              }
            `}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* --- SCENE CONTENT --- */}
      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div 
          className={`transition-opacity duration-1000 ease-in-out ${
            fadeState === "in" ? "opacity-100" : "opacity-0"
          }`}
        >
          {isCreditsScene ? (
            <TypewriterText 
              text={CREDITS_CONTENT} 
              onComplete={handleTextComplete} 
              isCredits 
            />
          ) : (
            <TypewriterText 
              text={currentContent} 
              onComplete={handleTextComplete} 
              isFinal={isFinalScene}
            />
          )}

          {isFinalScene && fadeState === "in" && (
            <div 
              className={`mt-16 flex flex-col items-center gap-8 transition-all duration-1000 ease-out transform ${
                showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* PRIMARY CTA */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-700 to-[#d00000] text-white font-bold text-lg md:text-xl shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:shadow-[0_0_45px_rgba(255,50,0,0.8)] hover:scale-105 transition-all duration-300 border border-red-500/50"
              >
                <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Share this Awareness with Your Family
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>

              {/* SECONDARY BUTTONS */}
              <div className="flex gap-4 flex-wrap justify-center">
                <Link href="https://thisalth.dev" target="_blank" onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white hover:border-red-500 hover:bg-red-950/30 transition-all font-medium">
                    <Globe className="w-4 h-4" />
                    Visit My Website
                  </button>
                </Link>
                
                <Link href="https://github.com" target="_blank" onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white hover:border-red-500 hover:bg-red-950/30 transition-all font-medium">
                    <FaGithub className="w-4 h-4" />
                    View Project on GitHub
                  </button>
                </Link>
              </div>

              <div className="flex gap-4 flex-wrap justify-center">
                <Link href="/" onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white hover:border-orange-500 hover:bg-orange-950/30 transition-all font-medium">
                    <Home className="w-4 h-4" />
                    Return to Avurudu Village
                  </button>
                </Link>
                
                <Link href="/games" onClick={(e) => e.stopPropagation()}>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/60 border border-gray-700 text-gray-300 hover:text-white hover:border-orange-500 hover:bg-orange-950/30 transition-all font-medium">
                    <Gamepad2 className="w-4 h-4" />
                    Play Games Again
                  </button>
                </Link>
              </div>

              {/* SOURCES SECTION */}
              <div className="mt-12 w-full max-w-2xl border-t border-red-900/30 pt-8">
                <h3 className="text-red-500/80 text-xs font-bold uppercase tracking-wider mb-4 md:text-sm text-center">
                  Sources & References
                </h3>
                <ul className="text-gray-500 text-xs md:text-sm space-y-2 flex flex-col items-center">
                  <li className="hover:text-gray-300 transition-colors cursor-default">
                    • Sri Lanka Computer Emergency Readiness Team (CERT) - 2025 Annual Complaints
                  </li>
                  <li className="hover:text-gray-300 transition-colors cursor-default">
                    • Sri Lanka CERT - April 2026 Avurudu Scam Warnings
                  </li>
                  <li className="hover:text-gray-300 transition-colors cursor-default">
                    • FBI Internet Crime Complaint Center (IC3) - 2025 Annual Report
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
