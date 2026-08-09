import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

// Next.js only exposes NEXT_PUBLIC variables to browser bundles when their
// property access is statically analyzable. Keep the references literal here.
const publicEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function requiredPublicEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = publicEnvironment[name];

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
