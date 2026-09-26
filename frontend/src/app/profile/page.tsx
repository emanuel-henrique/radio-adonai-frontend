'use client';

import { useAppContext } from '@/contexts/AppContext';
import { User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { isLoggedIn, user, login, logout } = useAppContext();
  const { t } = useTranslation();
  const iconSize = useIconSize();
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      login(email);
    }
  };

  if (isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.avatarLarge}>
            <User size={iconSize.xxl} />
          </div>
          <h2 className={styles.userName}>{t('profile.hello', { name: user?.name ?? '' })}</h2>
          <p className={styles.userEmail}>{user?.email}</p>

          <button className={styles.logoutButton} onClick={logout}>
            <LogOut size={iconSize.md} />
            {t('profile.logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.iconWrapper}>
          <User size={iconSize.xl} />
        </div>
        <h2 className={styles.authTitle}>
          {isRegistering ? t('profile.createAccount') : t('profile.accessAccount')}
        </h2>
        <p className={styles.authSubtitle}>
          {isRegistering ? t('profile.createSubtitle') : t('profile.loginSubtitle')}
        </p>

        <form onSubmit={handleAuth} className={styles.authForm}>
          <input
            type="email"
            placeholder={t('profile.emailPlaceholder')}
            className={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {isRegistering && (
            <input
              type="password"
              placeholder={t('profile.passwordPlaceholder')}
              className={styles.inputField}
              required
            />
          )}
          <button type="submit" className={styles.primaryButton}>
            {isRegistering ? t('profile.register') : t('profile.login')}
          </button>
        </form>

        <button
          className={styles.switchModeButton}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? t('profile.hasAccount') : t('profile.noAccount')}
        </button>
      </div>
    </div>
  );
}
