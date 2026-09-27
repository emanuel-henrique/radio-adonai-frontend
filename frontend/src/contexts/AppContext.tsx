'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { htmlLangMap, Language } from '@/i18n/translations';
import {
  AuthResponse,
  AuthUser,
  loginUser,
  loginWithGoogle,
  registerUser,
} from '@/lib/api';

type Theme = 'dark' | 'light';
type FontSize = 'small' | 'medium' | 'large';

const TOKEN_KEY = 'adonai_token';
const USER_KEY = 'adonai_user';

interface AppContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
    const savedFontSize = (localStorage.getItem('fontSize') as FontSize) || 'medium';
    const savedLang = (localStorage.getItem('language') as Language) || 'pt';
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    setTheme(savedTheme);
    setFontSizeState(savedFontSize);
    setLanguageState(savedLang);
    applyDocumentPreferences(savedTheme, savedFontSize, savedLang);
    localStorage.removeItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const storeSession = (session: AuthResponse) => {
    setToken(session.token);
    setUser(session.user);
    setIsLoggedIn(true);
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  };

  const signInWithEmail = async (email: string, password: string) => {
    storeSession(await loginUser({ email, password }));
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    storeSession(await registerUser({ name, email, password }));
  };

  const signInWithGoogle = async (idToken: string) => {
    storeSession(await loginWithGoogle(idToken));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        token,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        theme,
        toggleTheme,
        fontSize,
        setFontSize,
        language,
        setLanguage,
      }}
    >
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
