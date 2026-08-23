import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectNotesEditor } from "@/components/studio/project-notes-editor";
import { ProductionContentNotice } from "@/components/studio/production-content-notice";
import { repositoryContentWritesAvailable } from "@/lib/content-writes";
import { getProject, getProjects } from "@/lib/content";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";

export const metadata = { title: "项目工作台", robots: { index: false, follow: false } };

export default async function ProjectWritingPage({ searchParams }: { searchParams: Promise<{ project?: string; mode?: string }> }) {
  try { await requireOwner(); } catch (error) { if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login?error=session-missing"); throw error; }
  if (!repositoryContentWritesAvailable()) return <ProductionContentNotice kind="项目" />;
  const query = await searchParams;
  const projects = getProjects();
  const isNew = query.mode === "new" || projects.length === 0;
  const selectedSlug = query.project ?? projects[0]?.slug;
  const project = isNew || !selectedSlug ? null : getProject(selectedSlug);
  if (!isNew && selectedSlug && !project) redirect("/studio/projects?mode=new");
  return <section className="studio-writing"><div className="site-container"><header className="writing-heading"><div><p className="studio-kicker">PRIVATE / PROJECT DESK</p><h1>{project ? "编辑项目。" : "建立一个新项目。"}</h1><p>维护项目名称、封面、标签与 Markdown 项目笔记，保存后同步更新公开项目页。</p></div><Link className="studio-sign-out" href="/studio">返回 Media Studio</Link></header><ProjectNotesEditor project={project} projects={projects} /></div></section>;
}
