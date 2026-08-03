import Image from "next/image";
import type { JSX } from "react";

import { currentFacts, homeIdentity } from "@/lib/exhibition";
import { Reveal } from "@/components/exhibition/reveal";

export function AboutFieldNotes(): JSX.Element {
  return (
    <section className="about-field-notes site-container" aria-labelledby="about-title">
      <Reveal>
        <p className="section-label">04 / ABOUT</p>
        <h1 id="about-title">Still learning,<br />still making.</h1>
      </Reveal>
      <div className="about-field-notes-grid">
        <Reveal delay={0.06} className="about-field-notes-copy">
          <p>我是一名正在成长的开发者，喜欢把模糊的想法做成可以被体验、验证和持续改进的东西。</p>
          <p>这里不是一份简历，而是一份还在展开的工作笔记：项目、观察、照片，以及每一次重新开始。</p>
          <dl className="current-facts" aria-label="当前状态">
            {currentFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
          </dl>
        </Reveal>
        <Reveal delay={0.12}>
          <figure className="about-portrait-placeholder">
            <div className="about-portrait-frame">
              <Image alt={homeIdentity.heroAlt} fill sizes="(max-width: 760px) calc(100vw - 32px), 38vw" src={homeIdentity.heroImage} />
            </div>
            <figcaption>待替换：一张自然、不摆拍的个人照片</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
