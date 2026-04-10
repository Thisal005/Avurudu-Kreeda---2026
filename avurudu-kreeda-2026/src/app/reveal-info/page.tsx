"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */
type Lang = "en" | "si" | "ta";

interface SceneItem {
  text: string;
  emphasis?: boolean;
  highlight?: string;
  isCredits?: boolean;
  isGreeting?: boolean;
}

interface LangContent {
  scenes: SceneItem[];
  sourcesTitle: string;
  sources: string[];
  shareBtn: string;
  websiteBtn: string;
  githubBtn: string;
  homeBtn: string;
  playBtn: string;
}

/* ================================================================== */
/*  Credits Block (same in all languages)                              */
/* ================================================================== */
const CREDITS_BLOCK: SceneItem = {
  text: [
    "Idea & Concept by Thisal Thiranjith",
    "thisalth.dev",
    "",
    "Prompts · Grok",
    "Implemented using · Antigravity",
    "(Claude Opus 4.6 & Gemini 3.1 Pro)",
    "Optimized using · Cursor (Composer 2)",
    "Images & Assets · Google Flow (Nano Banana Pro)",
    "Video Assets · Google (VEO 3)",
    "Music · YouTube (respect authors)",
  ].join("\n"),
  isCredits: true,
};

/* ================================================================== */
/*  Multilingual Content                                               */
/* ================================================================== */
const CONTENT: Record<Lang, LangContent> = {
  en: {
    scenes: [
      { text: "Everything you just saw was a simulation..." },
      { text: "This entire Avurudu Kreeda experience was created as a personal cyber security awareness project." },
      { text: "During every Aluth Avurudu, scammers create fake games, prize competitions, and gift hampers exactly like this." },
      { text: "In 2025, Sri Lanka CERT received over 12,650 complaints related to online scams.", highlight: "12,650" },
      { text: "Globally, the FBI's Internet Crime Complaint Center reported nearly $21 billion in cybercrime losses in 2025.", highlight: "$21 billion" },
      { text: "When you filled that form, in real life, your personal data would have been stolen and misused." },
      {
        text: "But today, you learned how these scams work.\nYou are now aware.\nYou have the power to protect yourself and your family.",
        emphasis: true,
      },
      CREDITS_BLOCK,
      { text: "සුභ අලුත් අවුරුද්දක් වේවා!", isGreeting: true },
    ],
    sourcesTitle: "Sources",
    sources: [
      "Sri Lanka Computer Emergency Readiness Team (CERT) — 2025 Annual Complaints",
      "Sri Lanka CERT — April 2026 Avurudu Scam Warnings",
      "FBI Internet Crime Complaint Center (IC3) — 2025 Annual Report",
    ],
    shareBtn: "Share this Awareness with Your Family",
    websiteBtn: "Visit My Website",
    githubBtn: "View Project on GitHub",
    homeBtn: "Return to Avurudu Village",
    playBtn: "Play Games Again",
  },
  si: {
    scenes: [
      { text: "ඔබ දැන් දුටු සියල්ල අනුකරණයක් පමණි..." },
      { text: "මෙම සම්පුර්ණ අවුරුදු ක්‍රීඩා අත්දැකීම පුද්ගලික සයිබර් ආරක්ෂණ දැනුවත් කිරීමේ ව්‍යාපෘතියක් ලෙස නිර්මාණය කරන ලදී." },
      { text: "සෑම අලුත් අවුරුද්දකටම වංචාකරුවන් මේ වගේම ව්‍යාජ ක්‍රීඩා, ත්‍යාග තරඟ සහ තෑගි කට්ටල නිර්මාණය කරති." },
      { text: "2025 දී, ශ්‍රී ලංකා CERT ආයතනයට අන්තර්ජාල වංචා සම්බන්ධ පැමිණිලි 12,650කට වැඩියෙන් ලැබුණි.", highlight: "12,650" },
      { text: "ගෝලීය වශයෙන්, FBI අන්තර්ජාල අපරාධ පැමිණිලි මධ්‍යස්ථානය 2025 සයිබර් අපරාධ පාඩු ඩොලර් බිලියන 21ක් ලෙස වාර්තා කළේය.", highlight: "බිලියන 21" },
      { text: "ඔබ එම පෝරමය පුරවන විට, සැබෑ ජීවිතයේ ඔබගේ පෞද්ගලික දත්ත සොරකම් කර අනිසි ලෙස භාවිතා කරනු ඇත." },
      {
        text: "නමුත් අද, ඔබ මෙම වංචා ක්‍රියා කරන ආකාරය ඉගෙන ගත්තා.\nඔබ දැන් දැනුවත්.\nඔබට සහ ඔබගේ පවුලට ආරක්ෂා වීමට ශක්තිය ඇත.",
        emphasis: true,
      },
      CREDITS_BLOCK,
      { text: "සුභ අලුත් අවුරුද්දක් වේවා!", isGreeting: true },
    ],
    sourcesTitle: "මූලාශ්‍ර",
    sources: [
      "ශ්‍රී ලංකා CERT — 2025 වාර්ෂික පැමිණිලි",
      "ශ්‍රී ලංකා CERT — 2026 අප්‍රේල් අවුරුදු වංචා අනතුරු ඇඟවීම්",
      "FBI IC3 — 2025 වාර්ෂික වාර්තාව",
    ],
    shareBtn: "මෙම දැනුවත් කිරීම ඔබගේ පවුලට බෙදාගන්න",
    websiteBtn: "මගේ වෙබ් අඩවියට පිවිසෙන්න",
    githubBtn: "GitHub හි ව්‍යාපෘතිය බලන්න",
    homeBtn: "අවුරුදු ගම්මානයට ආපසු",
    playBtn: "ක්‍රීඩා නැවත සෙල්ලම් කරන්න",
  },
  ta: {
    scenes: [
      { text: "நீங்கள் இப்போது பார்த்தவை அனைத்தும் ஒரு உருவகப்படுத்துதல் மட்டுமே..." },
      { text: "இந்த முழு அவுருது கிரீடா அனுபவமும் தனிப்பட்ட இணைய பாதுகாப்பு விழிப்புணர்வு திட்டமாக உருவாக்கப்பட்டது." },
      { text: "ஒவ்வொரு புத்தாண்டுக்கும் மோசடி செய்பவர்கள் இது போன்றே போலி விளையாட்டுகள், பரிசு போட்டிகள் உருவாக்குகின்றனர்." },
      { text: "2025 இல், இலங்கை CERT க்கு ஆன்லைன் மோசடிகள் தொடர்பான 12,650 க்கும் மேற்பட்ட புகார்கள் வந்தன.", highlight: "12,650" },
      { text: "உலகளவில், FBI இணைய குற்ற புகார் மையம் 2025 இல் $21 பில்லியன் இழப்புகளை பதிவு செய்தது.", highlight: "$21 பில்லியன்" },
      { text: "நீங்கள் அந்த படிவத்தை நிரப்பும்போது, நிஜ வாழ்க்கையில் உங்கள் தனிப்பட்ட தரவு திருடப்பட்டு தவறாக பயன்படுத்தப்பட்டிருக்கும்." },
      {
        text: "ஆனால் இன்று, இந்த மோசடிகள் எவ்வாறு செயல்படுகின்றன என்பதை கற்றுக்கொண்டீர்கள்.\nஇப்போது நீங்கள் விழிப்புடன் இருக்கிறீர்கள்.\nஉங்களையும் குடும்பத்தையும் பாதுகாக்கும் சக்தி உங்களிடம் உள்ளது.",
        emphasis: true,
      },
      CREDITS_BLOCK,
      { text: "இனிய புத்தாண்டு நல்வாழ்த்துக்கள்!", isGreeting: true },
    ],
    sourcesTitle: "ஆதாரங்கள்",
    sources: [
      "இலங்கை CERT — 2025 வருடாந்த புகார்கள்",
      "இலங்கை CERT — 2026 ஏப்ரல் மோசடி எச்சரிக்கைகள்",
      "FBI IC3 — 2025 வருடாந்த அறிக்கை",
    ],
    shareBtn: "இந்த விழிப்புணர்வை உங்கள் குடும்பத்துடன் பகிரவும்",
    websiteBtn: "எனது இணையதளத்தைப் பார்வையிடவும்",
    githubBtn: "GitHub இல் திட்டத்தைப் பாருங்கள்",
    homeBtn: "அவுருது கிராமத்திற்கு திரும்பவும்",
    playBtn: "மீண்டும் விளையாடவும்",
  },
};

