"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, ShieldAlert } from "lucide-react";

type RevealPhase = "shock" | "notifFlood" | "peakHack" | "relief";

type ClaimFormData = {
  fullName: string;
  age: string;
  email: string;
  contactNumber: string;
  nic: string;
  deliveryAddress: string;
};

type PopupItem = {
  id: number;
  title: string;
  body: string;
  x: number;
  y: number;
};

type NotificationItem = {
  id: number;
  channel: "WhatsApp" | "SMS" | "Bank";
  message: string;
};

type ReliefStep =
  | "grandfatherIntro"
  | "projectReveal"
  | "impactMessage"
  | "statsReveal"
  | "heartfeltWarning"
  | "empowerment"
  | "finalCta";

type Language = "en" | "si" | "ta";

type CopyDeck = {
  label: string;
  title: string;
  stepText: Record<ReliefStep, string>;
  statHeading: string;
  stats: Array<{ value: string; label: string }>;
  warningLines: string[];
  cta: {
    share: string;
    village: string;
    games: string;
  };
  footer: string;
  shareToastSuccess: string;
  shareToastFail: string;
};

const PHASE_TIMING_MS = {
  notifFloodStart: 2000,
  peakHackStart: 5000,
  reliefStart: 7000,
} as const;

const DEDUCTION_MESSAGES = [
  "Rs. 45,000 has been deducted from your account",
  "Loan application submitted using your NIC",
  "Your details have been shared with 47 third parties",
  "Account under fraud investigation",
  "Unrecognized transfer approved from unknown device",
  "Emergency: Your mobile banking PIN was reset",
];

const CMD_LINES = [
  "Accessing user data...",
  "Extracting NIC, Phone, Address...",
  "Data successfully transferred to external server",
  "Connection established with scam-server-47.india",
];

const DEFAULT_FORM: ClaimFormData = {
  fullName: "Unknown User",
  age: "-",
  email: "not-provided@example.com",
  contactNumber: "07X XXX XXXX",
  nic: "XXXXXXXXXV",
  deliveryAddress: "Address unavailable",
};

const RELIEF_STEP_ORDER: ReliefStep[] = [
  "grandfatherIntro",
  "projectReveal",
  "impactMessage",
  "statsReveal",
  "heartfeltWarning",
  "empowerment",
  "finalCta",
];

const RELIEF_STEP_DELAY_MS = [2500, 4200, 6800, 9800, 13000, 15600, 18000];

