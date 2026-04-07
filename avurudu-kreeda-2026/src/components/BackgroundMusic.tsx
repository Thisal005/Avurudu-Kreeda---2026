"use client";

import { useState, useEffect, useRef } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

const musicPlaylist = [
  "/bg musics/kaju-ware.mp3",
  "/bg musics/koho-koho.mp3",
  "/bg musics/me-awrudu-kale.mp3",
];

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    const savedIsMuted = localStorage.getItem("isMuted");
    const savedVolume = localStorage.getItem("bgVolume");
    const savedPlaylist = localStorage.getItem("playlist");
    const savedCurrentTrack = localStorage.getItem("currentTrack");

    setIsMuted(savedIsMuted ? JSON.parse(savedIsMuted) : false);
    setVolume(savedVolume ? JSON.parse(savedVolume) : 0.2);

    if (savedPlaylist && savedCurrentTrack) {
      setPlaylist(JSON.parse(savedPlaylist));
      setCurrentTrack(JSON.parse(savedCurrentTrack));
    } else {
      const shuffledPlaylist = [...musicPlaylist].sort(() => Math.random() - 0.5);
      setPlaylist(shuffledPlaylist);
      localStorage.setItem("playlist", JSON.stringify(shuffledPlaylist));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isMuted", JSON.stringify(isMuted));
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem("bgVolume", JSON.stringify(volume));
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("currentTrack", JSON.stringify(currentTrack));
  }, [currentTrack]);

  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
      audioRef.current.src = playlist[currentTrack];
      audioRef.current
        .play()
        .catch(() => {
          // If autoplay is blocked, retry after the first interaction.
          const retryPlay = () => {
            audioRef.current?.play().catch(() => undefined);
            window.removeEventListener("pointerdown", retryPlay);
          };
          window.addEventListener("pointerdown", retryPlay, { once: true });
        });
    }
  }, [currentTrack, playlist]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (value > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleEnded = () => {
    if (playlist.length > 0) {
      setCurrentTrack((prevTrack) => (prevTrack + 1) % playlist.length);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        onEnded={handleEnded}
        loop={false}
      />
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => handleVolumeChange(Number(event.target.value))}
          aria-label="Background music volume"
          className="w-28 accent-orange-400 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200"
        />
        <button
          onClick={toggleMute}
          className="bg-gray-800 text-white p-3 rounded-full"
          aria-label={isMuted ? "Unmute background music" : "Mute background music"}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

export default BackgroundMusic;