/* ================================================================== */
/*  Typewriter Hook                                                    */
/* ================================================================== */
function useTypewriter(text: string, speed = 30, active = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      setDone(false);
      indexRef.current = 0;
      return;
    }
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const iv = setInterval(() => {
      indexRef.current++;
      if (indexRef.current > text.length) {
        clearInterval(iv);
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);

    return () => clearInterval(iv);
  }, [text, speed, active]);

  return { displayed, done };
}

/* ================================================================== */
/*  Oil Lamp Component                                                 */
/* ================================================================== */
function OilLamp({ x, bottom, scale = 1, delay = 0 }: { x: string; bottom: string; scale?: number; delay?: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, bottom, transform: `scale(${scale})`, transformOrigin: "bottom center" }}
    >
      {/* Warm glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2"
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,180,80,0.5) 0%, rgba(255,120,40,0.15) 40%, transparent 70%)",
          animation: "infoGlow 3.5s ease-in-out infinite",
          animationDelay: `${delay}ms`,
        }}
      />
      {/* Flame */}
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2"
        style={{
          width: 11,
          height: 18,
          borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%",
          background: "linear-gradient(to top, #f97316, #fbbf24, #fef3c7)",
          boxShadow: "0 0 14px 5px rgba(251,146,36,0.55), 0 0 30px 8px rgba(255,100,20,0.15)",
          animation: "infoFlame 2s ease-in-out infinite",
          animationDelay: `${delay + 200}ms`,
        }}
      />
      {/* Body */}
      <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
        <ellipse cx="19" cy="7" rx="5.5" ry="3" fill="#c2410c" />
        <path d="M13.5 7 C13.5 7 10.5 15 8.5 24 L29.5 24 C27.5 15 24.5 7 24.5 7" fill="url(#lgr)" />
        <ellipse cx="19" cy="24" rx="10.5" ry="4" fill="#7c2d12" />
        <defs>
          <linearGradient id="lgr" x1="19" y1="7" x2="19" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ea580c" />
            <stop offset="1" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function RevealInfoPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [currentScene, setCurrentScene] = useState(-1);
  const [showFinal, setShowFinal] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });

  const content = CONTENT[lang];
  const totalScenes = content.scenes.length;

  /* --- Particles --- */
  const particles = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 5,
        dur: 5 + Math.random() * 10,
        delay: Math.random() * 8,
        o: 0.2 + Math.random() * 0.5,
        isRed: i < 12, // first 12 are red digital particles
      })),
    []
  );

  /* --- Boot --- */
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentScene(0);
      setSceneVisible(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  /* --- Camera drift --- */
  useEffect(() => {
    const iv = setInterval(() => {
      setCamera({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 5,
        z: 1 + Math.random() * 0.04,
      });
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  /* --- Active scene data --- */
  const scene: SceneItem | null =
    currentScene >= 0 && currentScene < totalScenes ? content.scenes[currentScene] : null;

  const twSpeed = scene?.isCredits ? 18 : scene?.emphasis ? 36 : 28;
  const { displayed, done } = useTypewriter(
    scene?.text ?? "",
    twSpeed,
    sceneVisible && !!scene
  );

  /* --- Advance --- */
  const advanceScene = useCallback(() => {
    if (showFinal) return;
    if (currentScene < totalScenes - 1) {
      setSceneVisible(false);
      setTimeout(() => {
        setCurrentScene((s) => s + 1);
        setSceneVisible(true);
      }, 800);
    } else {
      setSceneVisible(false);
      setTimeout(() => setShowFinal(true), 800);
    }
  }, [currentScene, totalScenes, showFinal]);

  /* --- Auto-advance --- */
  useEffect(() => {
    if (!done || showFinal || !scene) return;
    const wait = scene.isCredits ? 6000 : scene.isGreeting ? 5000 : scene.emphasis ? 4500 : 3000;
    const t = setTimeout(advanceScene, wait);
    return () => clearTimeout(t);
  }, [done, advanceScene, scene, showFinal]);

  /* --- Share --- */
  const handleShare = async () => {
    const data = {
      title: "Cyber Security Awareness — Avurudu Kreeda 2026",
      text: "I just experienced a powerful cyber security awareness simulation. Never share personal details for fake prizes! Think Twice. Verify Always. 🛡️🪔",
      url: window.location.origin,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
        alert("Link copied! Share it with your family.");
      }
    } catch { /* user cancelled */ }
  };

  /* --- Highlight render --- */
  const renderHighlight = (text: string, hl?: string) => {
    if (!hl) return text;
    const idx = text.indexOf(hl);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="info-hl">{hl}</span>
        {text.slice(idx + hl.length)}
      </>
    );
  };

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: "#0a0000" }}>
      {/* ============================================================ */}
      {/*  CINEMATIC BACKGROUND                                        */}
      {/* ============================================================ */}
      <div
        className="absolute inset-[-5%] transition-all duration-[6000ms] ease-in-out"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}
      >
        {/* Dark-red gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 130% 90% at 50% 120%, rgba(200,40,20,0.4) 0%, transparent 55%),
              radial-gradient(ellipse 90% 50% at 15% 15%, rgba(255,80,30,0.1) 0%, transparent 50%),
              radial-gradient(ellipse 70% 45% at 85% 25%, rgba(180,30,10,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(120,20,10,0.15) 0%, transparent 60%),
              linear-gradient(175deg,
                #1a0505 0%,
                #2a0a08 15%,
                #3d120c 30%,
                #501810 45%,
                #3a100a 65%,
                #200805 80%,
                #0a0000 100%
              )
            `,
          }}
        />

        {/* Dramatic top light bloom */}
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2"
          style={{
            width: "160vw",
            height: "60vh",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,100,40,0.06) 0%, rgba(200,40,10,0.03) 40%, transparent 65%)",
            animation: "infoGlow 10s ease-in-out infinite",
          }}
        />

        {/* Oil Lamps */}
        <OilLamp x="6%" bottom="3%" scale={0.95} delay={0} />
        <OilLamp x="90%" bottom="5%" scale={0.88} delay={500} />
        <OilLamp x="46%" bottom="1%" scale={0.72} delay={1000} />

        {/* Floating particles — mix of warm golden + digital red */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: p.isRed
                ? `radial-gradient(circle, rgba(255,60,30,${p.o}) 0%, rgba(200,20,10,${p.o * 0.3}) 60%, transparent 100%)`
                : `radial-gradient(circle, rgba(255,200,100,${p.o}) 0%, rgba(255,150,50,${p.o * 0.35}) 60%, transparent 100%)`,
              boxShadow: p.isRed
                ? `0 0 ${p.size * 2}px rgba(255,50,20,${p.o * 0.4})`
                : `0 0 ${p.size * 2}px rgba(255,180,80,${p.o * 0.5})`,
              animation: `infoFloat ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 25%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ============================================================ */}
      {/*  LANGUAGE TOGGLE                                              */}
      {/* ============================================================ */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5">
        {(["en", "si", "ta"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLang(l);
              if (!showFinal) {
                setSceneVisible(false);
                setTimeout(() => { setCurrentScene(0); setSceneVisible(true); }, 400);
              }
            }}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
            style={{
              background: lang === l
                ? "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(185,28,28,0.9))"
                : "rgba(255,255,255,0.06)",
              color: lang === l ? "#fff" : "rgba(255,200,180,0.5)",
              border: lang === l ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(255,255,255,0.06)",
              boxShadow: lang === l ? "0 0 18px rgba(239,68,68,0.25)" : "none",
            }}
          >
            {l === "en" ? "EN" : l === "si" ? "සිං" : "தமி"}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  SCENE CONTENT                                                */}
      {/* ============================================================ */}
      {!showFinal && scene && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center px-6 py-16"
          style={{
            opacity: sceneVisible ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(.4,0,.2,1)",
          }}
        >
          <div className="max-w-lg w-full text-center">
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-10">
              {Array.from({ length: totalScenes }).map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] rounded-full transition-all duration-700"
                  style={{
                    width: i === currentScene ? 30 : 7,
                    background:
                      i < currentScene
                        ? "rgba(239,68,68,0.5)"
                        : i === currentScene
                        ? "linear-gradient(90deg, #ef4444, #f97316)"
                        : "rgba(255,255,255,0.08)",
                    boxShadow: i === currentScene ? "0 0 12px rgba(239,68,68,0.4)" : "none",
                  }}
                />
              ))}
            </div>

            {/* ---------- Credits Scene ---------- */}
            {scene.isCredits ? (
              <div className="info-credits">
                {displayed.split("\n").map((line, i) => {
                  if (line === "") return <div key={i} className="h-4" />;
                  // First line = main credit, second = url
                  const isTitle = i === 0;
                  const isUrl = i === 1;
                  const isTool = line.includes("·");
                  return (
                    <p
                      key={i}
                      className={i > 0 ? "mt-1" : ""}
                      style={{
                        fontSize: isTitle
                          ? "clamp(1rem, 4vw, 1.3rem)"
                          : isUrl
                          ? "clamp(0.8rem, 3vw, 0.95rem)"
                          : "clamp(0.75rem, 2.8vw, 0.88rem)",
                        fontWeight: isTitle ? 700 : isTool ? 500 : 400,
                        color: isTitle
                          ? "rgba(255,220,200,0.92)"
                          : isUrl
                          ? "rgba(251,146,60,0.7)"
                          : isTool
                          ? "rgba(255,200,180,0.55)"
                          : "rgba(255,200,180,0.35)",
                        letterSpacing: isTitle ? "0.02em" : isTool ? "0.03em" : "0.01em",
                        fontStyle: isUrl ? "italic" : "normal",
                      }}
                    >
                      {line}
                    </p>
                  );
                })}
                {!done && <span className="info-cursor">|</span>}
              </div>
            ) : scene.isGreeting ? (
              /* ---------- Greeting Scene ---------- */
              <div>
                <p
                  className="info-greeting"
                  style={{
                    fontSize: "clamp(1.8rem, 7vw, 3.2rem)",
                    fontWeight: 900,
                    lineHeight: 1.3,
                    background: "linear-gradient(135deg, #fcd34d, #f97316, #ef4444)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 30px rgba(249,115,22,0.4))",
                  }}
                >
                  {displayed}
                  {!done && <span className="info-cursor-gold">|</span>}
                </p>
                {done && (
                  <p
                    className="mt-4"
                    style={{
                      color: "rgba(255,200,150,0.4)",
                      fontSize: "0.85rem",
                      animation: "infoFadeUp 1s ease-out 0.5s both",
                    }}
                  >
                    🪔 Happy Sinhala & Tamil New Year 2026 🪔
                  </p>
                )}
              </div>
            ) : (
              /* ---------- Normal Scene ---------- */
              <div
                className={`info-text ${scene.emphasis ? "info-emphasis" : ""}`}
                style={{
                  fontSize: scene.emphasis
                    ? "clamp(1.1rem, 4.5vw, 1.6rem)"
                    : "clamp(1rem, 4vw, 1.4rem)",
                  lineHeight: 1.75,
                }}
              >
                {displayed.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {renderHighlight(line, scene.highlight)}
                  </p>
                ))}
                {!done && <span className="info-cursor">|</span>}
              </div>
            )}

            {/* Tap to skip */}
            {done && !scene.isGreeting && currentScene < totalScenes - 1 && (
              <button
                onClick={advanceScene}
                className="mt-10 text-red-400/30 text-[11px] font-medium tracking-[0.15em] uppercase hover:text-red-400/60 transition-colors duration-300"
              >
                tap to continue ›
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  FINAL SCENE                                                  */}
      {/* ============================================================ */}
      {showFinal && (
        <div
          className="absolute inset-0 z-30 overflow-y-auto"
          style={{ animation: "infoFadeUp 1s ease-out" }}
        >
          <div className="min-h-full flex flex-col items-center px-6 pt-10 pb-16">
            {/* Greeting */}
            <h1
              className="text-center font-black tracking-tight mb-2"
              style={{
                fontSize: "clamp(1.6rem, 6.5vw, 2.6rem)",
                background: "linear-gradient(135deg, #fcd34d, #f97316, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 24px rgba(249,115,22,0.35))",
              }}
            >
              {lang === "ta" ? "இனிய புத்தாண்டு நல்வாழ்த்துக்கள்!" : "සුභ අලුත් අවුරුද්දක් වේවා!"}
            </h1>

            <p
              className="text-center mb-8"
              style={{ color: "rgba(255,200,150,0.35)", fontSize: "0.8rem" }}
            >
              🪔 Happy Sinhala & Tamil New Year 2026 🪔
            </p>

            {/* Shield */}
            <div
              className="mb-6"
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "infoGlow 3s ease-in-out infinite",
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" stroke="#4ade80" strokeWidth="2.2" />
              </svg>
            </div>

            {/* Message card */}
            <div
              className="max-w-md w-full rounded-2xl p-6 mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(180,40,20,0.04))",
                border: "1px solid rgba(239,68,68,0.12)",
                boxShadow: "0 0 50px rgba(239,68,68,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p
                className="text-center leading-relaxed mb-5"
                style={{
                  color: "rgba(255,225,200,0.82)",
                  fontSize: "clamp(0.88rem, 3.5vw, 1.02rem)",
                  fontWeight: 500,
                }}
              >
                {lang === "si"
                  ? "නොදන්නා සබැඳි වලින් එන 'නොමිලේ ත්‍යාග', 'ක්‍රීඩා' හෝ 'තරඟ' සඳහා ඔබගේ පෞද්ගලික තොරතුරු කිසිවිටෙකත් බෙදා නොගන්න."
                  : lang === "ta"
                  ? "அறியாத இணைப்புகளில் இருந்து வரும் 'இலவச பரிசு', 'விளையாட்டு' அல்லது 'போட்டி' என்ற எதற்கும் உங்கள் தனிப்பட்ட விவரங்களை பகிர வேண்டாம்."
                  : "Never share your personal details for any 'Free Prize', 'Game' or 'Competition' from unknown links."}
              </p>
              <p
                className="text-center font-extrabold leading-snug"
                style={{
                  color: "#f97316",
                  fontSize: "clamp(1rem, 4.2vw, 1.25rem)",
                  textShadow: "0 0 20px rgba(249,115,22,0.25)",
                }}
              >
                {lang === "si"
                  ? "දෙවරක් සිතන්න. සැමවිට සත්‍යාපනය කරන්න. ඔබගේ පවුල ආරක්ෂා කරන්න."
                  : lang === "ta"
                  ? "இரண்டு முறை யோசியுங்கள். எப்போதும் சரிபார்க்கவும். உங்கள் குடும்பத்தை பாதுகாக்கவும்."
                  : "Think Twice. Verify Always. Protect Your Family."}
              </p>
            </div>

            {/* Sources */}
            <div
              className="max-w-md w-full rounded-xl p-5 mb-10"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <h3
                className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: "rgba(239,68,68,0.45)" }}
              >
                {content.sourcesTitle}
              </h3>
              <ul className="space-y-2">
                {content.sources.map((src, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] leading-relaxed"
                    style={{ color: "rgba(255,210,190,0.35)" }}
                  >
                    <span className="mt-0.5 flex-shrink-0" style={{ color: "rgba(239,68,68,0.3)" }}>•</span>
                    {src}
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- CTA Buttons ---- */}
            <div className="max-w-md w-full space-y-3 mb-12">
              {/* 1. Share — Primary */}
              <button
                onClick={handleShare}
                className="w-full group relative overflow-hidden rounded-2xl"
              >
                <div
                  className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    filter: "blur(18px)",
                    transform: "scale(1.15)",
                  }}
                />
                <div
                  className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[15px] transition-transform active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                    color: "#fff",
                    border: "1px solid rgba(252,165,165,0.25)",
                    boxShadow: "0 0 28px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  {/* Share icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  {content.shareBtn}
                </div>
              </button>

              {/* 2. Visit Website */}
              <a
                href="https://thisalth.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "rgba(255,200,180,0.75)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {content.websiteBtn}
              </a>

              {/* 3. GitHub */}
              <a
                href="https://github.com/Thisal005"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,200,180,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {content.githubBtn}
              </a>

              {/* 4. Return Home */}
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  color: "rgba(255,200,180,0.45)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {content.homeBtn}
              </button>

              {/* 5. Play Again */}
              <button
                onClick={() => router.push("/games")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  color: "rgba(255,200,180,0.3)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {content.playBtn}
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-[10px]" style={{ color: "rgba(255,200,180,0.15)" }}>
              © 2026 Thisal Thiranjith — Cyber Security Awareness Project
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STYLES                                                       */}
      {/* ============================================================ */}
      <style jsx>{`
        @keyframes infoGlow {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes infoFlame {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.78; }
          25% { transform: scaleY(1.18) translateY(-1.5px); opacity: 1; }
          50% { transform: scaleY(0.92) translateY(1px); opacity: 0.82; }
          75% { transform: scaleY(1.12) translateY(-2px); opacity: 0.96; }
        }
        @keyframes infoFloat {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          15% { opacity: 1; }
          50% { transform: translate(14px, -35px) scale(1.15); }
          85% { opacity: 0.4; }
          100% { opacity: 0; transform: translate(-8px, -60px) scale(0.4); }
        }
        @keyframes infoFadeUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .info-text {
          color: rgba(255, 225, 200, 0.88);
          font-weight: 500;
          letter-spacing: 0.015em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.6), 0 0 40px rgba(200,40,20,0.08);
        }
        .info-emphasis {
          color: #fde68a;
          font-weight: 700;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5), 0 0 30px rgba(253,230,138,0.12);
        }
        .info-hl {
          color: #fb923c;
          font-weight: 800;
          text-shadow: 0 0 20px rgba(251,146,60,0.4);
        }
        .info-credits {
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .info-cursor {
          color: #ef4444;
          animation: infoBlink 700ms steps(1) infinite;
          margin-left: 2px;
          font-weight: 300;
          text-shadow: 0 0 8px rgba(239,68,68,0.5);
        }
        .info-cursor-gold {
          color: #f97316;
          animation: infoBlink 700ms steps(1) infinite;
          margin-left: 2px;
          font-weight: 300;
        }
        @keyframes infoBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .info-greeting {
          text-shadow: none;
        }
      `}</style>
    </div>
  );
}
