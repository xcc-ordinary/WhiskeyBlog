import { site } from "@/lib/site";
export default function AboutPage() { return <section className="site-container page-section prose"><p className="eyebrow">ABOUT</p><h1>关于我</h1><p>我是一名正在成长的开发者，正在通过真实项目学习设计、开发、测试与发布。</p><p>欢迎通过 <a href={"mailto:" + site.email}>{site.email}</a> 联系我。</p></section>; }
