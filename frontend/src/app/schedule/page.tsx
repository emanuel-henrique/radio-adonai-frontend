'use client';

import { useTranslation } from '@/i18n/useTranslation';
import styles from './Schedule.module.css';

export default function SchedulePage() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>{t('schedule.title')}</h1>
      <p className={styles.description}>{t('schedule.description')}</p>
    </div>
  );
}
