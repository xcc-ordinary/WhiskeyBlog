import { isValidElement, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { compileMDX } from "next-mdx-remote/rsc";

import { headingId } from "@/lib/article";

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) return textFromChildren(children.props.children);
  return "";
}

function ArticleLink({ className = "", href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      {...props}
      className={["article-link", className].filter(Boolean).join(" ")}
      data-external={external || undefined}
      href={href}
      rel={external ? "noreferrer" : props.rel}
    >
      {children}
    </a>
  );
}

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode };

function ArticleHeading({ level: Level, children, id, ...props }: HeadingProps & { level: "h2" | "h3" }) {
  const resolvedId = id || headingId(textFromChildren(children));
  return (
    <Level {...props} id={resolvedId}>
      <span>{children}</span>
      {resolvedId ? <a aria-label={`链接到“${textFromChildren(children)}”`} className="article-heading-anchor" href={`#${resolvedId}`}>#</a> : null}
    </Level>
  );
}

const components = {
  a: ArticleLink,
  h2: (props: HeadingProps) => <ArticleHeading {...props} level="h2" />,
  h3: (props: HeadingProps) => <ArticleHeading {...props} level="h3" />,
};

export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components,
    options: { parseFrontmatter: false },
  });

  return <div className="prose">{content}</div>;
}
