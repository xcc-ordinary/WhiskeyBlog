import Link from "next/link";
export default function Home() {
  return <section className="hero site-container"><p className="eyebrow">BUILD · LEARN · SHARE</p><h1>把每一次实践，<br />变成下一次成长。</h1><p className="hero-copy">这里记录一名开发者从零开始的项目、思考与持续学习。</p><Link className="primary-link" href="/projects">查看项目 <span aria-hidden="true">↗</span></Link></section>;
}
