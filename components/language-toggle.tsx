"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { content, toggleLanguage } = useLanguage();

  return <button aria-label={content.languageToggle} className="language-toggle" onClick={toggleLanguage} type="button">{content.languageShort}</button>;
}
