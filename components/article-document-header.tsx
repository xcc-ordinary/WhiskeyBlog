import Image from "next/image";
import { ArticleShareButton } from "@/components/article-reading-tools";
import { isSupportedDocumentCover } from "@/lib/project-images";

export type ArticleHeaderData = { title: string; description: string; date: string; tags: string[]; author?: string; coverImage?: string; coverAlt?: string; readingMinutes?: number };

/** The same title, deck, byline and cover in the journal and the Studio. */
export function ArticleDocumentHeader({ document, kind = "post", preview = false }: { document: ArticleHeaderData; kind?: "post" | "project"; preview?: boolean }) {
  return <header className="blog-article-header">
    <p className="section-label">{kind === "post" ? "手记" : "项目"}{document.tags.length ? ` / ${document.tags.join(" · ")}` : ""}</p>
    <h1 id="article-title">{document.title}</h1>
    {document.description && <p className="blog-article-deck">{document.description}</p>}
    <div className="blog-article-meta"><p><strong>{document.author || "Whiskey"}</strong><span>{document.date.replaceAll("-", ".")} · {document.readingMinutes ?? 1} 分钟阅读</span></p>{!preview && <ArticleShareButton title={document.title} />}</div>
    {document.coverImage && isSupportedDocumentCover(document.coverImage) && <figure className={`blog-article-cover${kind === "project" ? " project-article-cover" : ""}`}><Image alt={document.coverAlt || document.title} width={1600} height={1067} style={{ width: "100%", height: "auto" }} priority={!preview} unoptimized={preview} sizes="(max-width: 760px) 100vw, 700px" src={document.coverImage} /></figure>}
  </header>;
}
