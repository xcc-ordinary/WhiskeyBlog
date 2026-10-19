import { isValidElement, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { ArticleCodeBlock } from "@/components/article-code-block";
import { headingId } from "@/lib/article";
import { remarkObsidian, safeMarkdownUrl } from "@/lib/markdown";
import { publishedNoteLinks } from "@/lib/note-links";
import hljs from "highlight.js/lib/common";
import { ArticleMermaid } from "@/components/article-mermaid";

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return textFromChildren(children.props.children);
  return "";
}
function ArticleLink({ className = "", href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//i.test(href);
  return <a {...props} className={["article-link", className].filter(Boolean).join(" ")} data-external={external || undefined} href={safeMarkdownUrl(href)} rel={external ? "noreferrer" : props.rel}>{children}</a>;
}
type HeadingProps = HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode };
function ArticleHeading({ level: Level, children, id, ...props }: HeadingProps & { level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }) {
  const resolvedId = id || headingId(textFromChildren(children));
  return <Level {...props} id={resolvedId}><span>{children}</span>{resolvedId ? <a aria-label={`链接到“${textFromChildren(children)}”`} className="article-heading-anchor" href={`#${resolvedId}`}>#</a> : null}</Level>;
}
function ArticlePre({ children }: HTMLAttributes<HTMLPreElement>) {
  const codeElement = isValidElement<{ children?: ReactNode; className?: string }>(children) ? children : null;
  const language = codeElement?.props.className?.match(/language-([\w-]+)/)?.[1] ?? "text";
  const code = textFromChildren(codeElement?.props.children ?? children).replace(/\n$/, "");
  if (language === "mermaid") return <ArticleMermaid code={code} />;
  const highlightedHtml = hljs.getLanguage(language) ? hljs.highlight(code, { language, ignoreIllegals: true }).value : undefined;
  return <ArticleCodeBlock code={code} language={language} highlightedHtml={highlightedHtml} />;
}
function ArticleMedia({ alt = "", width, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const url = typeof src === "string" ? safeMarkdownUrl(src) : undefined;
  if (/\.(?:mp3|wav|ogg|m4a|flac)(?:[?#]|$)/i.test(url ?? "")) return <audio controls preload="metadata" src={url} aria-label={alt || "音频"} />;
  if (/\.(?:mp4|webm|ogv|mov)(?:[?#]|$)/i.test(url ?? "")) return <video controls preload="metadata" src={url} aria-label={alt || "视频"} />;
  // Uploaded artwork and URLs use normal responsive images; explicit Obsidian widths are respected.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} src={url} width={width} style={width && Number(width) > 0 ? { width: Number(width), maxWidth: "100%", height: "auto" } : undefined} alt={alt} loading="lazy" decoding="async" />;
}
function elementProps<T extends { node?: unknown }>({ node, ...props }: T) { void node; return props; }
const components: Components = {
  a: props => <ArticleLink {...elementProps(props)} />,
  ...Object.fromEntries((["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((level) => [level, (props: HeadingProps & { node?: unknown }) => <ArticleHeading {...elementProps(props)} level={level} />])),
  pre: props => <ArticlePre {...elementProps(props)} />,
  table: props => <div className="article-table-scroll" role="region" aria-label="可横向滚动的表格" tabIndex={0}><table {...elementProps(props)} /></div>,
  img: props => <ArticleMedia {...elementProps(props)} />,
};
const schema = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [...(defaultSchema.tagNames ?? []), "mark", "aside", "details", "summary", "sup", "sub"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
    aside: ["className", "dataCallout"],
    details: ["className", "dataCallout", "open"],
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./, "math-inline", "math-display"]],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height"],
  },
};
/** Blog, projects and Studio previews share the exact same safe Markdown renderer. */
export async function MdxContent({ source }: { source: string }) {
  return <div className="prose markdown-document"><Markdown
    components={components}
    remarkRehypeOptions={{ footnoteLabel: "脚注", footnoteBackLabel: "返回正文" }}
    remarkPlugins={[remarkGfm, remarkMath, [remarkObsidian, { wikiLinks: publishedNoteLinks() }]]}
    rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], [rehypeKatex, { strict: "ignore", trust: false }]]}
    urlTransform={(url) => safeMarkdownUrl(url) ?? ""}
  >{source}</Markdown></div>;
}
