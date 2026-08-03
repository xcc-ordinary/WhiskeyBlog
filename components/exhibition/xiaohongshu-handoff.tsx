import type { JSX } from "react";

import { xiaohongshuLink } from "@/lib/exhibition";
import { Reveal } from "@/components/exhibition/reveal";

export function XiaohongshuHandoff(): JSX.Element {
  return (
    <Reveal delay={0.1}>
      <aside className="xiaohongshu-handoff" aria-label="小红书外部主页">
        <p className="section-label">FIELD NOTES ELSEWHERE</p>
        <h2>小红书上的另一册生活记录。</h2>
        <p>这是一个外部主页入口，不嵌入或模拟实时笔记。更多随手记录会在真实的小红书主页继续发生。</p>
        <a href={xiaohongshuLink.href} rel="noreferrer" target="_blank">{xiaohongshuLink.label}</a>
        <small>{xiaohongshuLink.description}</small>
      </aside>
    </Reveal>
  );
}