const COPY: Record<Language, CopyDeck> = {
  en: {
    label: "EN",
    title: "A Message from Seetha Thaththa",
    stepText: {
      grandfatherIntro:
        "Puthe... don't be afraid. Breathe.",
      projectReveal:
        "Everything you just saw was a simulation. This whole Avurudu Kreeda website was created by Leo Club students as a Cyber Security Awareness Project.",
      impactMessage:
        "But what you experienced in those few seconds is exactly what thousands of Sri Lankans go through every Aluth Avurudu.",
      statsReveal:
        "According to Sri Lanka CERT, during the last Avurudu season alone, over 8,500 complaints were received about fake prize scams, fake gift hampers, and 'Win Avurudu Kumari' competitions.",
      heartfeltWarning:
        "Globally, scammers stole more than 442 billion dollars last year through online fraud. Prize and competition scams are now one of the fastest growing threats.",
      empowerment:
        "They create beautiful games and tempting prizes just like we did here. They make you feel excited, make you fill your name, phone number, NIC, and address, then disappear with your data. But today you are no longer a victim. You are now aware, and you can protect your family.",
      finalCta:
        "Never share personal details for unknown links, free prizes, or competitions. Always verify. Always think twice.",
    },
    statHeading: "Reality behind the panic",
    stats: [
      { value: "8,500+", label: "Sri Lanka CERT scam complaints in the Avurudu season" },
      { value: "$442B+", label: "Global online fraud losses last year" },
    ],
    warningLines: [
      "Never share your personal details for any free prize, game, or competition from unknown links.",
      "Even if it looks real. Even if your friends share it.",
      "Always verify. Always think twice.",
    ],
    cta: {
      share: "Share this Awareness with Your Family & Friends",
      village: "Return to My Avurudu Village",
      games: "Play Games Again",
    },
    footer: "Cyber Safety Awareness - Avurudu Kreeda 2026",
    shareToastSuccess: "Awareness message copied. Share it with your family.",
    shareToastFail: "Could not copy automatically. Please copy manually.",
  },
  si: {
    label: "සිං",
    title: "සීතා තාත්තාගෙන් පණිවිඩයක්",
    stepText: {
      grandfatherIntro:
        "පුතේ... බය වෙන්න එපා. හුස්ම ගන්න.",
      projectReveal:
        "ඔයා දැක්ක හැම දෙයක්ම simulation එකක්. මේ Avurudu Kreeda website එක Leo Club සිසුන් හදපු Cyber Security Awareness Project එකක්.",
      impactMessage:
        "ඒත් තත්පර කීපයෙදි ඔයාට දැනුන දේම, හැම අවුරුද්දකම අවුරුදු කාලෙදි, දහස් ගණන් ශ්‍රී ලාංකිකයින්ට සිද්ධ වෙනවා.",
      statsReveal:
        "Sri Lanka CERT අනුව පසුගිය අවුරුදු සමය තුළ පමණක් fake prize scams, fake gift hampers, සහ 'Win Avurudu Kumari' තරඟ ගැන පැමිණිලි 8,500කට වැඩි ගණනක් ලැබුණා.",
      heartfeltWarning:
        "ලෝකය පුරා online fraud හරහා පසුගිය අවුරුද්දේ ඩොලර් බිලියන 442කට වැඩි මුදලක් හොරකම් කරලා. Prize සහ competition scams ඉතා වේගයෙන් වැඩිවන අවදානමක්.",
      empowerment:
        "අපි මෙහෙම ලස්සන game එකක් සහ තෑගි පෙන්වපු වගේම, scammers ලාත් ඒකම කරනවා. ඔයාව උද්දාමයට පත් කරලා නම, phone number, NIC, ලිපිනය අරගෙන දත්ත අරන් යනවා. හැබැයි අද ඔයා බිලි නොවේ. ඔයා දැන් අවධානයෙන් ඉන්නවා. ඔයාට පවුල රැකගන්න පුළුවන්.",
      finalCta:
        "අනියම් link, free prize, competition සඳහා ඔබේ පෞද්ගලික තොරතුරු කිසිදා බෙදාගන්න එපා. හැම විටම verify කරන්න. දෙවරක් හිතන්න.",
    },
    statHeading: "මේ පැනික් එකට පිටුපස ඇත්ත",
    stats: [
      { value: "8,500+", label: "අවුරුදු සමයේ CERT වෙත ලැබුණු scam පැමිණිලි" },
      { value: "$442B+", label: "පසුගිය අවුරුද්දේ ලෝක online fraud අලාභ" },
    ],
    warningLines: [
      "අනියම් link එකක free prize, game, competition සඳහා ඔබේ පෞද්ගලික තොරතුරු දෙන්න එපා.",
      "ඒක ඇත්ත වගේ පෙනුනත්. යාලුවෝ share කරත්.",
      "හැම විටම verify කරන්න. හැම විටම දෙවරක් හිතන්න.",
    ],
    cta: {
      share: "මෙම අවධානම් පණිවිඩය පවුල හා යාලුවන්ට Share කරන්න",
      village: "මගේ අවුරුදු ගමට යන්න",
      games: "ආයෙමත් ක්‍රීඩා කරන්න",
    },
    footer: "Cyber Safety Awareness - Avurudu Kreeda 2026",
    shareToastSuccess: "පණිවිඩය copy වුණා. දැන් share කරන්න.",
    shareToastFail: "Automatic copy වුනේ නැහැ. Manual copy කරන්න.",
  },
  ta: {
    label: "த",
    title: "சீதா தாத்தாவின் செய்தி",
    stepText: {
      grandfatherIntro:
        "புத்தே... பயப்படாதே. ஆழமாக சுவாசிக்கலாம்.",
      projectReveal:
        "நீ இப்போ பார்த்தது எல்லாம் ஒரு simulation. இந்த முழு Avurudu Kreeda website-ஐ Leo Club மாணவர்கள் Cyber Security Awareness Project ஆக உருவாக்கினர்.",
      impactMessage:
        "ஆனால் சில விநாடிகளில் நீ உணர்ந்த பதட்டமே, ஒவ்வொரு Aluth Avurudu காலத்திலும் ஆயிரக்கணக்கான இலங்கையர்களுக்கு நடக்கிறது.",
      statsReveal:
        "Sri Lanka CERT படி, கடந்த Avurudu சீசனில் மட்டும் fake prize scams, fake gift hampers, மற்றும் 'Win Avurudu Kumari' போட்டிகளைப் பற்றி 8,500க்கும் மேற்பட்ட புகார்கள் வந்தன.",
      heartfeltWarning:
        "உலகளவில் online fraud மூலம் கடந்த வருடம் 442 பில்லியன் டாலருக்கும் மேல் கள்வன் கையில் போனது. Prize மற்றும் competition scams இப்போது மிகவும் வேகமாக வளர்கிற அபாயம்.",
      empowerment:
        "நாங்கள் இங்கே காட்டிய அழகான game மற்றும் prize போலவே scammers செய்கிறார்கள். உங்களை உற்சாகப்படுத்தி name, phone number, NIC, address வாங்கி data-ஐ எடுத்துச் செல்கிறார்கள். ஆனால் இன்று நீ பலி அல்ல. நீ விழிப்புணர்வுடன் இருக்கிறாய். உன்னையும் குடும்பத்தையும் பாதுகாக்க முடியும்.",
      finalCta:
        "தெரியாத link, free prize, competition க்கு உங்கள் தனிப்பட்ட தகவல்களை ஒருபோதும் பகிர வேண்டாம். எப்போதும் verify செய்யுங்கள். இருமுறை சிந்தியுங்கள்.",
    },
    statHeading: "இந்த பதட்டத்தின் பின்னணி உண்மை",
    stats: [
      { value: "8,500+", label: "Avurudu காலத்தில் CERT-க்கு வந்த scam புகார்கள்" },
      { value: "$442B+", label: "கடந்த ஆண்டு உலக online fraud இழப்பு" },
    ],
    warningLines: [
      "தெரியாத link-களில் வரும் free prize, game, competition க்கு உங்கள் personal details கொடுக்க வேண்டாம்.",
      "அது உண்மையாகத் தோன்றினாலும். நண்பர்கள் share செய்தாலும்.",
      "எப்போதும் verify செய்யுங்கள். எப்போதும் இருமுறை யோசிக்கவும்.",
    ],
    cta: {
      share: "இந்த விழிப்புணர்வை குடும்பத்தினர் மற்றும் நண்பர்களுடன் பகிருங்கள்",
      village: "என் Avurudu கிராமத்துக்கு திரும்பு",
      games: "மீண்டும் விளையாடு",
    },
    footer: "Cyber Safety Awareness - Avurudu Kreeda 2026",
    shareToastSuccess: "செய்தி copy செய்யப்பட்டது. இப்போது share செய்யுங்கள்.",
    shareToastFail: "Auto copy முடியவில்லை. தயவு செய்து manual copy செய்யுங்கள்.",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeString(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function readClaimForm(): ClaimFormData {
  if (typeof window === "undefined") return DEFAULT_FORM;
  const raw = localStorage.getItem("prizeClaimForm");
  if (!raw) return DEFAULT_FORM;

  try {
    const parsed = JSON.parse(raw) as Partial<ClaimFormData>;
    return {
      fullName: safeString(parsed.fullName, DEFAULT_FORM.fullName),
      age: safeString(parsed.age, DEFAULT_FORM.age),
      email: safeString(parsed.email, DEFAULT_FORM.email),
      contactNumber: safeString(parsed.contactNumber, DEFAULT_FORM.contactNumber),
      nic: safeString(parsed.nic, DEFAULT_FORM.nic),
      deliveryAddress: safeString(parsed.deliveryAddress, DEFAULT_FORM.deliveryAddress),
    };
  } catch {
    return DEFAULT_FORM;
  }
}

export default function RevealPage() {
  const [phase, setPhase] = useState<RevealPhase>("shock");
  const [claimData, setClaimData] = useState<ClaimFormData>(DEFAULT_FORM);
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [typedText, setTypedText] = useState<string[]>([]);
  const [errorFlash, setErrorFlash] = useState(false);
  const [glitchPulse, setGlitchPulse] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [allowHeavyMotion, setAllowHeavyMotion] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [reliefStep, setReliefStep] = useState<ReliefStep>("grandfatherIntro");
  const [revealedSteps, setRevealedSteps] = useState<ReliefStep[]>(["grandfatherIntro"]);
  const [typedDialogue, setTypedDialogue] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "success" | "fail">("idle");

  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatAudioRef = useRef<HTMLAudioElement | null>(null);
  const rabanAudioRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef(0);

  const isScary = phase !== "relief";
  const reliefDelay = clamp(PHASE_TIMING_MS.reliefStart, 6000, 8000);
  const copyDeck = COPY[language];

  const cmdIdentityLine = useMemo(
    () =>
      `NIC: ${claimData.nic} | Phone: ${claimData.contactNumber} | Email: ${claimData.email}`,
    [claimData.nic, claimData.contactNumber, claimData.email]
  );

  useEffect(() => {
    setClaimData(readClaimForm());

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setAllowHeavyMotion(!media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);

    return () => media.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    const phaseTimers = [
      window.setTimeout(() => setPhase("notifFlood"), PHASE_TIMING_MS.notifFloodStart),
      window.setTimeout(() => setPhase("peakHack"), PHASE_TIMING_MS.peakHackStart),
      window.setTimeout(() => {
        setPhase("relief");
        setPopups([]);
        setNotifications([]);
        setErrorFlash(false);
        setScreenShake(false);
      }, reliefDelay),
    ];

    return () => phaseTimers.forEach((timer) => window.clearTimeout(timer));
  }, [reliefDelay]);

  useEffect(() => {
    if (!isScary) return;

    const interval = window.setInterval(() => {
      const x = Math.floor(Math.random() * 72) + 5;
      const y = Math.floor(Math.random() * 68) + 5;
      const nextId = ++idRef.current;
      const popup: PopupItem = {
        id: nextId,
        title: Math.random() > 0.5 ? "SYSTEM ERROR" : "SECURITY BREACH",
        body:
          Math.random() > 0.5
            ? "DATA BREACH DETECTED"
            : `Uploading data to remote server... (${nextId})`,
        x,
        y,
      };
      setPopups((prev) => [...prev.slice(-8), popup]);
    }, allowHeavyMotion ? 220 : 420);

    return () => window.clearInterval(interval);
  }, [allowHeavyMotion, isScary]);

  useEffect(() => {
    if (phase === "shock" || phase === "relief") return;

    const interval = window.setInterval(() => {
      const nextId = ++idRef.current;
      const message = DEDUCTION_MESSAGES[nextId % DEDUCTION_MESSAGES.length];
      const channel: NotificationItem["channel"] = nextId % 3 === 0 ? "Bank" : nextId % 2 === 0 ? "SMS" : "WhatsApp";

      setNotifications((prev) => [...prev, { id: nextId, channel, message }].slice(-5));
    }, allowHeavyMotion ? 350 : 700);

    return () => window.clearInterval(interval);
  }, [allowHeavyMotion, phase]);

  useEffect(() => {
    if (!isScary) return;

    setTypedText([]);
    let cancelled = false;
    let lineIndex = 0;

    const scheduleLine = () => {
      if (cancelled || lineIndex >= CMD_LINES.length) return;

      const currentLine = lineIndex === 1 ? `${CMD_LINES[lineIndex]} [${claimData.fullName}]` : CMD_LINES[lineIndex];
      let charIndex = 0;
      setTypedText((prev) => [...prev, ""]);

      const typing = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(typing);
          return;
        }

        charIndex += 1;
        setTypedText((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = currentLine.slice(0, charIndex);
          return copy;
        });

        if (charIndex >= currentLine.length) {
          window.clearInterval(typing);
          lineIndex += 1;
          window.setTimeout(scheduleLine, 260);
        }
      }, 32);
    };

    scheduleLine();

    return () => {
      cancelled = true;
    };
  }, [claimData.fullName, isScary]);

  useEffect(() => {
    if (!isScary) return;

    const glitchInterval = window.setInterval(() => {
      setGlitchPulse((prev) => prev + 1);
      setErrorFlash(true);
      window.setTimeout(() => setErrorFlash(false), 130);
    }, allowHeavyMotion ? 680 : 1200);

    const shakeInterval = window.setInterval(() => {
      if (!allowHeavyMotion) return;
      setScreenShake(true);
      window.setTimeout(() => setScreenShake(false), 110);
    }, 920);

    return () => {
      window.clearInterval(glitchInterval);
      window.clearInterval(shakeInterval);
    };
  }, [allowHeavyMotion, isScary]);

  useEffect(() => {
    if (!audioReady) return;

    if (!isScary) {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
      if (heartbeatAudioRef.current) {
        heartbeatAudioRef.current.pause();
        heartbeatAudioRef.current.currentTime = 0;
      }
      return;
    }

    const playWithFallback = (el: HTMLAudioElement | null, volume: number) => {
      if (!el) return;
      el.volume = volume;
      el.currentTime = 0;
      void el.play().catch(() => {
        const activate = () => {
          void el.play().catch(() => {});
          window.removeEventListener("pointerdown", activate);
        };
        window.addEventListener("pointerdown", activate, { once: true });
      });
    };

    playWithFallback(alarmAudioRef.current, 0.35);
    playWithFallback(heartbeatAudioRef.current, 0.6);
  }, [audioReady, isScary]);

  useEffect(() => {
    if (phase !== "relief") return;
    setReliefStep("grandfatherIntro");
    setRevealedSteps(["grandfatherIntro"]);
    setTypedDialogue("");

    const timers = RELIEF_STEP_ORDER.map((step, index) =>
      window.setTimeout(() => {
        setReliefStep(step);
        setRevealedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
      }, RELIEF_STEP_DELAY_MS[index] ?? 0)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase]);

  useEffect(() => {
    if (phase !== "relief") return;
    const line = copyDeck.stepText[reliefStep];
    setTypedDialogue("");
    let cursor = 0;

    const speed = allowHeavyMotion ? 20 : 6;
    const interval = window.setInterval(() => {
      cursor += 1;
      setTypedDialogue(line.slice(0, cursor));
      if (cursor >= line.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [allowHeavyMotion, copyDeck.stepText, phase, reliefStep]);

  useEffect(() => {
    if (phase !== "relief") return;
    const audio = rabanAudioRef.current;
    if (!audio) return;

    audio.volume = 0.28;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      const activate = () => {
        void audio.play().catch(() => {});
      };
      window.addEventListener("pointerdown", activate, { once: true });
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [phase]);

  const fireflies = useMemo(
    () =>
      Array.from({ length: allowHeavyMotion ? 14 : 8 }, (_, idx) => ({
        id: idx,
        left: Math.floor(Math.random() * 96) + 2,
        top: Math.floor(Math.random() * 70) + 10,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 5,
      })),
    [allowHeavyMotion]
  );

  const handleCopyAwareness = async () => {
    const shareText = [
      copyDeck.warningLines[0],
      copyDeck.warningLines[1],
      copyDeck.warningLines[2],
      "",
      `Source: ${window.location.href}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(shareText);
      setCopyState("success");
    } catch {
      setCopyState("fail");
    }

    window.setTimeout(() => setCopyState("idle"), 2400);
  };

  return (
    <main
      className={`min-h-screen relative overflow-hidden ${
        phase === "relief"
          ? "bg-gradient-to-b from-amber-100 via-yellow-50 to-orange-100"
          : "bg-black"
      }`}
    >
      <audio
        ref={alarmAudioRef}
        src="/koha/wrong.mp3"
        loop
        preload="auto"
        onCanPlay={() => setAudioReady(true)}
      />
      <audio ref={heartbeatAudioRef} src="/kottapora/boo.mp3" loop preload="auto" />
      <audio ref={rabanAudioRef} src="/bg musics/me-awrudu-kale.mp3" loop preload="auto" />

      {phase !== "relief" && (
        <div
          className={`absolute inset-0 reveal-scanlines ${
            allowHeavyMotion ? "reveal-red-pulse" : ""
          } ${screenShake ? "reveal-shake" : ""} ${glitchPulse % 2 === 0 ? "reveal-glitch" : ""}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/85 via-black to-red-900/70" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.18)_0%,rgba(0,0,0,0.9)_75%)]" />

          <div className="absolute inset-0 p-4 sm:p-6">
            {popups.map((popup) => (
              <div
                key={popup.id}
                className="absolute reveal-popup-float w-44 sm:w-56 rounded-md border border-red-400/70 bg-zinc-900/95 shadow-[0_0_30px_rgba(255,0,0,0.35)]"
                style={{ left: `${popup.x}%`, top: `${popup.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className="bg-zinc-800 px-2 py-1 text-[10px] sm:text-xs font-bold text-red-300 tracking-wide">
                  Windows Security Alert
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-[11px] sm:text-xs font-extrabold text-red-400">{popup.title}</p>
                  <p className="mt-1 text-[10px] sm:text-[11px] text-red-200">{popup.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 w-[94%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-md border border-zinc-700 bg-[#0b0b0b]/95 shadow-[0_0_40px_rgba(255,0,0,0.25)]">
            <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 text-xs text-zinc-200">
              <span>Administrator: Command Prompt</span>
              <span className="text-red-400">LIVE ACCESS</span>
            </div>
            <div className="h-72 sm:h-80 overflow-hidden p-3 sm:p-4 font-mono text-xs sm:text-sm text-red-400">
              <p className="font-bold text-red-500">DATA BREACH DETECTED</p>
              <p className="text-red-300">{cmdIdentityLine}</p>
              {typedText.map((line, idx) => (
                <p key={`${line}-${idx}`} className="mt-1 text-red-300">
                  {">"} {line}
                  {idx === typedText.length - 1 && phase !== "relief" ? (
                    <span className="reveal-cmd-cursor">_</span>
                  ) : null}
                </p>
              ))}
              <p className="mt-2 text-red-500">{"[WARN] Uploading data to remote server..."}</p>
              {errorFlash ? (
                <p className="mt-1 reveal-flash-text">{"[FATAL] Encryption bypassed. Root token exposed."}</p>
              ) : (
                <p className="mt-1 text-red-700">{"[FATAL] Encryption bypassed. Root token exposed."}</p>
              )}
            </div>
          </div>

          <div className="absolute right-3 top-3 flex w-[90%] max-w-sm flex-col gap-2">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="reveal-toast-enter rounded-lg border border-red-300/60 bg-zinc-900/95 px-3 py-2 shadow-[0_0_25px_rgba(255,0,0,0.2)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-red-300">{item.channel} Alert</p>
                <p className="text-xs text-red-100">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "relief" && (
        <section className="reveal-relief-fade relative z-10 mx-auto min-h-screen w-full overflow-hidden px-4 py-6 sm:px-6 sm:py-10">
          <div className={`reveal-night-backdrop ${allowHeavyMotion ? "reveal-night-drift" : ""}`}>
            <div className="reveal-lamp-glow left-[8%] top-[73%]" />
            <div className="reveal-lamp-glow left-[82%] top-[76%]" />
            <div className="reveal-lamp-glow left-[52%] top-[80%]" />
            <div className="reveal-palm left-[-4%] bottom-0 h-72 w-36" />
            <div className="reveal-palm right-[-6%] bottom-0 h-72 w-44" />
            <div className="reveal-ground" />
            {fireflies.map((fly) => (
              <span
                key={fly.id}
                className="reveal-firefly"
                style={{
                  left: `${fly.left}%`,
                  top: `${fly.top}%`,
                  animationDelay: `${fly.delay}s`,
                  animationDuration: `${fly.duration}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between rounded-2xl border border-amber-200/70 bg-white/65 px-3 py-2 backdrop-blur-md">
              <div className="text-xs font-bold tracking-[0.2em] text-amber-700 sm:text-sm">{copyDeck.title}</div>
              <div className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50/80 p-1">
                {(["en", "si", "ta"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      language === lang
                        ? "bg-amber-500 text-white shadow"
                        : "text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    {COPY[lang].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="reveal-grandfather-card rounded-3xl border border-amber-200/70 bg-gradient-to-b from-white/85 to-amber-100/70 p-5 shadow-2xl backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-100 bg-gradient-to-b from-amber-50 to-orange-100 text-6xl shadow-md">
                    👴
                  </div>
                  <div>
                    <p className="text-sm font-extrabold tracking-[0.22em] text-amber-700">{copyDeck.title}</p>
                    <p className="mt-1 text-sm text-avurudu-dark/75">"Puthe... Breathe. You are safe now."</p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Speaking...
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 text-left shadow-inner">
                  <p className="min-h-[130px] text-base leading-relaxed text-avurudu-dark sm:text-lg">
                    {typedDialogue}
                    <span className="reveal-cmd-cursor text-amber-700">|</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {revealedSteps.includes("statsReveal") && (
                  <div className="reveal-soft-rise rounded-3xl border border-sky-200/70 bg-white/75 p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-700">
                      {copyDeck.statHeading}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {copyDeck.stats.map((stat) => (
                        <div key={stat.value} className="rounded-xl border border-sky-100 bg-sky-50/75 p-3">
                          <p className="text-2xl font-black text-sky-800">{stat.value}</p>
                          <p className="text-sm text-sky-900/80">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {revealedSteps.includes("empowerment") && (
                  <div className="reveal-soft-rise rounded-3xl border border-emerald-200/70 bg-white/80 p-4 shadow-xl backdrop-blur-sm">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-700">Final Message</h3>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-relaxed text-avurudu-dark/90 sm:text-base">
                      {copyDeck.warningLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {revealedSteps.includes("finalCta") && (
              <div className="reveal-soft-rise mt-1 rounded-3xl border border-amber-200/70 bg-white/70 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleCopyAwareness}
                    className="sm:col-span-3 flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(245,158,11,0.45)] transition hover:scale-[1.01]"
                  >
                    <Copy className="h-4 w-4" />
                    {copyDeck.cta.share}
                  </button>
                  <Link
                    href="/games"
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                  >
                    {copyDeck.cta.village}
                  </Link>
                  <Link
                    href="/"
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 sm:col-span-2"
                  >
                    {copyDeck.cta.games}
                  </Link>
                </div>

                {copyState !== "idle" && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {copyState === "success" ? copyDeck.shareToastSuccess : copyDeck.shareToastFail}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="relative z-10 mt-6 flex items-center justify-center gap-2 text-sm font-medium text-avurudu-dark/70">
            <ShieldAlert className="h-4 w-4" />
            <span>{copyDeck.footer}</span>
          </div>
        </section>
      )}

      {phase !== "relief" && (
        <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4 text-center text-red-200/90">
          <p className="inline-flex items-center gap-2 rounded-full border border-red-400/50 bg-black/50 px-3 py-1 text-xs font-semibold tracking-wide">
            <AlertTriangle className="h-3.5 w-3.5" />
            SECURITY INCIDENT IN PROGRESS
          </p>
        </div>
      )}
    </main>
  );
}
