import { EditorialHeader } from "@/components/exhibition/editorial-header";
import { MediaStudioAuthorizationError, requireOwner } from "@/lib/supabase/auth";

export async function SiteHeader() {
  let isOwner = false;
  try {
    await requireOwner();
    isOwner = true;
  } catch (error) {
    if (!(error instanceof MediaStudioAuthorizationError)) throw error;
  }

  return <EditorialHeader showStudio={isOwner} />;
}
