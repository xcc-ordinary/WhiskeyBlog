import "server-only";
import { getPosts, getProjects } from "@/lib/published-content";

/** Resolve Obsidian note links only to content actually published on this site. */
export async function publishedNoteLinks(): Promise<Record<string, string>> {
  const links: Record<string, string> = {};
  const ambiguous = new Set<string>();
  for (const note of [...await getPosts(), ...await getProjects()]) {
    for (const key of [note.slug, note.title]) {
      if (links[key] && links[key] !== note.href) ambiguous.add(key);
      else links[key] = note.href;
    }
  }
  for (const key of ambiguous) delete links[key];
  return links;
}
