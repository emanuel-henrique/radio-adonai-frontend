'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/i18n/useTranslation';
import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from '@/lib/googleIdentity';
import styles from './GoogleSignInButton.module.css';

interface GoogleSignInButtonProps {
  text?: 'signin' | 'signup' | 'continue';
  onCredential: (idToken: string) => void;
}

export function GoogleSignInButton({
  text = 'signin',
  onCredential,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { theme } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialRef = useRef(onCredential);
  const [buttonWidth, setButtonWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    credentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setButtonWidth(containerRef.current.clientWidth);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    loadGoogleIdentity()
      .then((identity) => {
        if (cancelled) return;
        identity.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => credentialRef.current(response.credential),
          cancel_on_tap_outside: true,
        });
        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) setHasFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!isReady || !container || buttonWidth === 0) return;

    container.innerHTML = '';
    loadGoogleIdentity()
      .then((identity) => {
        identity.renderButton(container, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline_blue',
          size: 'large',
          shape: 'pill',
          text,
          width: buttonWidth,
          locale: 'pt_BR',
        });
      })
      .catch(() => setHasFailed(true));
  }, [isReady, buttonWidth, text, theme]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className={styles.warning}>{t('auth.googleNotConfigured')}</p>
    );
  }

  if (hasFailed) {
    return <p className={styles.warning}>{t('auth.googleUnavailable')}</p>;
  }

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.buttonSlot} />
    </div>
  );
}
