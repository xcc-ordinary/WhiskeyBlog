"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import type { ArticleHeading } from "@/lib/article";

export function ArticleReadingTools({ headings, title }: { headings: ArticleHeading[]; title: string }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [shareLabel, setShareLabel] = useState("分享");

  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".blog-article");
    if (!article) return;

    const update = () => {
      const start = article.offsetTop;
      const distance = Math.max(1, article.offsetHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / distance)));

      let current = headings[0]?.id ?? "";
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= 160) current = heading.id;
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  async function shareArticle() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setShareLabel("已复制");
        window.setTimeout(() => setShareLabel("分享"), 1800);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareLabel("复制失败");
      window.setTimeout(() => setShareLabel("分享"), 1800);
    }
  }

  return (
    <>
      <div aria-hidden="true" className="article-progress" style={{ "--article-progress": progress } as CSSProperties} />
      <aside aria-label="文章导航" className="article-reading-rail">
        <p>阅读进度</p>
        <div aria-hidden="true" className="article-progress-track"><span style={{ height: `${progress * 100}%` }} /></div>
        {headings.length ? (
          <nav aria-label="本文目录">
            <span>本文目录</span>
            <ol>
              {headings.map((heading) => (
                <li data-level={heading.level} key={heading.id}>
                  <Link aria-current={activeId === heading.id ? "location" : undefined} href={`#${heading.id}`}>{heading.text}</Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </aside>
      {headings.length ? (
        <details className="article-mobile-toc">
          <summary><span>本文目录</span><span aria-hidden="true">展开</span></summary>
          <ol>
            {headings.map((heading) => <li data-level={heading.level} key={heading.id}><Link href={`#${heading.id}`}>{heading.text}</Link></li>)}
          </ol>
        </details>
      ) : null}
      <button className="article-share-button" onClick={shareArticle} type="button"><span aria-hidden="true">↗</span>{shareLabel}</button>
    </>
  );
}
