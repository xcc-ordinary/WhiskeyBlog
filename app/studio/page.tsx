import Link from "next/link";
import { redirect } from "next/navigation";

import { PhotographLibrary } from "@/components/studio/photograph-library";
import { getPosts, getProjects } from "@/lib/content";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { getStudioPhotographs, type StudioPhotograph } from "@/lib/supabase/photographs";

import { signOutOfStudio } from "./actions";

export const metadata = { title: "Media Studio", robots: { index: false, follow: false } };

async function loadStudio(): Promise<{ photographs: StudioPhotograph[] } | { error: MediaStudioAuthorizationError }> {
  try {
    await requireOwner();
    return { photographs: await getStudioPhotographs() };
  } catch (error) {
    if (error instanceof MediaStudioAuthorizationError) return { error };
    throw error;
  }
}

export default async function StudioPage() {
  const studio = await loadStudio();

  if ("error" in studio) {
    if (studio.error.status === 401) redirect("/studio/login?error=session-missing");
    return <section className="studio-auth site-container"><p className="studio-kicker">PRIVATE / WHISKEYBLOG</p><h1>此账户未获授权。</h1><p>Media Studio 仅向已配置的站点所有者开放。</p><form action={signOutOfStudio}><button className="studio-button" type="submit">退出并返回登录</button></form></section>;
  }

  const projects = getProjects();
  const posts = getPosts();
  const publishedPhotographs = studio.photographs.filter((photograph) => photograph.status === "published").length;

  return <section className="studio-page"><div className="site-container studio-page-content"><header className="studio-heading"><div><p className="studio-kicker">PRIVATE WORKBENCH / 2026</p><h1>Media Studio</h1><p>在一个工作台里管理项目、照片展示与 Notes。</p></div><div className="studio-heading-actions"><Link className="studio-sign-out" href="/studio/projects">项目管理</Link><a className="studio-sign-out" href="#photographs">照片展示</a><Link className="studio-sign-out" href="/studio/writing">Notes 管理</Link><form action={signOutOfStudio}><button className="studio-sign-out" type="submit">离开工作台</button></form></div></header><section aria-labelledby="studio-content-title" className="studio-content-dashboard"><header><div><p className="studio-kicker">CONTENT CONTROL</p><h2 id="studio-content-title">管理公开内容</h2></div><p>选择一种内容继续编辑；保存后，对应的公开页面会自动刷新。</p></header><div className="studio-content-grid"><Link className="studio-content-card" href="/studio/projects"><span>01 / PROJECTS</span><strong>项目</strong><p>修改标题、封面、标签与项目笔记，也可以建立新项目。</p><small>{projects.length} 个项目 →</small></Link><a className="studio-content-card" href="#photographs"><span>02 / PHOTOGRAPHS</span><strong>照片展示</strong><p>上传照片，编辑说明、裁切与顺序，并控制公开或撤回。</p><small>{publishedPhotographs} 已公开 / {studio.photographs.length} 全部 →</small></a><Link className="studio-content-card" href="/studio/writing"><span>03 / NOTES</span><strong>Notes</strong><p>新建 Notes，或选择已有内容继续编辑和预览。</p><small>{posts.length} 篇 Notes →</small></Link></div></section><PhotographLibrary photographs={studio.photographs} /></div></section>;
}
