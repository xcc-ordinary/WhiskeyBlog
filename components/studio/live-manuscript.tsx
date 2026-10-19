"use client";
import { memo, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { MarkdownDocument } from "@/components/markdown-document";
import { AutoTextarea } from "./auto-textarea";

export type LiveManuscriptHandle = { format: (before: string, after?: string, placeholder?: string) => void };
const ReadingBlock = memo(function ReadingBlock({ source, wikiLinks }: { source: string; wikiLinks: Record<string, string> }) { return <MarkdownDocument source={source} wikiLinks={wikiLinks} />; });
function blocks(source: string, offset = 0) {
  return unified().use(remarkParse).use(remarkGfm).parse(source).children.map(node => ({ start: offset + (node.position?.start.offset ?? 0), end: offset + (node.position?.end.offset ?? source.length), type: node.type }));
}

/** Render untouched blocks; edit only the selected block without rewriting other Markdown. */
export function LiveManuscript({ source, onChange, onSelection, wikiLinks, disabled, handleRef }: { source: string; onChange: (source: string) => void; onSelection: (start: number, end: number) => void; wikiLinks: Record<string, string>; disabled: boolean; handleRef: Ref<LiveManuscriptHandle> }) {
  const [active, setActive] = useState<{ start: number; end: number } | null>(source ? null : { start: 0, end: 0 });
  const input = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const nodes = useMemo(() => active ? [...blocks(source.slice(0, active.start)), { ...active, type: "editing" }, ...blocks(source.slice(active.end), active.end)] : blocks(source), [source, active]);
  const references = useMemo(() => blocks(source).filter(node => node.type === "definition").map(node => source.slice(node.start, node.end)).join("\n\n"), [source]);
  function update(text: string) {
    if (!active) return;
    onChange(source.slice(0, active.start) + text + source.slice(active.end));
    setActive({ start: active.start, end: active.start + text.length });
  }
  function format(before: string, after = "", placeholder = "文字") {
    if (!active) { const text = `${source ? "\n\n" : ""}${before}${placeholder}${after}`; onChange(source + text); setActive({ start: source.length, end: source.length + text.length }); return; }
    const text = source.slice(active.start, active.end), { start, end } = selection.current;
    update(text.slice(0, start) + before + (text.slice(start, end) || placeholder) + after + text.slice(end));
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(start + before.length, start + before.length + (end - start || placeholder.length)); });
  }
  useImperativeHandle(handleRef, () => ({ format }));
  return <div className="live-manuscript" aria-label="即时排版写作区" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !(event.relatedTarget instanceof Element && event.relatedTarget.closest(".journal-formatbar"))) setActive(null); }}>
    {nodes.map((node, index) => node.type === "editing" ? <AutoTextarea key="active" inputRef={input} className="live-block-input" aria-label="编辑当前段落" autoFocus disabled={disabled} value={source.slice(node.start, node.end)} placeholder="从第一句话开始…" onChange={event => update(event.target.value)} onSelect={event => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; onSelection(node.start + selection.current.start, node.start + selection.current.end); }} onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); setActive(null); }
      if ((event.ctrlKey || event.metaKey) && ["b", "i", "k"].includes(event.key.toLowerCase())) { event.preventDefault(); const key = event.key.toLowerCase(); format(key === "b" ? "**" : key === "i" ? "*" : "[", key === "b" ? "**" : key === "i" ? "*" : "](https://)"); }
      if (event.key === "Tab") { event.preventDefault(); format("  ", "", ""); }
    }} /> : <div key={`${node.start}-${index}`} className="live-block" role="button" tabIndex={disabled ? -1 : 0} aria-label={`编辑第 ${index + 1} 段`} onClick={event => { if (disabled || (event.target instanceof Element && event.target.closest("a,button,summary,input"))) return; setActive({ start: node.start, end: node.end }); }} onKeyDown={event => { if (!disabled && ["Enter", " "].includes(event.key)) { event.preventDefault(); setActive({ start: node.start, end: node.end }); } }}><ReadingBlock source={source.slice(node.start, node.end) + (node.type === "definition" ? "" : `\n\n${references}`)} wikiLinks={wikiLinks} /></div>)}
    {source && <button type="button" className="live-add-paragraph" disabled={disabled} onClick={() => { const start = source.length; const next = source + (source.endsWith("\n\n") ? "" : "\n\n"); onChange(next); setActive({ start: next.length, end: next.length }); onSelection(start, start); }}>继续写…</button>}
  </div>;
}
