import { notFound, redirect } from "next/navigation";

import { PhotographEditor } from "@/components/studio/photograph-editor";
import { MediaStudioAuthorizationError } from "@/lib/supabase/auth";
import { getStudioPhotograph } from "@/lib/supabase/photographs";

export const metadata = { title: "Edit photograph", robots: { index: false, follow: false } };

export default async function StudioPhotographPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let photograph;
  try {
    photograph = await getStudioPhotograph(id);
  } catch (error) {
    if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login");
    throw error;
  }

  if (!photograph) notFound();

  return (
    <section className="studio-page">
      <div className="site-container studio-page-content">
        <PhotographEditor photograph={photograph} />
      </div>
    </section>
  );
}
