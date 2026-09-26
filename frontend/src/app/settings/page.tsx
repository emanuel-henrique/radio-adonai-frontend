'use client';

import { useAppContext } from '@/contexts/AppContext';
import { Moon, Sun, Type, Globe, Bell, ChevronRight, Check } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Modal/Modal';
import { fontSizeLabels, languageLabels, Language } from '@/i18n/translations';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { theme, toggleTheme, fontSize, setFontSize, language, setLanguage } = useAppContext();
  const { t } = useTranslation();
  const iconSize = useIconSize();
  const [activeModal, setActiveModal] = useState<'font' | 'lang' | null>(null);

  const fontNames = fontSizeLabels[language];
  const langNames = languageLabels[language];

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>{t('settings.title')}</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.appearance')}</h2>

        <div
          className={styles.optionItem}
          onClick={toggleTheme}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
          aria-label={theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
        >
          <div className={styles.optionContent}>
            <div className={styles.iconBox}>
              {theme === 'dark' ? <Moon size={iconSize.md} /> : <Sun size={iconSize.md} />}
            </div>
            <div className={styles.optionTexts}>
              <span className={styles.optionLabel}>
                {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
              </span>
              <span className={styles.optionDescription}>{t('settings.themeDesc')}</span>
            </div>
          </div>
          <div
            className={`${styles.toggle} ${theme === 'dark' ? styles.toggleActive : ''}`}
            aria-hidden="true"
          />
        </div>

        <div
          className={styles.optionItem}
          onClick={() => setActiveModal('font')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('font')}
        >
          <div className={styles.optionContent}>
            <div className={styles.iconBox}><Type size={iconSize.md} /></div>
            <div className={styles.optionTexts}>
              <span className={styles.optionLabel}>{t('settings.fontSize')}</span>
              <span className={styles.optionDescription}>{fontNames[fontSize]}</span>
            </div>
          </div>
          <ChevronRight size={iconSize.md} className={styles.chevron} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('settings.preferences')}</h2>

        <div
          className={styles.optionItem}
          onClick={() => setActiveModal('lang')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('lang')}
        >
          <div className={styles.optionContent}>
            <div className={styles.iconBox}><Globe size={iconSize.md} /></div>
            <div className={styles.optionTexts}>
              <span className={styles.optionLabel}>{t('settings.language')}</span>
              <span className={styles.optionDescription}>{langNames[language]}</span>
            </div>
          </div>
          <ChevronRight size={iconSize.md} className={styles.chevron} />
        </div>

        <div className={styles.optionItem} aria-disabled="true">
          <div className={styles.optionContent}>
            <div className={styles.iconBox}><Bell size={iconSize.md} /></div>
            <div className={styles.optionTexts}>
              <span className={styles.optionLabel}>{t('settings.notifications')}</span>
              <span className={styles.optionDescription}>{t('settings.notificationsDesc')}</span>
            </div>
          </div>
          <div className={`${styles.toggle} ${styles.toggleActive}`} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.versionInfo}>
        <p>{t('settings.version')}</p>
      </div>

      <Modal isOpen={activeModal === 'font'} onClose={() => setActiveModal(null)} title={t('settings.fontSize')}>
        <div className={styles.modalOptions}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              type="button"
              onClick={() => { setFontSize(size); setActiveModal(null); }}
              className={`${styles.modalOption} ${fontSize === size ? styles.modalOptionSelected : ''}`}
            >
              {fontNames[size]}
              {fontSize === size && <Check size={iconSize.md} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'lang'} onClose={() => setActiveModal(null)} title={t('settings.language')}>
        <div className={styles.modalOptions}>
          {(['pt', 'en', 'es'] as const).map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => { setLanguage(lang as Language); setActiveModal(null); }}
              className={`${styles.modalOption} ${language === lang ? styles.modalOptionSelected : ''}`}
            >
              {langNames[lang]}
              {language === lang && <Check size={iconSize.md} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
