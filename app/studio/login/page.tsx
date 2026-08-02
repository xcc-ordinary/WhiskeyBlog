import { redirect } from "next/navigation";
import { SignInForm } from "@/components/studio/sign-in-form";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
export const metadata = { title: "Studio sign in | WhiskeyBlog" };
export default async function StudioLoginPage() {
  try { await requireOwner(); redirect("/studio"); } catch (error) { if (!(error instanceof MediaStudioAuthorizationError)) throw error; }
  return <section className="studio-auth site-container"><p className="studio-kicker">PRIVATE / WHISKEYBLOG</p><h1>进入 Media Studio。</h1><p>这是仅供站点所有者使用的摄影工作台。请输入获授权的邮箱，我们会发送一次性登录链接。</p><SignInForm /></section>;
}
