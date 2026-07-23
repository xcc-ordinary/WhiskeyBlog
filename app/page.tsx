import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { getPosts, getProjects } from "@/lib/content";
export default function Home() {
  const projects = getProjects(); const posts = getPosts();
  return <><section className="hero site-container"><p className="eyebrow">BUILD · LEARN · SHARE</p><h1>把每一次实践，<br />变成下一次成长。</h1><p className="hero-copy">这里记录一名开发者从零开始的项目、思考与持续学习。</p><Link className="primary-link" href="/projects">查看项目 <span aria-hidden="true">↗</span></Link></section><section className="site-container page-section"><p className="eyebrow">SELECTED WORK</p><h2>项目</h2><div className="card-grid">{projects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></section><section className="site-container page-section"><p className="eyebrow">LATEST NOTE</p><h2>最新文章</h2><div className="card-grid">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div></section></>;
}
