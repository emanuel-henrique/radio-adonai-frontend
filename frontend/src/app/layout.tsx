import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Rádio Adonai",
  description: "Aplicativo de rádio da Igreja Adonai",
};

import { Navigation } from "@/components/Navigation/Navigation";
import { Header } from "@/components/Header/Header";

import { AppProvider } from "@/contexts/AppContext";

const preferencesScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'dark';
    var fontSize = localStorage.getItem('fontSize') || 'medium';
    var lang = localStorage.getItem('language') || 'pt';
    var langMap = { pt: 'pt-BR', en: 'en', es: 'es' };
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.lang = langMap[lang] || 'pt-BR';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" data-font-size="medium" suppressHydrationWarning>
      <head>
        <Script
          id="preferences-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: preferencesScript }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProvider>
          <div className="app-layout">
            <Navigation />
            <div className="main-content">
              <Header />
              {children}
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
