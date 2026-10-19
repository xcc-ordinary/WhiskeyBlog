import { redirect } from "next/navigation";
import { publishedNoteLinks } from "@/lib/note-links";
import { PostEditor } from "@/components/studio/post-editor";
import { ProductionContentNotice } from "@/components/studio/production-content-notice";
import { studioContentWritesAvailable } from "@/lib/content-writes";
import { getPost, getPosts } from "@/lib/published-content";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";

export const metadata = { title: "Notes 工作台", robots: { index: false, follow: false } };
export default async function WritingPage({ searchParams }: { searchParams: Promise<{ post?: string; mode?: string }> }) {
  try { await requireOwner(); } catch (error) { if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login?error=session-missing"); throw error; }
  if (!studioContentWritesAvailable()) return <ProductionContentNotice kind="Notes" />;
  const query = await searchParams;
  const posts = await getPosts();
  const isNew = query.mode === "new" || posts.length === 0;
  const selectedSlug = query.post ?? posts[0]?.slug;
  const post = isNew || !selectedSlug ? null : await getPost(selectedSlug);
  if (!isNew && selectedSlug && !post) redirect("/studio/writing?mode=new");
  return <section className="studio-writing"><PostEditor key={post?.slug ?? "new"} post={post} posts={posts} wikiLinks={await publishedNoteLinks()} /></section>;
}
