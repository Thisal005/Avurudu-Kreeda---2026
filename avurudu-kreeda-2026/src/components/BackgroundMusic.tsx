"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaVolumeMute, FaVolumeUp, FaMusic, FaStepForward } from "react-icons/fa";

const musicPlaylist = [
  { src: "/bg musics/kaju-ware.mp3", label: "🎵 Kaju Ware" },
  { src: "/bg musics/koho-koho.mp3", label: "🎵 Koho Koho" },
  { src: "/bg musics/me-awrudu-kale.mp3", label: "🎵 Me Awrudu Kale" },
];

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrackName, setShowTrackName] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const trackNameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect touch device once
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  // Load persisted state
  useEffect(() => {
    const savedIsMuted = localStorage.getItem("isMuted");
    const savedVolume = localStorage.getItem("bgVolume");
    const savedCurrentTrack = localStorage.getItem("currentTrack");

    setIsMuted(savedIsMuted ? JSON.parse(savedIsMuted) : false);
    setVolume(savedVolume ? JSON.parse(savedVolume) : 0.2);
    setCurrentTrack(savedCurrentTrack ? JSON.parse(savedCurrentTrack) : 0);
  }, []);

  // Persist & sync muted state
  useEffect(() => {
    localStorage.setItem("isMuted", JSON.stringify(isMuted));
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Persist & sync volume
  useEffect(() => {
    localStorage.setItem("bgVolume", JSON.stringify(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Play track on change
  useEffect(() => {
    localStorage.setItem("currentTrack", JSON.stringify(currentTrack));
    if (audioRef.current) {
      audioRef.current.src = musicPlaylist[currentTrack].src;
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(() => {
        const retry = () => {
          audioRef.current?.play().catch(() => undefined);
          window.removeEventListener("pointerdown", retry);
        };
        window.addEventListener("pointerdown", retry, { once: true });
      });
    }
    flashTrackName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Keep audio in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  // Close when tapping outside on mobile
  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isExpanded]);

  const flashTrackName = () => {
    setShowTrackName(true);
    if (trackNameTimerRef.current) clearTimeout(trackNameTimerRef.current);
    trackNameTimerRef.current = setTimeout(() => setShowTrackName(false), 2500);
  };

  // Desktop: expand on hover
  const handleMouseEnter = () => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // Small delay so fast mouse-outs don't instantly collapse
    collapseTimerRef.current = setTimeout(() => setIsExpanded(false), 300);
  };

  // Mobile: mute button tap = expand controls; second tap on mute = toggle mute
  const handleMuteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isTouchDevice && !isExpanded) {
        // First tap → just expand
        setIsExpanded(true);
        return;
      }
      // Desktop or already expanded → toggle mute
      setIsMuted((prev) => !prev);
    },
    [isTouchDevice, isExpanded]
  );

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTrack((prev) => (prev + 1) % musicPlaylist.length);
    // Auto-collapse on mobile after changing track
    if (isTouchDevice) {
      collapseTimerRef.current = setTimeout(() => setIsExpanded(false), 2800);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (value > 0 && isMuted) setIsMuted(false);
    // Reset collapse timer on interaction
    if (isTouchDevice && collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = setTimeout(() => setIsExpanded(false), 3000);
    }
  };

  const handleEnded = () => {
    setCurrentTrack((prev) => (prev + 1) % musicPlaylist.length);
  };

  const expandedStyle = (extraDelay = "0ms") => ({
    opacity: isExpanded ? 1 : 0,
    transform: isExpanded ? "translateX(0) scale(1)" : "translateX(12px) scale(0.85)",
    pointerEvents: isExpanded ? ("auto" as const) : ("none" as const),
    transition: `opacity 0.3s ease ${extraDelay}, transform 0.3s ease ${extraDelay}`,
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        ...(isTouchDevice ? { top: "1rem" } : { bottom: "1rem" }),
        right: "1rem",
        zIndex: 50,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Track name toast */}
      <div
        style={{
          opacity: showTrackName ? 1 : 0,
          transform: showTrackName ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
          background: "rgba(20,10,5,0.88)",
          color: "#fde68a",
          fontSize: "0.72rem",
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: "999px",
          border: "1px solid rgba(251,191,36,0.35)",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
          marginBottom: "8px",
          textAlign: "right",
          letterSpacing: "0.03em",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        {musicPlaylist[currentTrack].label}
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          aria-label="Background music volume"
          style={{
            ...expandedStyle("60ms"),
            width: "88px",
            accentColor: "#fb923c",
            cursor: "pointer",
            touchAction: "none",
          }}
        />

        {/* Next Track button */}
        <button
          onClick={handleNextTrack}
          title={`Next: ${musicPlaylist[(currentTrack + 1) % musicPlaylist.length].label}`}
          aria-label="Change background music"
          style={{
            ...expandedStyle("0ms"),
            background: "rgba(20,10,5,0.88)",
            border: "1px solid rgba(251,191,36,0.5)",
            color: "#fde68a",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            minWidth: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "0.85rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "rgba(251,191,36,0.2)",
              transform: "scale(1.1)",
            });
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, {
              background: "rgba(20,10,5,0.88)",
              transform: isExpanded ? "scale(1)" : "translateX(12px) scale(0.85)",
            });
          }}
        >
          <FaStepForward />
        </button>

        {/* Mute / Unmute button — always visible */}
        <button
          onClick={handleMuteClick}
          aria-label={isMuted ? "Unmute background music" : "Mute background music"}
          style={{
            background: isMuted
              ? "rgba(127,29,29,0.92)"
              : "rgba(20,10,5,0.88)",
            border: isMuted
              ? "1px solid rgba(239,68,68,0.6)"
              : "1px solid rgba(251,191,36,0.5)",
            color: isMuted ? "#fca5a5" : "#fde68a",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            minWidth: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.45)",
            transition: "background 0.25s ease, border 0.25s ease, transform 0.15s ease",
            WebkitTapHighlightColor: "transparent",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}

          {/* Tiny music note badge, only when collapsed */}
          {!isExpanded && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "rgba(251,191,36,0.9)",
                borderRadius: "50%",
                width: "14px",
                height: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.45rem",
                color: "#1c0a00",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              <FaMusic />
            </span>
          )}
        </button>
      </div>

      {/* Mobile hint — shown briefly when first rendered */}
      <div
        style={{
          fontSize: "0.6rem",
          color: "rgba(253,230,138,0.5)",
          textAlign: "right",
          marginTop: "3px",
          pointerEvents: "none",
          letterSpacing: "0.04em",
        }}
      >
        {isTouchDevice ? "tap to expand" : ""}
      </div>

      <audio
        ref={audioRef}
        autoPlay
        playsInline
        onEnded={handleEnded}
        loop={false}
      />
    </div>
  );
};

export default BackgroundMusic;
