"use client";

import Link from "next/link";

/** Keep navigation usable; never resurrect possibly withdrawn repository content. */
export default function PublicContentError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <section className="site-container" aria-labelledby="content-unavailable-title" style={{ paddingBlock: "clamp(64px, 12vh, 140px)", minHeight: "60vh" }}>
    <p className="section-label">THE PERSONAL JOURNAL</p>
    <h1 id="content-unavailable-title">这一页暂时未能载入。</h1>
    <p role="status">内容服务暂时不可用。请稍后重试，或继续浏览其他页面。</p>
    <p><button type="button" onClick={retry} style={{ minHeight: 44, paddingInline: 20 }}>重新载入</button></p>
    <p><Link href="/about">认识 Whiskey ↗</Link></p>
  </section>;
}
