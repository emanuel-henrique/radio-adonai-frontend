'use client';

import { useAppContext } from '@/contexts/AppContext';
import { User, LogOut } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton/GoogleSignInButton';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import { ApiError } from '@/lib/api';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { isLoggedIn, user, signInWithEmail, signUpWithEmail, signInWithGoogle, logout } =
    useAppContext();
  const { t } = useTranslation();
  const iconSize = useIconSize();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorMessage = (err: unknown) =>
    err instanceof ApiError ? err.message : t('auth.unexpectedError');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle(idToken);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.profileCard}>
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarLarge}>
              <User size={iconSize.xxl} />
            </div>
          )}
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

        <GoogleSignInButton
          text="continue"
          onCredential={handleGoogle}
        />

        <div className={styles.divider}>
          <span>{t('auth.or')}</span>
        </div>

        <form onSubmit={handleAuth} className={styles.authForm}>
          {isRegistering && (
            <input
              type="text"
              placeholder={t('profile.namePlaceholder')}
              className={styles.inputField}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder={t('profile.emailPlaceholder')}
            className={styles.inputField}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={
              isRegistering
                ? t('profile.passwordPlaceholder')
                : t('auth.password')
            }
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
            {isSubmitting
              ? t('auth.loading')
              : isRegistering
                ? t('profile.register')
                : t('profile.login')}
          </button>
        </form>

        <button
          className={styles.switchModeButton}
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
        >
          {isRegistering ? t('profile.hasAccount') : t('profile.noAccount')}
        </button>
      </div>
    </div>
  );
}
