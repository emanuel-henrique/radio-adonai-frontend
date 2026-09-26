'use client';

import { Play, Pause, Volume2, Radio, Music, Heart, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Modal/Modal';
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
  listenersCount = 142,
}: PlayerProps) {
  const { t } = useTranslation();
  const iconSize = useIconSize();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeModal, setActiveModal] = useState<'music' | 'prayer' | 'board' | null>(null);

  const program = currentProgram ?? t('player.defaultProgram');
  const song = currentSong ?? t('player.defaultSong');

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className={styles.playerContainer}>
      <div className={styles.liveIndicator}>
        <div className={styles.pulsingDot}></div>
        <span>{t('player.live')}</span>
        <div className={styles.listeners}>
          <Radio size={iconSize.sm} />
          <span>{listenersCount}</span>
        </div>
      </div>

      <div className={styles.artwork}>
        <div className={styles.artworkPlaceholder}>
          <Radio size={iconSize.xxl} className={styles.artworkIcon} />
        </div>
      </div>

      <div className={styles.trackInfo}>
        <h2 className={styles.programName}>{program}</h2>
        <p className={styles.songName}>{song}</p>
      </div>

      <div className={styles.controls}>
        <button className={styles.volumeButton} aria-label="Volume">
          <Volume2 size={iconSize.lg} />
        </button>

        <button
          className={styles.playButton}
          onClick={togglePlay}
          aria-label={isPlaying ? t('player.pause') : t('player.play')}
        >
          {isPlaying ? (
            <Pause size={iconSize.xl} className={styles.playIcon} />
          ) : (
            <Play size={iconSize.xl} className={styles.playIcon} />
          )}
        </button>

        <div className={styles.controlSpacer}></div>
      </div>

      <div className={styles.actionList}>
        <button className={styles.actionRow} onClick={() => setActiveModal('music')}>
          <div className={styles.actionIconBox}>
            <Music size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>{t('player.requestMusic')}</span>
            <span className={styles.actionSubtitle}>{t('player.requestMusicDesc')}</span>
          </div>
        </button>

        <button className={styles.actionRow} onClick={() => setActiveModal('prayer')}>
          <div className={styles.actionIconBox}>
            <Heart size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>{t('player.prayer')}</span>
            <span className={styles.actionSubtitle}>{t('player.prayerDesc')}</span>
          </div>
        </button>

        <button className={styles.actionRow} onClick={() => setActiveModal('board')}>
          <div className={styles.actionIconBox}>
            <MessageSquare size={iconSize.md} />
          </div>
          <div className={styles.actionTexts}>
            <span className={styles.actionTitle}>{t('player.board')}</span>
            <span className={styles.actionSubtitle}>{t('player.boardDesc')}</span>
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
        <button className={styles.modalSubmit} onClick={() => setActiveModal(null)}>
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
        <button className={styles.modalSubmit} onClick={() => setActiveModal(null)}>
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
