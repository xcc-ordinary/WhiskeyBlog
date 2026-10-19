"use client";

import { useEffect, useState, type ReactNode } from "react";
import { renderStudioMarkdown } from "@/app/studio/markdown-preview-actions";
import "./markdown-preview.css";

export function MarkdownPreview({ source }: { source: string }) {
  const [result, setResult] = useState<{ source: string; content: ReactNode } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      setError("");
      void renderStudioMarkdown(source).then(content => {
        if (current) setResult({ source, content });
      }).catch(() => {
        if (current) setError("预览暂时未能生成，请检查 Markdown / MDX 语法或登录状态；正文仍保留在编辑器中。");
      });
    }, 450);
    return () => { current = false; window.clearTimeout(timer); };
  }, [source]);

  return <div className="blog-article-reading-layout studio-markdown-preview" aria-busy={!error && result?.source !== source}>
    {error ? <p role="status">{error}</p> : result?.source !== source ? <p className="studio-preview-status" role="status">正在更新预览…</p> : null}
    {result?.content}
  </div>;
}
