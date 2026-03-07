import { createClient } from "@supabase/supabase-js";

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function formatSupabaseError(error: SupabaseErrorLike, tableName?: string) {
  const message = error.message || "Supabase request failed.";

  if (isSupabaseSetupError(error)) {
    return tableName
      ? `Supabase table "${tableName}" is missing. Run supabase-schema.sql in your Supabase SQL editor, then refresh the schema cache.`
      : "Supabase tables are missing. Run supabase-schema.sql in your Supabase SQL editor, then refresh the schema cache.";
  }

  if (isSupabasePermissionError(error)) {
    return "Supabase blocked this write. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for server routes, or configure Clerk JWT auth for Supabase.";
  }

  if (error.code === "23503") {
    return "Your rider profile is missing in Supabase. Sync the user profile before creating a ride.";
  }

  return message;
}

export function isSupabaseSetupError(error: SupabaseErrorLike) {
  const message = error.message || "";

  return (
    error.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

export function isSupabasePermissionError(error: SupabaseErrorLike) {
  const message = error.message || "";

  return (
    error.code === "42501" ||
    message.toLowerCase().includes("row-level security")
  );
}
