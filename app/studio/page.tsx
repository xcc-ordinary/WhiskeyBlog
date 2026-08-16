import { redirect } from "next/navigation";

import { PhotographLibrary } from "@/components/studio/photograph-library";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { getOwnerPhotographs } from "@/lib/supabase/photographs";
import type { Photograph } from "@/lib/supabase/types";

import { signOutOfStudio } from "./actions";

export const metadata = { title: "Media Studio | WhiskeyBlog" };

async function loadStudio(): Promise<{ photographs: Photograph[] } | { error: MediaStudioAuthorizationError }> {
  try {
    await requireOwner();
    return { photographs: await getOwnerPhotographs() };
  } catch (error) {
    if (error instanceof MediaStudioAuthorizationError) return { error };
    throw error;
  }
}

export default async function StudioPage() {
  const studio = await loadStudio();

  if ("error" in studio) {
    if (studio.error.status === 401) redirect("/studio/login?error=session-missing");
    return <section className="studio-auth site-container"><p className="studio-kicker">PRIVATE / WHISKEYBLOG</p><h1>此账户未获授权。</h1><p>Media Studio 仅向已配置的站点所有者开放。</p><form action={signOutOfStudio}><button className="studio-button" type="submit">退出并返回登录</button></form></section>;
  }

  return <section className="studio-page site-container"><header className="studio-heading"><div><p className="studio-kicker">PRIVATE ARCHIVE / 2026</p><h1>Media Studio</h1><p>把私人的观察，慢慢整理成能够被看见的作品。</p></div><form action={signOutOfStudio}><button className="studio-sign-out" type="submit">退出登录</button></form></header><PhotographLibrary photographs={studio.photographs} /></section>;
}
