import { notFound } from "next/navigation";
import { MdxContent } from "@/components/mdx-content";
import { getProject, getProjects } from "@/lib/content";
export function generateStaticParams() { return getProjects().map(({ slug }) => ({ slug })); }
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) { const project = getProject((await params).slug); if (!project) notFound(); return <article className="site-container page-section"><p className="eyebrow">{project.date}</p><h1>{project.title}</h1><p className="hero-copy">{project.description}</p><MdxContent source={project.source} /></article>; }
