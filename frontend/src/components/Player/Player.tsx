'use client';

import {
  Headphones,
  Heart,
  LoaderCircle,
  MessageSquare,
  Music,
  Pause,
  Play,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal/Modal';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import styles from './Player.module.css';

interface PlayerProps {
  currentProgram?: string;
  currentSong?: string;
  listenersCount?: number;
}

export function Player({
  currentProgram,
  currentSong,
  listenersCount,
}: PlayerProps) {
  const { radio } = useAppContext();
  const { t } = useTranslation();
  const iconSize = useIconSize();
  const [activeModal, setActiveModal] = useState<
    'music' | 'prayer' | 'board' | null
  >(null);
  const [artworkFailed, setArtworkFailed] = useState(false);

  const {
    metadata,
    hasMetadataError,
    isPlaying,
    isActive,
    isOnline,
    isBuffering,
    hasStreamError,
    volume,
    isMuted,
    togglePlay,
    retry,
    changeVolume,
    toggleMute,
  } = radio;

  const artwork = metadata?.artwork;
  useEffect(() => {
    setArtworkFailed(false);
  }, [artwork]);

  const program =
    metadata?.title ?? currentProgram ?? t('player.defaultProgram');
  const song = metadata?.currentTrack ?? currentSong ?? t('player.defaultSong');
  const listeners = metadata?.listeners ?? listenersCount;

  const statusLabel = !isOnline
    ? t('player.offline')
    : isPlaying && isBuffering
      ? t('player.connecting')
      : t('player.live');

  return (
    <div className={styles.playerContainer}>
      <div
        className={`${styles.liveIndicator} ${isOnline ? '' : styles.liveIndicatorOffline} ${
          isActive ? styles.liveIndicatorActive : ''
        }`}
      >
        <div className={styles.pulsingDot}></div>
        <span>{statusLabel}</span>
        <div className={styles.listeners}>
          <Headphones size={iconSize.sm} />
          <span>{listeners ?? '--'}</span>
        </div>
      </div>

      <div className={styles.artwork}>
        {artwork && !artworkFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artwork}
            alt=""
            className={styles.artworkImage}
            onError={() => setArtworkFailed(true)}
          />
        ) : (
          <div className={styles.artworkPlaceholder}>
            <Radio size={iconSize.xxl} className={styles.artworkIcon} />
          </div>
        )}
        {isActive && (
          <div className={styles.artworkGlow} aria-hidden="true"></div>
        )}
      </div>

      <div className={styles.trackInfo}>
        <h2 className={styles.programName}>{program}</h2>
        <p className={styles.songName} title={song}>
          {song}
        </p>
        {metadata?.genre && <p className={styles.genre}>{metadata.genre}</p>}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={hasStreamError ? retry : togglePlay}
          aria-label={isPlaying ? t('player.pause') : t('player.play')}
        >
          {isBuffering ? (
            <LoaderCircle
              size={iconSize.xl}
              className={`${styles.playIcon} ${styles.spin}`}
            />
          ) : isPlaying ? (
            <Pause size={iconSize.xl} className={styles.playIcon} />
          ) : (
            <Play size={iconSize.xl} className={styles.playIcon} />
          )}
        </button>

        <div className={styles.volumeRow}>
          <button
            className={styles.volumeButton}
            onClick={toggleMute}
            aria-label={isMuted ? t('player.unmute') : t('player.mute')}
            aria-pressed={isMuted}
          >
            {isMuted ? (
              <VolumeX size={iconSize.lg} />
            ) : (
              <Volume2 size={iconSize.lg} />
            )}
          </button>
          <div className={styles.volumeControl}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              className={styles.volumeSlider}
              aria-label={t('player.volume')}
            />
          </div>
        </div>
      </div>

      {hasStreamError && (
        <p className={styles.statusNote}>{t('player.streamError')}</p>
      )}
      {hasMetadataError && (
        <p className={styles.statusNote}>{t('player.metadataError')}</p>
      )}

      <div className={styles.actionList}>
        <button
          className={styles.actionRow}
          onClick={() => setActiveModal('music')}
        >
          <div className={styles.actionIconBox}>
            <Music size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>
              {t('player.requestMusic')}
            </span>
            <span className={styles.actionSubtitle}>
              {t('player.requestMusicDesc')}
            </span>
          </div>
        </button>

        <button
          className={styles.actionRow}
          onClick={() => setActiveModal('prayer')}
        >
          <div className={styles.actionIconBox}>
            <Heart size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>{t('player.prayer')}</span>
            <span className={styles.actionSubtitle}>
              {t('player.prayerDesc')}
            </span>
          </div>
        </button>

        <button
          className={styles.actionRow}
          onClick={() => setActiveModal('board')}
        >
          <div className={styles.actionIconBox}>
            <MessageSquare size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>{t('player.board')}</span>
            <span className={styles.actionSubtitle}>
              {t('player.boardDesc')}
            </span>
          </div>
        </button>
      </div>

      <Modal
        isOpen={activeModal === 'music'}
        onClose={() => setActiveModal(null)}
        title={t('player.musicModal.title')}
      >
        <p className={styles.modalDescription}>
          {t('player.musicModal.question')}
        </p>
        <input
          type="text"
          placeholder={t('player.musicModal.placeholder')}
          className={styles.modalInput}
        />
        <button
          className={styles.modalSubmit}
          onClick={() => setActiveModal(null)}
        >
          {t('player.musicModal.submit')}
        </button>
      </Modal>

      <Modal
        isOpen={activeModal === 'prayer'}
        onClose={() => setActiveModal(null)}
        title={t('player.prayerModal.title')}
      >
        <p className={styles.modalDescription}>
          {t('player.prayerModal.text')}
        </p>
        <textarea
          placeholder={t('player.prayerModal.placeholder')}
          className={styles.modalTextarea}
        />
        <button
          className={styles.modalSubmit}
          onClick={() => setActiveModal(null)}
        >
          {t('player.prayerModal.submit')}
        </button>
      </Modal>

      <Modal
        isOpen={activeModal === 'board'}
        onClose={() => setActiveModal(null)}
        title={t('player.boardModal.title')}
      >
        <p className={styles.modalDescriptionCenter}>
          {t('player.boardModal.text')}
        </p>
      </Modal>
    </div>
  );
}
