import { compileMDX } from "next-mdx-remote/rsc";
export async function MdxContent({ source }: { source: string }) { const { content } = await compileMDX({ source, options: { parseFrontmatter: false } }); return <div className="prose">{content}</div>; }
