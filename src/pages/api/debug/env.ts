/* src/pages/api/debug/env.ts */
/* Diagnostic endpoint to display Vercel environment configuration */

import type { APIContext } from "astro";

export const prerender = false;

/**
 * GET /api/debug/env
 *
 * Returns diagnostic information about environment variables and runtime configuration.
 * Useful for debugging DEV_BYPASS_AUTH and other Vercel deployment issues.
 *
 * @returns 200 OK - Diagnostic information (safely masked)
 */
export async function GET(context: APIContext): Promise<Response> {
  // Safely mask sensitive strings (show prefix only)
  const maskSecret = (value: string | undefined, showLength = 30): string => {
    if (!value) return "undefined";
    if (value.length <= showLength) return value.substring(0, 10) + "...";
    return value.substring(0, showLength) + "...";
  };

  // Check if value exists without exposing it
  const checkExists = (value: string | undefined): string => {
    return value ? "exists" : "missing";
  };

  const diagnosticInfo = {
    timestamp: new Date().toISOString(),

    // Environment variables
    env_variables: {
      SUPABASE_URL: maskSecret(import.meta.env.SUPABASE_URL, 30),
      SUPABASE_KEY: checkExists(import.meta.env.SUPABASE_KEY),
      SUPABASE_SERVICE_ROLE_KEY: checkExists(import.meta.env.SUPABASE_SERVICE_ROLE_KEY),
      GEMINI_API_KEY: checkExists(import.meta.env.GEMINI_API_KEY),
      DEV_BYPASS_AUTH: import.meta.env.DEV_BYPASS_AUTH ?? "undefined",
      DEV_USER_ID: import.meta.env.DEV_USER_ID ?? "undefined",
    },

    // Runtime environment info
    runtime: {
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      SSR: import.meta.env.SSR,
    },

    // Middleware context
    middleware_context: {
      userId: context.locals.userId ?? "null",
      // Check if using service role or anon client by attempting to detect
      supabase_client_configured: !!context.locals.supabase,
    },

    // Computed values for debugging
    computed: {
      bypass_auth_type: typeof import.meta.env.DEV_BYPASS_AUTH,
      bypass_auth_check: import.meta.env.DEV_BYPASS_AUTH === "true",
      bypass_auth_check_trimmed:
        typeof import.meta.env.DEV_BYPASS_AUTH === "string"
          ? import.meta.env.DEV_BYPASS_AUTH.trim() === "true"
          : import.meta.env.DEV_BYPASS_AUTH === true,
      has_service_role_key: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      should_bypass:
        (typeof import.meta.env.DEV_BYPASS_AUTH === "string"
          ? import.meta.env.DEV_BYPASS_AUTH.trim() === "true"
          : import.meta.env.DEV_BYPASS_AUTH === true) && !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  return new Response(JSON.stringify(diagnosticInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
