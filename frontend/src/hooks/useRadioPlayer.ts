'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RADIO_AUDIO_SOURCES,
  fetchRadioMetadata,
  type RadioMetadata,
} from '@/lib/radio';

const VOLUME_KEY = 'adonai_volume';
const MUTED_KEY = 'adonai_muted';
const DEFAULT_VOLUME = 0.8;
const DEFAULT_POLL_INTERVAL = 10_000;

function readStoredVolume(): number {
  const stored = Number.parseFloat(
    window.localStorage.getItem(VOLUME_KEY) ?? '',
  );
  if (!Number.isFinite(stored)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, stored));
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useRadioPlayer(pollInterval = DEFAULT_POLL_INTERVAL) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(false);
  const sourceIndexRef = useRef(0);

  const [metadata, setMetadata] = useState<RadioMetadata | null>(null);
  const [hasMetadataError, setHasMetadataError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStreamError, setHasStreamError] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    const storedVolume = readStoredVolume();
    const storedMuted = window.localStorage.getItem(MUTED_KEY) === 'true';

    volumeRef.current = storedVolume;
    mutedRef.current = storedMuted;
    setVolume(storedVolume);
    setIsMuted(storedMuted);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.setAttribute('playsinline', '');
    audio.volume = volumeRef.current;
    audio.muted = mutedRef.current;
    audio.src = RADIO_AUDIO_SOURCES[0];
    audioRef.current = audio;

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setHasStreamError(false);
    };
    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };
    const handleBuffering = () => setIsBuffering(true);
    const handleError = () => {
      // A fonte atual falhou: tenta a próxima antes de desistir.
      const next = sourceIndexRef.current + 1;
      if (next < RADIO_AUDIO_SOURCES.length) {
        sourceIndexRef.current = next;
        setSourceIndex(next);
        audio.src = RADIO_AUDIO_SOURCES[next];
        audio.load();
        if (!audio.paused) {
          void audio.play().catch(() => undefined);
        }
        return;
      }

      setIsPlaying(false);
      setIsBuffering(false);
      setHasStreamError(true);
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleBuffering);
    audio.addEventListener('stalled', handleBuffering);
    audio.addEventListener('error', handleError);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        void audio.play().catch(() => undefined);
      });
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    }

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleBuffering);
      audio.removeEventListener('stalled', handleBuffering);
      audio.removeEventListener('error', handleError);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      }
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isFetching = false;

    const load = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const data = await fetchRadioMetadata(controller.signal);
        setMetadata(data);
        setHasMetadataError(false);
      } catch (error) {
        if (!isAbortError(error)) {
          setHasMetadataError(true);
        }
      } finally {
        isFetching = false;
      }
    };

    void load();

    const interval = setInterval(() => {
      if (document.hidden) return;
      void load();
    }, pollInterval);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [pollInterval]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.error) {
      audio.src = RADIO_AUDIO_SOURCES[sourceIndexRef.current];
      audio.load();
    }

    setIsPlaying(true);
    setIsBuffering(true);
    setHasStreamError(false);

    audio.play().catch(() => {
      setIsPlaying(false);
      setIsBuffering(false);
      setHasStreamError(true);
    });
  }, []);

  /** Volta para a fonte principal e tenta tocar de novo. */
  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    sourceIndexRef.current = 0;
    setSourceIndex(0);
    audio.src = RADIO_AUDIO_SOURCES[0];
    audio.load();
    setIsBuffering(true);
    setHasStreamError(false);

    audio.play().catch(() => {
      setIsPlaying(false);
      setIsBuffering(false);
      setHasStreamError(true);
    });
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current?.paused ?? true) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const changeVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));

    volumeRef.current = clamped;
    mutedRef.current = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
    window.localStorage.setItem(VOLUME_KEY, String(clamped));
    window.localStorage.setItem(MUTED_KEY, String(clamped === 0));

    const audio = audioRef.current;
    if (audio) {
      audio.volume = clamped;
      audio.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;

    mutedRef.current = next;
    setIsMuted(next);
    window.localStorage.setItem(MUTED_KEY, String(next));

    const audio = audioRef.current;
    if (audio) {
      audio.muted = next;
    }
  }, []);

  const isOnline = metadata ? metadata.isOnline : !hasMetadataError;
  const isActive = isPlaying && isOnline;
  const hasNextSource = sourceIndex + 1 < RADIO_AUDIO_SOURCES.length;

  return {
    metadata,
    hasMetadataError,
    isPlaying,
    isActive,
    isOnline,
    isBuffering,
    hasStreamError,
    hasNextSource,
    sourceIndex,
    volume,
    isMuted,
    togglePlay,
    retry,
    changeVolume,
    toggleMute,
  };
}
