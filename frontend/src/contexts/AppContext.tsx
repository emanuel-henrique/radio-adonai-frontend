'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { htmlLangMap, Language } from '@/i18n/translations';

type Theme = 'dark' | 'light';
type FontSize = 'small' | 'medium' | 'large';

interface AppContextType {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  login: (email: string) => void;
  logout: () => void;
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function applyDocumentPreferences(theme: Theme, fontSize: FontSize, language: Language) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-font-size', fontSize);
  document.documentElement.lang = htmlLangMap[language];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
    const savedFontSize = (localStorage.getItem('fontSize') as FontSize) || 'medium';
    const savedLang = (localStorage.getItem('language') as Language) || 'pt';
    const savedUser = localStorage.getItem('user');

    setTheme(savedTheme);
    setFontSizeState(savedFontSize);
    setLanguageState(savedLang);
    applyDocumentPreferences(savedTheme, savedFontSize, savedLang);

    if (savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string) => {
    const mockUser = { name: email.split('@')[0], email };
    setIsLoggedIn(true);
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = htmlLangMap[lang];
    localStorage.setItem('language', lang);
  };

  return (
    <AppContext.Provider value={{ isLoggedIn, user, login, logout, theme, toggleTheme, fontSize, setFontSize, language, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
