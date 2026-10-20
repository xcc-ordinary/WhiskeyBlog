"use client";
import { useState } from "react";
import { normalizeTags } from "@/lib/content-tags";

export function TagField({ value, onChange, derived, suggestions, disabled }: { value: string; onChange: (value: string) => void; derived: string[]; suggestions: string[]; disabled: boolean }) {
  const [draft, setDraft] = useState("");
  const tags = normalizeTags(value.split(/[,，]/));
  const add = (text: string) => { onChange(normalizeTags([...tags, ...text.split(/[\s,，]+/)]).join(", ")); setDraft(""); };
  return <div className="studio-field journal-tag-field"><label htmlFor="document-tags">标签</label><div className="journal-tag-control">{tags.map(tag => <span className="journal-tag-token" key={tag}>#{tag}<button type="button" aria-label={`移除标签 ${tag}`} disabled={disabled} onClick={() => onChange(tags.filter(item => item !== tag).join(", "))}>×</button></span>)}<input id="document-tags" aria-label="添加标签" value={draft} disabled={disabled} placeholder="#todo，按回车添加" list="journal-tag-suggestions" onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft.trim()) add(draft); }} onKeyDown={event => { if (["Enter", ",", "，", " "].includes(event.key) && draft.trim()) { event.preventDefault(); add(draft); } if (event.key === "Backspace" && !draft) onChange(tags.slice(0, -1).join(", ")); }} /><datalist id="journal-tag-suggestions">{suggestions.filter(tag => !tags.includes(tag)).map(tag => <option value={`#${tag}`} key={tag} />)}</datalist></div><small>{derived.length ? `文末自动识别：${derived.map(tag => `#${tag}`).join(" ")}` : "可新建标签，也可直接在文末写 #todo #设计"}</small></div>;
}
