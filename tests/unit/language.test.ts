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
});
