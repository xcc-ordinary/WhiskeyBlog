import { describe, expect, it } from "vitest";

import { languageContent, nextLanguage } from "@/lib/language";

describe("language framework", () => {
  it("toggles between Chinese and English", () => {
    expect(nextLanguage("zh")).toBe("en");
    expect(nextLanguage("en")).toBe("zh");
  });

  it("keeps the prepared quote translation", () => {
    expect(languageContent.en.quote).toBe("The limits of my language mean the limits of my world.");
  });

  it("translates the home hero instead of leaving its title static", () => {
    expect(languageContent.zh.home.title).not.toBe(languageContent.en.home.title);
  });

  it("translates every authored home-page chapter", () => {
    expect(languageContent.zh.home.selectedWorkTitle).not.toBe(languageContent.en.home.selectedWorkTitle);
    expect(languageContent.zh.home.projects[0].title).toBe("藏梦书境");
    expect(languageContent.en.home.projects[0].title).toBe("Dreambook Realm");
    expect(languageContent.zh.home.gallery.quote).not.toBe(languageContent.en.home.gallery.quote);
    expect(languageContent.zh.footer.title).not.toBe(languageContent.en.footer.title);
  });
});
