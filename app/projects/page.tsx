import { ProjectCard } from "@/components/project-card";
import { getProjects } from "@/lib/content";
export default function ProjectsPage() { return <section className="site-container page-section"><p className="eyebrow">PROJECTS</p><h1>项目</h1><div className="card-grid">{getProjects().map((project) => <ProjectCard key={project.slug} project={project} />)}</div></section>; }
