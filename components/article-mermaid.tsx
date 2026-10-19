"use client";

import { useEffect, useId, useRef, useState } from "react";

let queue = Promise.resolve();
let initialized = false;

export function ArticleMermaid({ code }: { code: string }) {
  const id = `diagram-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const diagram = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!svg) return;
    const frame = requestAnimationFrame(() => {
      const element = diagram.current?.querySelector("svg");
      if (!element) return;
      // Measure after mounting: a detached SVG can retain stale label bounds in Chromium.
      const box = element.getBBox();
      if (box.width > 0 && box.height > 0) {
        element.setAttribute("viewBox", `${box.x - 16} ${box.y - 16} ${box.width + 32} ${box.height + 32}`);
        element.style.maxWidth = `${box.width + 32}px`;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [svg]);
  useEffect(() => {
    let current = true;
    queue = queue.then(async () => {
      const { default: mermaid } = await import("mermaid");
      if (!initialized) {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, layout: "dagre", htmlLabels: false, theme: "base", themeVariables: { primaryColor: "#faf8f0", primaryTextColor: "#173e55", primaryBorderColor: "#566d72", lineColor: "#566d72", background: "#f3efdf", fontFamily: "Inter, Microsoft YaHei, sans-serif" }, flowchart: { nodeSpacing: 40, rankSpacing: 50, padding: 16 } });
        initialized = true;
      }
      if (!current) return;
      await document.fonts.ready;
      const result = await mermaid.render(id, code);
      if (current) { setSvg(result.svg); setError(false); }
    }).catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [code, id]);
  return <figure className="article-mermaid">
    {svg && !error ? <div ref={diagram} role="img" aria-label="Mermaid 图表" dangerouslySetInnerHTML={{ __html: svg }} /> : <p role="status">{error ? "图表语法未能解析，源码保留如下。" : "正在绘制图表…"}</p>}
    <details open={!svg || error}><summary>查看图表源码</summary><pre><code>{code}</code></pre></details>
  </figure>;
}
