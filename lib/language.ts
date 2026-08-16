export const languages = ["zh", "en"] as const;

export type Language = (typeof languages)[number];

export const languageContent = {
  zh: {
    navigation: ["首页", "关于我", "项目", "档案", "博客"],
    languageToggle: "切换至英文",
    languageShort: "EN",
    quote: "语言的边界，即为世界的边界",
    home: {
      kicker: "01 / 个人创作手记",
      title: "语言的边界，即为世界的边界",
      titleAuthor: "— 维特根斯坦",
      summary: "正在成长的开发者。把项目做成证据，把生活保留为感受。",
      facts: [
        { label: "此刻", value: "构建 WhiskeyBlog" },
        { label: "专注", value: "Web / 产品 / 视觉" },
        { label: "所在地", value: "中国" },
      ],
    },
  },
  en: {
    navigation: ["Home", "About", "Work", "Archive", "Notes"],
    languageToggle: "Switch to Chinese",
    languageShort: "中",
    quote: "The limits of my language mean the limits of my world.",
    home: {
      kicker: "01 / PERSONAL FIELD NOTES",
      title: "The limits of my language mean the limits of my world.",
      titleAuthor: "— Ludwig Wittgenstein",
      summary: "A developer in progress — turning projects into evidence and leaving room for life to be felt.",
      facts: [
        { label: "NOW", value: "Building WhiskeyBlog" },
        { label: "FOCUS", value: "Web / Product / Visual" },
        { label: "BASED IN", value: "China" },
      ],
    },
  },
} as const;

export function nextLanguage(language: Language): Language {
  return language === "zh" ? "en" : "zh";
}
