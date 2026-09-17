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
      selectedWorkKicker: "02 / 精选项目",
      selectedWorkTitle: "正在发生的作品",
      selectedWorkSummary: "两件从真实生活出发、持续生长的数字作品。",
      projects: [
        { title: "藏梦书境", description: "把难以言说的情绪收进书页，在阅读与陪伴中找到出口。", tags: "情绪陪伴 / 阅读体验", alt: "藏梦书境项目封面，五扇情绪之门通往书中世界" },
        { title: "Lumi", description: "面向亲密关系的 AI 沟通陪伴工具，让表达更真诚，让靠近更有分寸。", tags: "AI / 关系沟通", alt: "Lumi 恋爱沟通陪伴工具项目封面" },
      ],
      gallery: {
        ariaLabel: "横向滚动生活档案",
        kicker: "03 / 生活档案",
        quote: "计划之间的那些瞬间，才是最后留在我们心里的。",
        quoteLabel: "私人观察",
        ending: "轻轻收好，每一个日常",
        placeholder: "等待显影的一刻",
        privateArchive: "私人档案",
        published: "已发布照片",
      },
    },
    mobileNavigation: { open: "目录 +", title: "导航菜单", close: "关闭 ×", ariaLabel: "移动导航" },
    footer: { kicker: "信号站 / 频道开放", title: "继续航行。", frequency: "发报频率", navigation: "航标清单" },
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
      selectedWorkKicker: "02 / SELECTED WORK",
      selectedWorkTitle: "Work in progress",
      selectedWorkSummary: "Two evolving digital experiences rooted in real life.",
      projects: [
        { title: "Dreambook Realm", description: "A gentle reading experience that gives difficult emotions a place to rest and be understood.", tags: "EMOTIONAL CARE / READING", alt: "Dreambook Realm cover with five emotional doorways leading into a storybook world" },
        { title: "Lumi", description: "An AI companion for more honest communication and more thoughtful closeness in relationships.", tags: "AI / RELATIONSHIPS", alt: "Lumi AI relationship communication companion cover" },
      ],
      gallery: {
        ariaLabel: "Horizontal life archive",
        kicker: "03 / LIFE ARCHIVE",
        quote: "The moments between the plans are the ones that stay with us.",
        quoteLabel: "PRIVATE OBSERVATIONS",
        ending: "EVERYDAY, HELD LIGHTLY",
        placeholder: "A moment waiting to surface",
        privateArchive: "Private archive",
        published: "Published photograph",
      },
    },
    mobileNavigation: { open: "Index +", title: "Navigation", close: "Close ×", ariaLabel: "Mobile navigation" },
    footer: { kicker: "SIGNAL STATION / OPEN CHANNEL", title: "Keep moving.", frequency: "Frequency", navigation: "Waypoints" },
  },
} as const;

export function nextLanguage(language: Language): Language {
  return language === "zh" ? "en" : "zh";
}
