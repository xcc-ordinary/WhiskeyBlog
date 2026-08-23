export type HomeIdentity = {
  kicker: string;
  title: string;
  summary: string;
  heroImage: string;
  heroAlt: string;
};

export type CurrentFact = { label: string; value: string };

export type XiaohongshuLink = {
  href: string;
  label: string;
  description: string;
};

export const homeIdentity: HomeIdentity = {
  kicker: "01 / PERSONAL FIELD NOTES",
  title: "GROWING with every BUILD.",
  summary: "正在成长的开发者。把项目做成证据，把生活保留为感受。",
  heroImage: "/images/placeholders/hero-editorial.svg",
  heroAlt: "待替换：自然光下的个人工作场景照片",
};

export const currentFacts: CurrentFact[] = [
  { label: "NOW", value: "Building WhiskeyBlog" },
  { label: "FOCUS", value: "Web / Product / Visual" },
  { label: "BASED IN", value: "China" },
];

export const xiaohongshuLink: XiaohongshuLink = {
  href: "https://www.xiaohongshu.com/user/profile/63d36fd60000000027029781?tab=note&subTab=note",
  label: "Follow on 小红书 ↗",
  description: "Wesley 的小红书主页。",
};
