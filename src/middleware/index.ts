import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import { supabaseClient } from "../db/supabase.client.ts";
import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // DEV: Use service role client to bypass RLS when authentication is bypassed
  // Handle both string "true" and boolean true from environment
  const bypassAuth =
    typeof import.meta.env.DEV_BYPASS_AUTH === "string"
      ? import.meta.env.DEV_BYPASS_AUTH.trim() === "true"
      : import.meta.env.DEV_BYPASS_AUTH === true;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (bypassAuth && serviceRoleKey) {
    const supabaseUrl = import.meta.env.SUPABASE_URL;

    // Create service role client (bypasses RLS)
    context.locals.supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Set test user ID from environment
    context.locals.userId = import.meta.env.DEV_USER_ID;

    // eslint-disable-next-line no-console
    console.warn(`[DEV MODE] Using Supabase service role client - RLS is bypassed. User ID: ${context.locals.userId}`);
  } else {
    // Use normal anon client
    context.locals.supabase = supabaseClient;

    // Attempt to get authenticated user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Set userId (null if not authenticated)
    context.locals.userId = authError || !user ? null : user.id;
  }

  return next();
});
