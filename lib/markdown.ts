import type { Root, RootContent, PhrasingContent, Text } from "mdast";
import { headingId } from "@/lib/heading-id";

export type MarkdownOptions = {
  /** Only published notes/assets belong here; local vault paths are never exposed. */
  wikiLinks?: Record<string, string>;
};

export function safeMarkdownUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url || /[\u0000-\u001f\u007f]/.test(url) || /^(?:[a-z]:|\\|\/\/)/i.test(url)) return undefined;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^(?:https?:|mailto:|tel:)/i.test(url)) return undefined;
  return url;
}

function text(value: string): Text { return { type: "text", value }; }

function inlineExtensions(value: string, options: MarkdownOptions): PhrasingContent[] {
  const result: PhrasingContent[] = [];
  const tokens = /(!?\[\[([^\]\n]+)\]\]|==([^=\n]+)==|%%[\s\S]*?%%)/g;
  let end = 0;
  for (const match of value.matchAll(tokens)) {
    if (match.index! > end) result.push(text(value.slice(end, match.index)));
    if (match[3]) {
      result.push({ type: "emphasis", children: [text(match[3])], data: { hName: "mark" } });
    } else if (match[2]) {
      const embedded = match[1].startsWith("!");
      const [target, alias] = match[2].split("|");
      const [note, section] = target.split("#");
      const mapped = options.wikiLinks?.[note] ?? options.wikiLinks?.[note.replace(/\.md$/i, "")];
      const direct = /^(?:https?:\/\/|\/)/i.test(note) ? safeMarkdownUrl(note) : undefined;
      const base = mapped ? safeMarkdownUrl(mapped) : direct;
      const url = note === "" && section ? `#${headingId(section)}` : base ? `${base}${section ? `#${headingId(section)}` : ""}` : undefined;
      if (embedded && url && /\.(?:png|jpe?g|webp|gif|svg|avif|mp3|wav|ogg|m4a|flac|mp4|webm|ogv|mov)(?:[?#]|$)/i.test(url)) {
        const dimensions = alias?.match(/^(\d+)(?:x(\d+))?$/);
        result.push({ type: "image", url, alt: dimensions ? note.split("/").pop() ?? "" : alias ?? note, data: dimensions ? { hProperties: { width: Number(dimensions[1]), ...(dimensions[2] ? { height: Number(dimensions[2]) } : {}) } } : undefined });
      } else if (url) {
        result.push({ type: "link", url, children: [text(alias ?? section ?? note)] });
      } else {
        result.push({ type: "emphasis", children: [text(alias ?? target)], data: { hName: "span", hProperties: { className: ["article-unresolved-link"], title: embedded ? "嵌入内容尚未发布到网站" : "此笔记尚未发布到网站" } } });
      }
    }
    end = match.index! + match[0].length;
  }
  if (end < value.length) result.push(text(value.slice(end)));
  return end ? result : [text(value)];
}

type Branch = { type: string; children?: RootContent[]; value?: string; depth?: number; data?: { hName?: string; hProperties?: Record<string, unknown> } };

export function markdownText(node: Branch): string {
  return node.value ?? node.children?.map(markdownText).join("") ?? "";
}

/** Transform syntax nodes, never code or HTML strings. */
export function remarkObsidian(options: MarkdownOptions = {}) {
  return (tree: Root) => {
    let insideComment = false;
    function stripComments(node: Branch): boolean {
      if (node.type === "text") {
        const value = node.value ?? "";
        let visible = "", end = 0;
        for (const match of value.matchAll(/%%/g)) {
          if (!insideComment) visible += value.slice(end, match.index);
          insideComment = !insideComment;
          end = match.index! + 2;
        }
        if (!insideComment) visible += value.slice(end);
        node.value = visible;
        return Boolean(visible);
      }
      if (node.children) {
        node.children = node.children.filter(child => stripComments(child as Branch));
        return node.children.length > 0 || node.type === "root";
      }
      // Code, math and HTML remain literal unless the whole block is commented out.
      return !insideComment;
    }
    stripComments(tree as Branch);
    const ids = new Map<string, number>();
    function visit(node: Branch) {
      if (!node.children) return;
      const expanded: RootContent[] = [];
      for (const child of node.children) {
        if (child.type === "text") expanded.push(...inlineExtensions(child.value, options));
        else expanded.push(child);
      }
      node.children = expanded;
      if (node.type === "blockquote") {
        const paragraph = node.children[0];
        const first = paragraph && "children" in paragraph ? paragraph.children[0] : undefined;
        if (paragraph?.type === "paragraph" && first?.type === "text") {
          const callout = first.value.match(/^\[!([\w-]+)(?:\|[^\]]*)?\]([+-])?(?:[ \t]+([^\n]*))?(?:\n|$)/);
          if (callout) {
            const type = callout[1].toLowerCase();
            const title = callout[3]?.trim() || type.toUpperCase();
            first.value = first.value.slice(callout[0].length);
            const folding = Boolean(callout[2]);
            node.data = { hName: folding ? "details" : "aside", hProperties: { className: ["article-callout"], "data-callout": type, ...(callout[2] === "+" ? { open: true } : {}) } };
            node.children.unshift({ type: "paragraph", children: [text(title)], data: { hName: folding ? "summary" : "p", hProperties: { className: ["article-callout-title"] } } });
            if (paragraph.children.every((item) => item.type === "text" && !item.value)) node.children.splice(1, 1);
          }
        }
      }
      for (const child of node.children) visit(child as Branch);
      if (node.type === "paragraph") {
        const last = node.children.at(-1);
        if (last?.type === "text") {
          const block = last.value.match(/(?:^|\s)\^([\w-]+)\s*$/);
          if (block) {
            last.value = last.value.slice(0, block.index).trimEnd();
            node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: block[1] } };
          }
        }
      }
      if (node.type === "heading") {
        const base = headingId(markdownText(node));
        const count = ids.get(base) ?? 0;
        ids.set(base, count + 1);
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: count ? `${base}-${count}` : base } };
      }
    }
    visit(tree as Branch);
  };
}
