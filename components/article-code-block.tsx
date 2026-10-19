"use client";

import { useState } from "react";

const languageNames: Record<string, string> = {
  bash: "Bash",
  powershell: "PowerShell",
  sh: "Shell",
  text: "Text",
};

export function ArticleCodeBlock({ code, language = "text", highlightedHtml }: { code: string; language?: string; highlightedHtml?: string }) {
  const [label, setLabel] = useState("复制");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setLabel("已复制");
    } catch {
      setLabel("复制失败");
    }
    window.setTimeout(() => setLabel("复制"), 1600);
  }

  return (
    <figure className="article-code-block">
      <figcaption><span>{languageNames[language] ?? language}</span><button onClick={copyCode} type="button">{label}</button></figcaption>
      <pre>{highlightedHtml ? <code className={`language-${language} hljs`} dangerouslySetInnerHTML={{ __html: highlightedHtml }} /> : <code className={`language-${language}`}>{code}</code>}</pre>
    </figure>
  );
}
