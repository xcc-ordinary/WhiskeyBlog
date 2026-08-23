import { redirect } from "next/navigation";
import { SignInForm } from "@/components/studio/sign-in-form";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
export const metadata = { title: "Studio sign in", robots: { index: false, follow: false } };
const loginErrors: Record<string, string> = {
  "missing-code": "登录链接不完整。请回到邮箱，打开最新的一封登录邮件。",
  "exchange-failed": "登录链接已失效、已被使用，或 Supabase 未允许当前回调地址。请重新发送一封登录邮件。",
  "session-missing": "登录链接已打开，但浏览器没有保存会话。请使用同一浏览器打开邮件链接，并确认 Supabase 允许当前本地地址。",
};

export default async function StudioLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorCode } = await searchParams;
  const errorMessage = errorCode ? loginErrors[errorCode] : null;
  try { await requireOwner(); redirect("/studio"); } catch (error) { if (!(error instanceof MediaStudioAuthorizationError)) throw error; }
  return <section className="studio-auth site-container"><p className="studio-kicker">PRIVATE / WHISKEYBLOG</p><h1>进入 Media Studio。</h1><p>这是仅供站点所有者使用的摄影工作台。请输入获授权的邮箱，我们会发送一次性登录链接。</p>{errorMessage ? <p aria-live="polite" className="studio-form-message" role="alert">{errorMessage}</p> : null}<SignInForm /></section>;
}
