'use client';

import { useAppContext } from '@/contexts/AppContext';
import { translations, TranslationKey } from './translations';

export function useTranslation() {
  const { language } = useAppContext();

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[language][key] ?? translations.pt[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    return text;
  };

  return { t, language };
}

export function useIconSize() {
  const { fontSize } = useAppContext();
  const scale = { small: 0.875, medium: 1, large: 1.125 }[fontSize];
  return {
    sm: Math.round(16 * scale),
    md: Math.round(20 * scale),
    lg: Math.round(24 * scale),
    xl: Math.round(32 * scale),
    xxl: Math.round(48 * scale),
  };
}
