'use client';

import { User, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import styles from './Header.module.css';

export function Header() {
  const { t } = useTranslation();
  const iconSize = useIconSize();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{t('app.title')}</h1>
      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label={t('header.share')}>
          <Share2 size={iconSize.md} />
        </button>
        <Link href="/profile" className={styles.iconButton} aria-label={t('header.profile')}>
          <User size={iconSize.md} />
        </Link>
      </div>
    </header>
  );
}
