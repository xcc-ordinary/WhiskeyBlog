import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export class MediaStudioAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "MediaStudioAuthorizationError";
  }
}

export interface MediaStudioOwner {
  id: string;
  email: string;
}

function ownerFromUser(user: User): MediaStudioOwner {
  if (!user.email) {
    throw new MediaStudioAuthorizationError("The signed-in account has no email address.", 403);
  }

  return { id: user.id, email: user.email };
}

/** Rejects every request except the email allowlisted in private media settings. */
export async function requireOwner(client?: SupabaseServerClient): Promise<MediaStudioOwner> {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    throw new MediaStudioAuthorizationError("Sign in is required to access Media Studio.", 401);
  }

  const owner = ownerFromUser(userResult.user);
  const { data: isOwner, error: ownerError } = await supabase.rpc("is_media_studio_owner");

  if (ownerError || !isOwner) {
    throw new MediaStudioAuthorizationError("This account is not allowed to access Media Studio.", 403);
  }

  return owner;
}

export type { SupabaseServerClient };
