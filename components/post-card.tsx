import Link from "next/link";
import type { PostSummary } from "@/lib/content";
export function PostCard({ post }: { post: PostSummary }) { return <article className="content-card"><p>{post.date}</p><h2><Link href={post.href}>{post.title}</Link></h2><p>{post.description}</p><ul className="tag-list">{post.tags.map((tag) => <li className="tag" key={tag}>{tag}</li>)}</ul></article>; }
