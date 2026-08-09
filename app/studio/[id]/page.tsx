import { notFound, redirect } from "next/navigation";

import { PhotographEditor } from "@/components/studio/photograph-editor";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";
import { getOwnerPhotographs } from "@/lib/supabase/photographs";

export const metadata = { title: "Edit photograph | WhiskeyBlog" };

export default async function StudioPhotographPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
  } catch (error) {
    if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login");
    throw error;
  }

  const { id } = await params;
  const photograph = (await getOwnerPhotographs()).find((entry) => entry.id === id);
  if (!photograph) notFound();

  return <section className="studio-page site-container"><PhotographEditor photograph={photograph} /></section>;
}
