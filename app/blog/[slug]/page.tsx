import { notFound } from "next/navigation";
import { MdxContent } from "@/components/mdx-content";
import { getPost, getPosts } from "@/lib/content";
export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) { const post = getPost((await params).slug); if (!post) notFound(); return <article className="site-container page-section"><p className="eyebrow">{post.date}</p><h1>{post.title}</h1><p className="hero-copy">{post.description}</p><MdxContent source={post.source} /></article>; }
