"use client";
import { useState, type CSSProperties } from "react";
const doors = [
  { name: "结绒", en: "Knots", feeling: "内耗", english: "Overthinking", x: "19%", y: "18%", line: "绕了很久的心事，也可以慢慢解开。", translation: "Even tangled thoughts can slowly come undone." },
  { name: "听雨", en: "Rain", feeling: "悲伤", english: "Sadness", x: "63%", y: "30%", line: "不必急着天晴，先陪自己听一会儿雨。", translation: "There is no rush for sunshine. Stay with the rain a little." },
  { name: "息摆", en: "Stillness", feeling: "焦虑", english: "Anxiety", x: "19%", y: "47%", line: "让摇摆的思绪，在这一页停一停。", translation: "Let restless thoughts find a page to settle on." },
  { name: "藏烬", en: "Embers", feeling: "愤怒", english: "Anger", x: "63%", y: "60%", line: "把心里的火，交给一盏小小的灯。", translation: "Give the fire inside somewhere gentle to glow." },
  { name: "铃芽", en: "Sprout", feeling: "喜悦", english: "Joy", x: "24%", y: "75%", line: "那些微小的开心，值得被好好收藏。", translation: "Small joys deserve a place to be kept." },
] as const;
export function DreambookPreview({ zh }: { zh: boolean }) {
  const [selected, setSelected] = useState(1);
  const door = doors[selected];
  return <div className="dreambook-preview dreambook-single">
    <div className="dreambook-single-art" style={{ "--door-x": door.x, "--door-y": door.y } as CSSProperties} role="img" aria-label={zh ? `原始角色概念：${door.name}` : `Original character concept: ${door.en}`} />
    <div className="dreambook-dialog"><p className="dreambook-overline">{zh ? `角色概念 / ${door.feeling}之门` : `CHARACTER CONCEPT / ${door.english.toUpperCase()}`}</p><h4 className="dreambook-door-name">{zh ? door.name : door.en}</h4><p className="dreambook-line" aria-live="polite">{zh ? door.line : door.translation}</p><div className="dreambook-choices" role="group" aria-label={zh ? "选择情绪之门" : "Choose an emotional door"}>{doors.map((item, index) => <button key={item.en} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>{zh ? item.feeling : item.english}</button>)}</div><div className="dreambook-single-legend"><small>{zh ? "五种情绪角色，点击查看" : "Five characters. Choose a feeling."}</small></div></div>
  </div>;
}
