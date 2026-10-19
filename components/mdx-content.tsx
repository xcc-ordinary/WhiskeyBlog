import { MarkdownDocument } from "@/components/markdown-document";
import { publishedNoteLinks } from "@/lib/note-links";

/** The public page and Studio use the same Markdown renderer and reading CSS. */
export async function MdxContent({ source }: { source: string }) {
  return <MarkdownDocument source={source} wikiLinks={await publishedNoteLinks()} />;
}
