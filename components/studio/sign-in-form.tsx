"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSubmitting(true); setMessage(null);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      setMessage(error ? `无法发送登录链接：${error.message}` : "登录链接已发送。请在当前浏览器打开最新邮件；链接只能使用一次。若邮件跳转到 localhost，请先修正 Supabase 的站点地址与回调配置。");
    } catch {
      setMessage("暂时无法连接登录服务，请检查网络后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <form className="studio-sign-in-form" onSubmit={requestMagicLink}>
    <label htmlFor="studio-email">邮箱</label>
    <input autoComplete="email" id="studio-email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
    <button className="studio-button" disabled={isSubmitting} type="submit">{isSubmitting ? "正在发送…" : "发送魔法登录链接"}</button>
    {message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}
  </form>;
}
