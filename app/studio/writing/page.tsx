import Link from "next/link";
import { redirect } from "next/navigation";
import { PostEditor } from "@/components/studio/post-editor";
import { getPost, getPosts } from "@/lib/content";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";

export const metadata = { title: "Notes 工作台 | WhiskeyBlog" };
export default async function WritingPage({ searchParams }: { searchParams: Promise<{ post?: string; mode?: string }> }) {
  try { await requireOwner(); } catch (error) { if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login?error=session-missing"); throw error; }
  const query = await searchParams;
  const posts = getPosts();
  const isNew = query.mode === "new" || posts.length === 0;
  const selectedSlug = query.post ?? posts[0]?.slug;
  const post = isNew || !selectedSlug ? null : getPost(selectedSlug);
  if (!isNew && selectedSlug && !post) redirect("/studio/writing?mode=new");
  return (
    <section className="studio-writing notes-workbench">
      <div className="site-container notes-workbench-shell">
        <header className="writing-heading notes-workbench-heading">
          <div>
            <p className="studio-kicker">PRIVATE / NOTES STUDIO</p>
            <h1>Notes 工作台</h1>
            <p>{post ? `正在编辑「${post.title}」` : "建立一篇新的 Notes"}，内容与公开展示在同一个画布里完成。</p>
          </div>
          <Link className="studio-sign-out" href="/studio">返回 Media Studio</Link>
        </header>
        <PostEditor key={post?.slug ?? "new"} post={post} posts={posts} />
      </div>
    </section>
  );
}
