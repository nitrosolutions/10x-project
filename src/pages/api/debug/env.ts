/* src/pages/api/debug/env.ts */
/* Diagnostic endpoint to display environment configuration */

import type { APIContext } from "astro";

export const prerender = false;

/**
 * GET /api/debug/env
 *
 * Returns diagnostic information about environment variables and runtime configuration.
 * Useful for debugging Supabase setup and deployment issues.
 *
 * @returns 200 OK - Diagnostic information (safely masked)
 */
export async function GET(context: APIContext): Promise<Response> {
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),

    // Environment variables
    env_variables: {
      SUPABASE_URL: import.meta.env.SUPABASE_URL ?? "undefined",
      SUPABASE_KEY: import.meta.env.SUPABASE_KEY ?? "undefined",
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? "undefined",
      GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY ?? "undefined",
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
      user: context.locals.user ?? null,
      // Check if Supabase client is configured
      supabase_client_configured: !!context.locals.supabase,
    },
  };

  return new Response(JSON.stringify(diagnosticInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
