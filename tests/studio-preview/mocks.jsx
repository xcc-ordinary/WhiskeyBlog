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

export const deleteStudioPhotograph = async () => ({ ok: true, message: "已删除" });
export const quickPublishStudioPhotograph = async () => ({ ok: true, message: "已公开" });
export const unpublishStudioPhotograph = async () => ({ ok: true, message: "已撤回" });
export const savePhotographDraft = async () => ({ ok: true, message: "照片信息已保存" });
export const createOriginalUploadIntent = async () => ({ ok: true, path: "qa/test.jpg", token: "qa-fixture" });
export const createUploadedDraft = async () => ({ ok: true, photographId: "qa-photo" });
export const createSupabaseBrowserClient = () => ({ storage: { from: () => ({ uploadToSignedUrl: async () => ({ error: null }) }) } });

window.__qaRemoved = new Set();
export const changeStudioContentState = async (collection, slug, deleted) => { if (window.__failSave) return { ok: false, message: "网络暂时中断，请重试。" }; if (deleted) window.__qaRemoved.add(`${collection}:${slug}`); else window.__qaRemoved.delete(`${collection}:${slug}`); return { ok: true, message: deleted ? "已移至回收站，可随时恢复。" : "内容已恢复到网站。" }; };
export const getStudioTrash = async () => (window.__qaDocuments ?? []).filter(item => window.__qaRemoved.has(`${item.kind === "post" ? "posts" : "projects"}:${item.slug}`));
