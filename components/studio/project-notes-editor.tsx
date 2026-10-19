"use client";
import { DocumentEditor } from "@/components/studio/document-editor";
import type { ProjectDocument, ProjectSummary } from "@/lib/content";
export function ProjectNotesEditor({ project = null, projects = [], wikiLinks = {} }: { project?: ProjectDocument | null; projects?: ProjectSummary[]; wikiLinks?: Record<string, string> }) {
  return <DocumentEditor kind="project" document={project} documents={projects} wikiLinks={wikiLinks} />;
}
