'use client';

import * as React from 'react';

type AmbienceContextValue = {
  isPlaying: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
};

const AmbienceContext = React.createContext<AmbienceContextValue | null>(null);

const AMBIENCE_AUDIO_SRC = '/images/objects/birds.mp3';
const DEFAULT_VOLUME = 0.25;

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return;
    const audio = new Audio(AMBIENCE_AUDIO_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;
  }, []);

  const play = React.useCallback(() => {
    ensureAudio();
    const audio = audioRef.current;
    if (!audio) return;

    const maybePromise = audio.play();
    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      (maybePromise as Promise<void>)
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }

    setIsPlaying(!audio.paused);
  }, [ensureAudio]);

  const pause = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const toggle = React.useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  }, [isPlaying, pause, play]);

  React.useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const value = React.useMemo(
    () => ({
      isPlaying,
      toggle,
      play,
      pause,
    }),
    [isPlaying, toggle, play, pause]
  );

  return (
    <AmbienceContext.Provider value={value}>{children}</AmbienceContext.Provider>
  );
}

export function useAmbience() {
  const context = React.useContext(AmbienceContext);
  if (!context) {
    throw new Error('useAmbience must be used within an AmbienceProvider');
  }
  return context;
}
