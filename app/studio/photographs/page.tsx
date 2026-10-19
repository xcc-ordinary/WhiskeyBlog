import { redirect } from "next/navigation";
import { PhotographLibrary } from "@/components/studio/photograph-library";
import { getStudioPhotographs } from "@/lib/supabase/photographs";
import { MediaStudioAuthorizationError } from "@/lib/supabase/auth";

export const metadata = { title: "照片资料库", robots: { index: false, follow: false } };
export default async function PhotographsPage() {
  let photographs;
  try { photographs = await getStudioPhotographs(); }
  catch (error) { if (error instanceof MediaStudioAuthorizationError) redirect("/studio/login?error=session-missing"); throw error; }
  return <PhotographLibrary photographs={photographs} />;
}
