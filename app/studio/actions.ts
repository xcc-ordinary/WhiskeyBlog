"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function signOutOfStudio() { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); redirect("/studio/login"); }
