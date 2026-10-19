/* eslint-disable @next/next/no-img-element -- Component QA deliberately substitutes next/image. */
import React from "react";
export const usePathname = () => window.location.search.includes("kind=project") ? "/studio/projects" : "/studio/writing";
export const useRouter = () => ({ push: href => { window.location.href = href; }, replace: () => {}, refresh: () => {} });
export function Link({ href, children, prefetch, ...props }) { void prefetch; return <a href={href} {...props}>{children}</a>; }
export function Image({ fill, unoptimized, priority, sizes, style, alt = "", ...props }) { void unoptimized; void priority; return <img {...props} alt={alt} sizes={sizes} style={{ ...(fill ? { position: "absolute", width: "100%", height: "100%", inset: 0 } : {}), ...style }} />; }
window.__studioSubmissions = [];
async function save(form) {
 if (window.__failSave) throw new Error("网络暂时中断，请重试。");
 window.__studioSubmissions.push(Object.fromEntries(form));
 return { ok: true, message: "ok" };
}
export const saveStudioPost = save, saveStudioProjectNotes = save;
export const uploadStudioPostCover = async () => ({ ok: true, path: "/images/whiskey-journal-card.png" });
export const uploadStudioProjectImage = uploadStudioPostCover;
export const signOutOfStudio = async () => {};
export async function importStudioMarkdown(form) { const file = form.get("document"); const source = await file.text(); return { metadata: { title: source.match(/^# (.+)$/m)?.[1] ?? "导入文章" }, source }; }
