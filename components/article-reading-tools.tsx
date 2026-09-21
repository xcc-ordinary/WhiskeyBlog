"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ArticleHeading } from "@/lib/article";

export function ArticleReadingTools({ headings }: { headings: ArticleHeading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [railOpen, setRailOpen] = useState(false);
  let currentSectionId = headings.find((heading) => heading.level === 2)?.id ?? "";
  for (const heading of headings) {
    if (heading.level === 2) currentSectionId = heading.id;
    if (heading.id === activeId) break;
  }
  const visibleHeadings = headings.filter((heading, index) => {
    if (heading.level === 2) return true;
    for (let parentIndex = index - 1; parentIndex >= 0; parentIndex -= 1) {
      const parent = headings[parentIndex];
      if (parent.level === 2) return parent.id === currentSectionId;
    }
    return false;
  });

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

  return (
    <>
      <aside
        aria-label="文章导航"
        className="article-reading-rail"
        data-open={railOpen || undefined}
        data-reading={progress > 0.025 || undefined}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setRailOpen(false);
        }}
        onFocusCapture={() => setRailOpen(true)}
        onPointerEnter={() => setRailOpen(true)}
        onPointerLeave={() => setRailOpen(false)}
      >
        <button aria-expanded={railOpen} aria-label="展开本文目录" className="article-rail-trigger" onClick={() => setRailOpen((open) => !open)} type="button">
          <span aria-hidden="true" className="article-progress-value"><span>航标</span><strong>{Math.round(progress * 100)}%</strong></span>
          <span aria-hidden="true" className="article-progress-track">
            <span className="article-progress-fill" style={{ height: `${progress * 100}%` }} />
            <span className="article-progress-marker" style={{ top: `${progress * 100}%` }} />
          </span>
        </button>
        {headings.length ? (
          <nav aria-hidden={!railOpen} aria-label="本文目录" className="article-toc-panel">
            <span>阅读航标</span>
            <ol>
              {visibleHeadings.map((heading) => (
                <li data-level={heading.level} key={heading.id}>
                  <Link aria-current={activeId === heading.id ? "location" : undefined} href={`#${heading.id}`} tabIndex={railOpen ? 0 : -1}>{heading.text}</Link>
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
    </>
  );
}

export function ArticleShareButton({ title }: { title: string }) {
  const [shareLabel, setShareLabel] = useState("分享");

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

  return <button className="article-share-button" onClick={shareArticle} type="button"><svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14"><path d="M8 10.5V2m0 0L4.75 5.25M8 2l3.25 3.25M3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" /></svg>{shareLabel}</button>;
}
