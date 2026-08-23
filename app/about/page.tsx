import { ExplorerHero } from "@/components/exhibition/explorer-hero";
import { SocialIconLinks } from "@/components/exhibition/social-icon-links";

export default function AboutPage() {
  return (
    <ExplorerHero
      eyebrow="02 / OBSERVATION DECK"
      title="关于我，仍在远航。"
      description="在望远镜、手稿与海风之间，持续学习如何把想法变成可靠的作品。"
      image="/images/site-backgrounds/about-observatory-v2.png"
    >
      <div className="about-introduction" aria-label="关于 Wesley">
        <p>哈喽！我叫 Wesley，也可以叫我 Whiskey 或 Sisyphe。</p>
        <p>现在 20 出头，仍在读大学，学的是人工智能。正处于「奥德赛时期」，最近在做关于整理思绪的项目。</p>
        <p>我喜欢看电影：科幻、奇幻，也喜欢推理。《沙丘》《星际穿越》《奥德赛》《指环王》都在我的清单里。</p>
        <p>如果你喜欢 J. R. R. 托尔金的作品，那我们就有得聊了——精灵宝钻资深学者（没那么权威）。</p>
        <p>我也喜欢一点文学，虽然看得不多；但如果你愿意聊起，我很乐意奉陪。MBTI 是 ENFP，SBTI 是 ATM……</p>
        <SocialIconLinks />
      </div>
    </ExplorerHero>
  );
}
