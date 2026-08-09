"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSubmitting(true); setMessage(null);
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/studio` } });
    setIsSubmitting(false); setMessage(error ? "暂时无法发送登录链接，请稍后重试。" : "登录链接已发送，请在邮箱中打开它。");
  }
  return <form className="studio-sign-in-form" onSubmit={requestMagicLink}>
    <label htmlFor="studio-email">邮箱</label>
    <input autoComplete="email" id="studio-email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
    <button className="studio-button" disabled={isSubmitting} type="submit">{isSubmitting ? "正在发送…" : "发送魔法登录链接"}</button>
    {message ? <p aria-live="polite" className="studio-form-message">{message}</p> : null}
  </form>;
}
