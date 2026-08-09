import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeCallbackPath(next: string | null, origin: string) {
  if (!next) return "/studio";

  try {
    const decoded = decodeURIComponent(next);
    if (/[\\\u0000-\u001F\u007F]/.test(decoded)) return "/studio";
    const target = new URL(decoded, origin);
    if (target.origin !== origin || !target.pathname.startsWith("/")) return "/studio";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/studio";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = safeCallbackPath(url.searchParams.get("next"), url.origin);
  if (code) { const supabase = await createSupabaseServerClient(); await supabase.auth.exchangeCodeForSession(code); }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
