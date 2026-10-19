"use client";

import { useState } from "react";

// The three Chinese examples are from Lumi's local mockReply fixture, not a provider response.
const examples = [
  { zh: "自然真诚", en: "Natural", reply: "那你先好好休息，等你有精神了我们再聊。", translation: "Get some rest. We can talk when you feel up to it." },
  { zh: "稳重关心", en: "Caring", reply: "辛苦了，好好休息。如果想聊我在，不想说也没关系。", translation: "Rest well. I’m here if you want to talk, and it’s okay if you don’t." },
  { zh: "尊重边界", en: "Respectful", reply: "好，我尊重你现在想安静一下，你不用急着回。", translation: "Of course. Take the quiet time you need. There’s no rush to reply." },
] as const;

export function LumiReplyPreview({ zh, groupLabel, tone, onToneChange }: { zh: boolean; groupLabel?: string; tone?: number; onToneChange?: (tone: number) => void }) {
  const [localTone, setLocalTone] = useState(0);
  const selected = tone ?? localTone;
  function choose(next: number) { setLocalTone(next); onToneChange?.(next); }
  return <div className="home-reply-preview">
    <div className="home-reply-source"><span>{zh ? "收到一条消息" : "A message arrives"}</span><p>{zh ? "“今天有点累，想自己待一会儿。”" : "“I’m tired today. I’d like some time on my own.”"}</p></div>
    <div className="home-reply-result"><span>{zh ? "让回应更有分寸" : "Make room for a thoughtful reply"}</span><p aria-live="polite">{zh ? examples[selected].reply : examples[selected].translation}</p></div>
    <div className="home-reply-choices" role="group" aria-label={groupLabel ?? (zh ? "选择回复语气" : "Choose a reply tone")}>{examples.map((item, index) => <button key={item.en} type="button" aria-pressed={selected === index} onClick={() => choose(index)}>{zh ? item.zh : item.en}</button>)}</div>
    <small>{zh ? "交互样例 · 预设回复" : "Interactive example · Preset replies"}</small>
  </div>;
}
