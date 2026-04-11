// ──────────────────────────────────────────────────────────────
// useAudioManager.ts — Preloads, plays, and cleans up all
// firecracker sound effects via the Web Audio / HTMLAudioElement API.
// ──────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react';
import { SOUND_FILES } from '../GiniUthsawayaConfig';

export interface AudioManager {
  playSound: (key: string, opts?: { volume?: number; restart?: boolean }) => void;
  stopSound: (key: string) => void;
}

/**
 * Preloads every entry in `SOUND_FILES` as an `HTMLAudioElement`,
 * returns stable `playSound` / `stopSound` callbacks, and
 * cleans up all audio on unmount.
 */
export function useAudioManager(): AudioManager {
  const soundsRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    const map: Record<string, HTMLAudioElement> = {};

    for (const [key, src] of Object.entries(SOUND_FILES)) {
      try {
        const audio = new Audio(src);
        audio.preload = 'auto';
        map[key] = audio;
      } catch (err) {
        console.warn(`[AudioManager] Failed to preload "${key}":`, err);
      }
    }

    soundsRef.current = map;

    return () => {
      for (const audio of Object.values(map)) {
        try {
          audio.pause();
          audio.src = '';
        } catch {
          // best-effort cleanup
        }
      }
      soundsRef.current = {};
    };
  }, []);

  const playSound = useCallback(
    (
      key: string,
      { volume = 1, restart = true }: { volume?: number; restart?: boolean } = {},
    ) => {
      const audio = soundsRef.current[key];
      if (!audio) {
        console.warn(`[AudioManager] Unknown sound key "${key}"`);
        return;
      }
      if (restart) {
        audio.currentTime = 0;
      }
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.play().catch(() => {
        /* autoplay policy — generally fine after user interaction */
      });
    },
    [],
  );

  const stopSound = useCallback((key: string) => {
    const audio = soundsRef.current[key];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  return { playSound, stopSound };
}
