import { redirect } from "next/navigation";

import { publishedNoteLinks } from "@/lib/note-links";
import { ProjectNotesEditor } from "@/components/studio/project-notes-editor";
import { ProductionContentNotice } from "@/components/studio/production-content-notice";
import { studioContentWritesAvailable } from "@/lib/content-writes";
import { getProject, getProjects } from "@/lib/published-content";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";

export const metadata = { title: "项目工作台", robots: { index: false, follow: false } };

export default async function ProjectWritingPage({ searchParams }: { searchParams: Promise<{ project?: string; mode?: string }> }) {
  try { await requireOwner(); } catch (error) { if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login?error=session-missing"); throw error; }
  if (!studioContentWritesAvailable()) return <ProductionContentNotice kind="项目" />;
  const query = await searchParams;
  const projects = await getProjects();
  const isNew = query.mode === "new" || projects.length === 0;
  const selectedSlug = query.project ?? projects[0]?.slug;
  const project = isNew || !selectedSlug ? null : await getProject(selectedSlug);
  if (!isNew && selectedSlug && !project) redirect("/studio/projects?mode=new");
  return <section className="studio-writing"><ProjectNotesEditor key={project?.slug ?? "new"} project={project} projects={projects} wikiLinks={await publishedNoteLinks()} /></section>;
}
