import Link from "next/link";

export function ProductionContentNotice({ kind }: { kind: "Notes" | "项目" }) {
  return (
    <section className="studio-auth site-container" aria-labelledby="content-readonly-title">
      <p className="studio-kicker">PRODUCTION / READ ONLY</p>
      <h1 id="content-readonly-title">线上{kind}编辑已安全停用。</h1>
      <p>Vercel 的部署文件不可持久写入。请在本地 Studio 编辑并提交到 GitHub；摄影档案仍通过 Supabase 在线管理。</p>
      <Link className="studio-button" href="/studio">返回 Media Studio</Link>
    </section>
  );
}
