"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FormData {
  fullName: string;
  age: string;
  email: string;
  contactNumber: string;
  nic: string;
  deliveryAddress: string;
}

interface ErrorPopup {
  id: number;
  title: string;
  message: string;
  x: number;
  y: number;
  delay: number;
}

interface Notification {
  id: number;
  text: string;
  icon: string;
  delay: number;
  side: "left" | "right" | "top";
}

interface TerminalLine {
  text: string;
  delay: number;
  isError?: boolean;
  isSuccess?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shock Page                                                         */
/* ------------------------------------------------------------------ */
export default function RevealShockPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [phase, setPhase] = useState(0); // 0=init, 1=errors, 2=terminal, 3=notifications, 4=climax, 5=button
  const [formData, setFormData] = useState<FormData | null>(null);
  const [visibleErrors, setVisibleErrors] = useState<ErrorPopup[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [visibleNotifs, setVisibleNotifs] = useState<Notification[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [scanlines, setScanlines] = useState(false);
  const [screenCrack, setScreenCrack] = useState(false);
  const [warningBanner, setWarningBanner] = useState(false);
  const [dataLeakBar, setDataLeakBar] = useState(0);
  const [showDataLeak, setShowDataLeak] = useState(false);
  const [vibrateActive, setVibrateActive] = useState(false);

  /* ---- Load user data ---- */
  useEffect(() => {
    const saved = localStorage.getItem("prizeClaimForm");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch {
        setFormData({
          fullName: "Unknown User",
          age: "25",
          email: "user@email.com",
          contactNumber: "07X XXX XXXX",
          nic: "XXXXXXXXXX",
          deliveryAddress: "Address not found",
        });
      }
    } else {
      setFormData({
        fullName: "Unknown User",
        age: "25",
        email: "user@email.com",
        contactNumber: "07X XXX XXXX",
        nic: "XXXXXXXXXX",
        deliveryAddress: "Address not found",
      });
    }
  }, []);

  /* ---- Audio helpers ---- */
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "square", volume = 0.15) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch { /* silent fail */ }
  }, []);

  const playAlarm = useCallback(() => {
    playTone(880, 0.2, "square", 0.12);
    setTimeout(() => playTone(660, 0.2, "square", 0.12), 200);
    setTimeout(() => playTone(880, 0.2, "square", 0.12), 400);
  }, [playTone]);

  const playHeartbeat = useCallback(() => {
    playTone(60, 0.15, "sine", 0.2);
    setTimeout(() => playTone(55, 0.12, "sine", 0.18), 180);
  }, [playTone]);

  const playErrorBeep = useCallback(() => {
    playTone(440, 0.08, "square", 0.08);
  }, [playTone]);

  const playGlitch = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(Math.random() * 2000 + 100, 0.03, "sawtooth", 0.06), i * 30);
    }
  }, [playTone]);

  /* ---- Vibration helper ---- */
  const vibrate = useCallback((pattern: number[]) => {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch { /* silent */ }
  }, []);

  /* ---- MASTER TIMELINE ---- */
  useEffect(() => {
    if (!formData) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

    // ===== Phase 1: Dark Red Screen + Error Popups (0-2s) =====
    t(() => {
      setPhase(1);
      setScanlines(true);
      playAlarm();
      vibrate([100, 50, 100, 50, 200]);
    }, 300);

    const errors: ErrorPopup[] = [
      { id: 1, title: "⚠ CRITICAL SYSTEM ERROR", message: "Security breach detected! Unauthorized access to personal data.", x: 8, y: 10, delay: 400 },
      { id: 2, title: "🔴 WARNING", message: `Identity theft detected for NIC: ${formData.nic}`, x: 55, y: 5, delay: 700 },
      { id: 3, title: "❌ SECURITY ALERT", message: `Email ${formData.email} has been compromised!`, x: 15, y: 55, delay: 1000 },
      { id: 4, title: "⛔ FIREWALL BREACHED", message: `Phone ${formData.contactNumber} linked to fraud database`, x: 50, y: 45, delay: 1300 },
      { id: 5, title: "🚨 DATA LEAK", message: `Full name "${formData.fullName}" exposed to dark web`, x: 25, y: 25, delay: 1600 },
      { id: 6, title: "💀 MALWARE DETECTED", message: "Trojan.GenericKD.46584395 found in system", x: 60, y: 65, delay: 1800 },
    ];

    errors.forEach((err) => {
      t(() => {
        setVisibleErrors((prev) => [...prev, err]);
        playErrorBeep();
        vibrate([50]);
      }, err.delay);
    });

    // ===== Phase 2: Fake Terminal (2-5s) =====
    const termLines: TerminalLine[] = [
      { text: "C:\\WINDOWS\\system32> INITIATING DATA EXTRACTION...", delay: 2000 },
      { text: `[SCANNING] Target identified: ${formData.fullName}`, delay: 2400 },
      { text: `[FOUND] NIC Number: ${formData.nic}`, delay: 2800, isError: true },
      { text: `[FOUND] Phone: ${formData.contactNumber}`, delay: 3100, isError: true },
      { text: `[FOUND] Email: ${formData.email}`, delay: 3400, isError: true },
      { text: `[FOUND] Address: ${formData.deliveryAddress?.substring(0, 40) || "N/A"}...`, delay: 3700, isError: true },
      { text: "[UPLOADING] Sending data to remote server... 100%", delay: 4000, isSuccess: true },
      { text: "[COMPLETE] Data successfully uploaded to 3 external servers", delay: 4400, isSuccess: true },
      { text: `[ALERT] ${formData.fullName}'s identity has been sold`, delay: 4700, isError: true },
    ];

    t(() => {
      setPhase(2);
      setShakeIntensity(1);
      playGlitch();
    }, 2000);

    termLines.forEach((line) => {
      t(() => {
        setTerminalLines((prev) => [...prev, 
          line.isError ? `\x1b[31m${line.text}\x1b[0m` :
          line.isSuccess ? `\x1b[32m${line.text}\x1b[0m` :
          line.text
        ]);
      }, line.delay);
    });

    // ===== Phase 3: Notification Flood (3-7s) =====
    const notifs: Notification[] = [
      { id: 1, text: "💸 Rs. 45,000 deducted from your account!", icon: "💳", delay: 3000, side: "right" },
      { id: 2, text: "📋 Loan of Rs. 200,000 approved using your NIC", icon: "🏦", delay: 3500, side: "left" },
      { id: 3, text: `🔓 ${formData.fullName}'s data shared with 47 companies`, icon: "📡", delay: 4000, side: "right" },
      { id: 4, text: "🚨 Your photos uploaded to unknown server", icon: "📸", delay: 4400, side: "top" },
      { id: 5, text: "💀 Dark web listing created with your details", icon: "🕸️", delay: 4800, side: "left" },
      { id: 6, text: `📱 SIM card clone requested for ${formData.contactNumber}`, icon: "📱", delay: 5200, side: "right" },
      { id: 7, text: "🏧 3 fraudulent transactions detected", icon: "💰", delay: 5600, side: "left" },
      { id: 8, text: `✉️ Spam campaign launched from ${formData.email}`, icon: "📧", delay: 6000, side: "top" },
      { id: 9, text: "⚖️ Legal notice filed under your name", icon: "📜", delay: 6400, side: "right" },
      { id: 10, text: "🔒 All accounts locked. Contact support.", icon: "🔐", delay: 6800, side: "left" },
    ];

    t(() => setPhase(3), 3000);

    notifs.forEach((notif) => {
      t(() => {
        setVisibleNotifs((prev) => [...prev, notif]);
        playErrorBeep();
        vibrate([30, 20, 30]);
      }, notif.delay);
    });

    // ===== Phase 4: Climax - Extreme Effects (5-8s) =====
    t(() => {
      setPhase(4);
      setShakeIntensity(3);
      setGlitchActive(true);
      setRedFlash(true);
      setWarningBanner(true);
      setShowDataLeak(true);
      playAlarm();
      vibrate([200, 100, 200, 100, 200, 100, 500]);
    }, 5000);

    // Data leak progress bar
    for (let i = 0; i <= 100; i += 2) {
      t(() => setDataLeakBar(i), 5000 + i * 25);
    }

    // Heartbeat through climax
    for (let i = 0; i < 8; i++) {
      t(() => playHeartbeat(), 5000 + i * 800);
    }

    // Screen glitch pulses
    t(() => { setGlitchActive(false); setTimeout(() => setGlitchActive(true), 100); }, 5500);
    t(() => { setGlitchActive(false); setTimeout(() => setGlitchActive(true), 100); }, 6200);
    t(() => { setGlitchActive(false); setTimeout(() => setGlitchActive(true), 100); }, 7000);

    // Red flash pulses
    t(() => setRedFlash(false), 5800);
    t(() => setRedFlash(true), 6000);
    t(() => setRedFlash(false), 6500);
    t(() => setRedFlash(true), 7000);

    // Screen crack effect
    t(() => {
      setScreenCrack(true);
      playGlitch();
      vibrate([500]);
    }, 7500);

    // ===== Phase 5: Calm Down + Show Button (8-10s) =====
    t(() => {
      setPhase(5);
      setShakeIntensity(0);
      setGlitchActive(false);
      setRedFlash(false);
      setVibrateActive(false);
    }, 8500);

    t(() => {
      setShowButton(true);
    }, 9500);

    return () => timers.forEach(clearTimeout);
  }, [formData, playAlarm, playErrorBeep, playGlitch, playHeartbeat, vibrate]);

  /* ---- Dynamic shake style ---- */
  const shakeStyle = shakeIntensity > 0
    ? { animation: `revealScreenShake ${120 / shakeIntensity}ms linear infinite` }
    : {};

  if (!formData) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        background: phase >= 1
          ? "linear-gradient(180deg, #1a0000 0%, #0d0000 40%, #000000 100%)"
          : "#000",
        transition: "background 0.5s ease",
        ...shakeStyle,
      }}
    >
      {/* ====== Scanlines Overlay ====== */}
      {scanlines && (
        <div
          className="fixed inset-0 pointer-events-none z-[100]"
          style={{
            background: `repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.02) 0px,
              rgba(255,255,255,0.02) 1px,
              transparent 2px,
              transparent 4px
            )`,
          }}
        />
      )}

      {/* ====== Red Flash Overlay ====== */}
      {redFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[95]"
          style={{
            background: "radial-gradient(circle at center, rgba(255,0,0,0.35) 0%, rgba(180,0,0,0.2) 50%, rgba(100,0,0,0.4) 100%)",
            animation: "revealRedPulse 400ms ease-in-out infinite",
          }}
        />
      )}

      {/* ====== Glitch Overlay ====== */}
      {glitchActive && (
        <div className="fixed inset-0 pointer-events-none z-[98]" style={{ mixBlendMode: "difference" }}>
          <div
            className="absolute w-full"
            style={{
              height: `${3 + Math.random() * 8}%`,
              top: `${Math.random() * 90}%`,
              background: `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,0'}, 0.15)`,
              transform: `translateX(${(Math.random() - 0.5) * 20}px)`,
              animation: "revealGlitchFlicker 150ms linear infinite",
            }}
          />
          <div
            className="absolute w-full"
            style={{
              height: `${2 + Math.random() * 5}%`,
              top: `${Math.random() * 90}%`,
              background: "rgba(0,0,255,0.1)",
              transform: `translateX(${(Math.random() - 0.5) * 30}px)`,
            }}
          />
        </div>
      )}

      {/* ====== Screen Crack Effect ====== */}
      {screenCrack && (
        <div className="fixed inset-0 pointer-events-none z-[99]">
          <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none" className="opacity-40">
            <line x1="180" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
            <line x1="200" y1="200" x2="160" y2="400" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            <line x1="200" y1="200" x2="250" y2="350" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="160" y1="400" x2="190" y2="600" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <line x1="250" y1="350" x2="220" y2="550" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <line x1="200" y1="200" x2="140" y2="280" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
            <line x1="160" y1="400" x2="120" y2="500" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
          </svg>
        </div>
      )}

      {/* ====== PHASE 1 & onwards: Error Popups ====== */}
      {visibleErrors.map((err, i) => (
        <div
          key={err.id}
          className="absolute z-[60] reveal-popup-float"
          style={{
            left: `${err.x}%`,
            top: `${err.y}%`,
            transform: "translate(-50%, -50%)",
            animationDelay: `${i * 50}ms`,
            maxWidth: "280px",
            width: "85vw",
          }}
        >
          <div
            className="rounded-lg overflow-hidden shadow-2xl"
            style={{
              border: "2px solid #ff0000",
              background: "linear-gradient(180deg, #2a0000 0%, #1a0000 100%)",
              boxShadow: "0 0 20px rgba(255,0,0,0.4), inset 0 0 20px rgba(255,0,0,0.1)",
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ background: "linear-gradient(90deg, #cc0000, #880000)" }}
            >
              <span className="text-white text-xs font-bold truncate">{err.title}</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/40" />
              </div>
            </div>
            {/* Body */}
            <div className="p-3">
              <p className="text-red-300 text-xs font-mono leading-relaxed">{err.message}</p>
            </div>
          </div>
        </div>
      ))}

      {/* ====== PHASE 2: Fake Terminal ====== */}
      {phase >= 2 && (
        <div
          className="absolute z-[70] left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%)",
            width: "min(92vw, 440px)",
            maxHeight: "55vh",
          }}
        >
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: "1px solid #333",
              background: "rgba(0,0,0,0.95)",
              boxShadow: "0 0 40px rgba(0,255,0,0.1), 0 20px 60px rgba(0,0,0,0.8)",
            }}
          >
            {/* Terminal title bar */}
            <div className="flex items-center px-3 py-2" style={{ background: "#1a1a1a", borderBottom: "1px solid #333" }}>
              <div className="flex gap-1.5 mr-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-gray-400 text-[10px] font-mono">cmd.exe — DATA EXTRACTION TOOL v3.7</span>
            </div>
            {/* Terminal body */}
            <div className="p-3 overflow-y-auto font-mono text-[11px] leading-[1.6] space-y-0.5" style={{ maxHeight: "40vh" }}>
              {terminalLines.map((line, i) => {
                const isErr = line.includes("\x1b[31m");
                const isSucc = line.includes("\x1b[32m");
                const clean = line.replace(/\x1b\[\d+m/g, "");
                return (
                  <div key={i} className="flex">
                    <span
                      style={{
                        color: isErr ? "#ff4444" : isSucc ? "#44ff44" : "#00ff00",
                        textShadow: isErr
                          ? "0 0 5px rgba(255,0,0,0.5)"
                          : "0 0 3px rgba(0,255,0,0.3)",
                      }}
                    >
                      {clean}
                    </span>
                  </div>
                );
              })}
              {phase < 5 && (
                <span className="text-green-400">
                  █<span className="reveal-cmd-cursor">_</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== PHASE 3: Notification Flood ====== */}
      {visibleNotifs.map((notif) => {
        const isLeft = notif.side === "left";
        const isTop = notif.side === "top";
        return (
          <div
            key={notif.id}
            className="absolute z-[80]"
            style={{
              ...(isTop
                ? { top: "2%", left: "50%", transform: "translateX(-50%)" }
                : isLeft
                ? { left: "2%", top: `${10 + (notif.id % 5) * 16}%` }
                : { right: "2%", top: `${5 + (notif.id % 5) * 16}%` }),
              maxWidth: "280px",
              width: "80vw",
              animation: "revealToastEnter 300ms ease-out",
            }}
          >
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background: "rgba(30,0,0,0.92)",
                border: "1px solid rgba(255,60,60,0.5)",
                boxShadow: "0 4px 20px rgba(255,0,0,0.2), 0 0 10px rgba(255,0,0,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="text-lg flex-shrink-0">{notif.icon}</span>
              <p className="text-red-200 text-xs font-semibold leading-snug">{notif.text}</p>
            </div>
          </div>
        );
      })}

      {/* ====== PHASE 4: Warning Banner ====== */}
      {warningBanner && (
        <div className="fixed top-0 left-0 right-0 z-[90] overflow-hidden">
          <div
            className="py-2 px-4 text-center"
            style={{
              background: "linear-gradient(90deg, #ff0000, #cc0000, #ff0000)",
              animation: "revealRedPulse 600ms ease-in-out infinite",
            }}
          >
            <p className="text-white text-sm font-black tracking-widest animate-pulse">
              ⚠ YOUR DATA HAS BEEN COMPROMISED ⚠
            </p>
          </div>
        </div>
      )}

      {/* ====== PHASE 4: Data Leak Progress ====== */}
      {showDataLeak && (
        <div
          className="fixed bottom-24 left-1/2 z-[85]"
          style={{
            transform: "translateX(-50%)",
            width: "min(85vw, 380px)",
          }}
        >
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(20,0,0,0.95)",
              border: "1px solid rgba(255,0,0,0.4)",
              boxShadow: "0 0 30px rgba(255,0,0,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-xs font-bold font-mono">📤 UPLOADING YOUR DATA...</span>
              <span className="text-red-300 text-xs font-mono font-bold">{dataLeakBar}%</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,0,0,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${dataLeakBar}%`,
                  background: "linear-gradient(90deg, #ff0000, #ff4400, #ff0000)",
                  boxShadow: "0 0 10px rgba(255,0,0,0.6)",
                }}
              />
            </div>
            <p className="text-red-500/70 text-[10px] font-mono mt-2">
              Destination: 194.87.xxx.xxx (Unknown Server) • {formData.nic} • {formData.email}
            </p>
          </div>
        </div>
      )}

      {/* ====== Floating Data Particles ====== */}
      {phase >= 3 && phase < 5 && (
        <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-red-500/30 text-[9px] font-mono whitespace-nowrap"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `revealFireflyDrift ${3 + Math.random() * 4}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              {[formData.nic, formData.email, formData.contactNumber, formData.fullName, "BREACH", "LEAKED", "COMPROMISED"][i % 7]}
            </div>
          ))}
        </div>
      )}

      {/* ====== PHASE 5: Final Message + Button ====== */}
      {phase >= 5 && (
        <div
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-6"
          style={{
            background: "linear-gradient(180deg, rgba(20,0,0,0.97) 0%, rgba(0,0,0,0.99) 100%)",
            animation: "revealWarmFade 800ms ease-out",
          }}
        >
          {/* Pulsing danger icon */}
          <div
            className="mb-6"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,0,0,0.3) 0%, transparent 70%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "revealRedPulse 1.5s ease-in-out infinite",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1
            className="text-center font-black tracking-tight leading-tight mb-3"
            style={{
              fontSize: "clamp(1.8rem, 7vw, 3rem)",
              color: "#ff2222",
              textShadow: "0 0 20px rgba(255,0,0,0.5), 0 0 40px rgba(255,0,0,0.2)",
            }}
          >
            YOU HAVE BEEN<br />SCAMMED
          </h1>

          <p className="text-red-400/80 text-center text-sm font-medium mb-2 max-w-xs">
            All your personal information has been captured.
          </p>

          <div
            className="rounded-xl p-4 mb-8 max-w-xs w-full"
            style={{
              background: "rgba(255,0,0,0.08)",
              border: "1px solid rgba(255,0,0,0.2)",
            }}
          >
            <p className="text-red-300/60 text-xs font-mono text-center leading-relaxed">
              Name: {formData.fullName}<br />
              NIC: {formData.nic}<br />
              Phone: {formData.contactNumber}<br />
              Email: {formData.email}
            </p>
          </div>

          {showButton && (
            <button
              onClick={() => router.push("/reveal-info")}
              className="relative group"
              style={{
                animation: "revealSoftRise 600ms ease-out",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "linear-gradient(135deg, #ff0000, #cc0000)",
                  filter: "blur(15px)",
                  transform: "scale(1.1)",
                }}
              />
              <div
                className="relative px-12 py-4 rounded-2xl font-black text-white text-lg tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #dd0000 0%, #aa0000 100%)",
                  border: "2px solid rgba(255,100,100,0.4)",
                  boxShadow: "0 0 30px rgba(255,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                Continue →
              </div>
            </button>
          )}
        </div>
      )}

      {/* ====== Ambient Vignette ====== */}
      <div
        className="fixed inset-0 pointer-events-none z-[40]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
