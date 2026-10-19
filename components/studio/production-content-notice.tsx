import Link from "next/link";

export function ProductionContentNotice({ kind }: { kind: "Notes" | "项目" }) {
  return (
    <section className="studio-auth site-container" aria-labelledby="content-readonly-title">
      <p className="studio-kicker">PRODUCTION / READ ONLY</p>
      <h1 id="content-readonly-title">线上{kind}存储尚未启用。</h1>
      <p>请先完成 Supabase 内容存储配置，启用后即可在这里编辑和发布。目前也可在本地编辑后通过 GitHub 发布。</p>
      <Link className="studio-button" href="/studio">返回 Media Studio</Link>
    </section>
  );
}
