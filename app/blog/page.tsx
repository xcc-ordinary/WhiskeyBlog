import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/content";
export default function BlogPage() { return <section className="site-container page-section"><p className="eyebrow">WRITING</p><h1>博客</h1><div className="card-grid">{getPosts().map((post) => <PostCard key={post.slug} post={post} />)}</div></section>; }
