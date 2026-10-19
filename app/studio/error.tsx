"use client";
import Link from "next/link";
export default function StudioError({ reset }: { reset: () => void }) {
  return <section className="studio-load-state" role="alert"><h2>暂时无法载入内容</h2><p>请检查网络后重试。照片服务异常不会影响项目或文章管理。</p><button className="studio-button" type="button" onClick={reset}>重新加载</button> <Link href="/studio">返回内容管理</Link></section>;
}
