'use client';

import * as React from 'react';

type AmbienceContextValue = {
  isPlaying: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
};

const AmbienceContext = React.createContext<AmbienceContextValue | null>(null);

const TARGET_GAIN = 0.045;
const BUFFER_SECONDS = 24;
const FADE_IN_SECONDS = 0.45;
const FADE_OUT_SECONDS = 0.25;

const getAudioContextCtor = () => {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as any).webkitAudioContext || null;
};

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<AudioBufferSourceNode | null>(null);
  const gainRef = React.useRef<GainNode | null>(null);
  const suspendTimeoutRef = React.useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);

  const ensureGraph = React.useCallback(() => {
    if (audioContextRef.current && gainRef.current && sourceRef.current) return;

    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.value = 0;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.0001;

    const length = Math.floor(context.sampleRate * BUFFER_SECONDS);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    source.start(0);

    audioContextRef.current = context;
    gainRef.current = gain;
    sourceRef.current = source;
  }, []);

  const play = React.useCallback(() => {
    window.clearTimeout(suspendTimeoutRef.current ?? undefined);
    suspendTimeoutRef.current = null;

    ensureGraph();
    const context = audioContextRef.current;
    const gain = gainRef.current;
    if (!context || !gain) return;

    const resume = async () => {
      if (context.state === 'suspended') {
        try {
          await context.resume();
        } catch {
          return;
        }
      }

      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(TARGET_GAIN, now + FADE_IN_SECONDS);
      setIsPlaying(true);
    };

    void resume();
  }, [ensureGraph]);

  const pause = React.useCallback(() => {
    window.clearTimeout(suspendTimeoutRef.current ?? undefined);
    suspendTimeoutRef.current = null;

    const context = audioContextRef.current;
    const gain = gainRef.current;
    if (!context || !gain) {
      setIsPlaying(false);
      return;
    }

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
    setIsPlaying(false);

    suspendTimeoutRef.current = window.setTimeout(() => {
      void context.suspend();
    }, Math.ceil(FADE_OUT_SECONDS * 1000) + 40);
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
      window.clearTimeout(suspendTimeoutRef.current ?? undefined);
      suspendTimeoutRef.current = null;

      try {
        sourceRef.current?.stop();
      } catch {
        // ignore
      }

      try {
        void audioContextRef.current?.close();
      } catch {
        // ignore
      }
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

