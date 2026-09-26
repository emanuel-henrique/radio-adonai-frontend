'use client';

import { Home, Settings, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation, useIconSize } from '@/i18n/useTranslation';
import styles from './Navigation.module.css';

export function Navigation() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const iconSize = useIconSize();

  const navItems = [
    { icon: Home, labelKey: 'nav.home' as const, path: '/' },
    { icon: LayoutGrid, labelKey: 'nav.schedule' as const, path: '/schedule' },
    { icon: Settings, labelKey: 'nav.settings' as const, path: '/settings' },
  ];

  return (
    <nav className={styles.navigation} aria-label={t('nav.settings')}>
      <ul className={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <li key={item.path} className={styles.navItem}>
              <Link
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={styles.iconContainer}>
                  <Icon size={iconSize.lg} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={styles.navLabel}>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
