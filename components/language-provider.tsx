"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { languageContent, nextLanguage, type Language } from "@/lib/language";

type LanguageContextValue = {
  content: (typeof languageContent)[Language];
  language: Language;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLanguage = window.localStorage.getItem("language");
      if (savedLanguage === "en" || savedLanguage === "zh") setLanguage(savedLanguage);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    content: languageContent[language],
    language,
    toggleLanguage: () => {
      const updatedLanguage = nextLanguage(language);
      document.documentElement.dataset.languageSwitching = "true";
      window.setTimeout(() => delete document.documentElement.dataset.languageSwitching, 300);
      window.localStorage.setItem("language", updatedLanguage);
      setLanguage(updatedLanguage);
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
