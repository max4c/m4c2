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
  const audioHandlersRef = React.useRef<{
    onPlaying: (() => void) | null;
    onPause: (() => void) | null;
    onError: (() => void) | null;
  }>({ onPlaying: null, onPause: null, onError: null });

  const [isPlaying, setIsPlaying] = React.useState(false);

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return;
    const audio = new Audio(AMBIENCE_AUDIO_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = DEFAULT_VOLUME;

    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);
    audio.addEventListener('error', onError);

    audioHandlersRef.current = { onPlaying, onPause, onError };
    audioRef.current = audio;
  }, []);

  const play = React.useCallback(() => {
    ensureAudio();
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(true);

    const maybePromise = audio.play();
    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      (maybePromise as Promise<void>)
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

      const handlers = audioHandlersRef.current;
      if (handlers.onPlaying) audio.removeEventListener('playing', handlers.onPlaying);
      if (handlers.onPause) {
        audio.removeEventListener('pause', handlers.onPause);
        audio.removeEventListener('ended', handlers.onPause);
      }
      if (handlers.onError) audio.removeEventListener('error', handlers.onError);

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
