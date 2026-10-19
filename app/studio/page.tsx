import { redirect } from "next/navigation";
import { ContentDashboard } from "@/components/studio/content-dashboard";
import { getPosts, getProjects } from "@/lib/published-content";
import { studioContentWritesAvailable } from "@/lib/content-writes";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { signOutOfStudio } from "./actions";

export const metadata = { title: "内容管理", robots: { index: false, follow: false } };
export default async function StudioPage() {
  try { await requireOwner(); }
  catch (error) {
    if (!(error instanceof MediaStudioAuthorizationError)) throw error;
    if (error.status === 401) redirect("/studio/login?error=session-missing");
    return <section className="studio-auth"><h1>此账户未获授权。</h1><p>工作台仅向站点所有者开放。</p><form action={signOutOfStudio}><button className="studio-button">退出并返回登录</button></form></section>;
  }
  return <ContentDashboard projects={await getProjects()} posts={await getPosts()} writable={studioContentWritesAvailable()} />;
}
