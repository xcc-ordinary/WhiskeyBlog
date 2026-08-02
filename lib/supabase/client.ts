import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

function requiredPublicEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to connect to Supabase.`);
  }

  return value;
}

/** Creates the browser client using only Supabase's publishable credentials. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    requiredPublicEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredPublicEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
