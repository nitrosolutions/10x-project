import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

// API paths that require authentication but should not redirect
// These endpoints will handle authorization checks themselves
const API_PATHS_PATTERN = /^\/api\//;

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase SSR client with proper cookie management
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Store Supabase client in locals for use in API routes and pages
  context.locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user data in locals
  if (user) {
    context.locals.user = {
      email: user.email!,
      id: user.id,
    };
  } else {
    context.locals.user = null;
  }

  // Route protection logic
  const isPublicPath = PUBLIC_PATHS.includes(context.url.pathname);
  const isApiPath = API_PATHS_PATTERN.test(context.url.pathname);
  const isAuthenticated = !!user;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && ["/login", "/register", "/reset-password"].includes(context.url.pathname)) {
    return context.redirect("/");
  }

  // Redirect unauthenticated users to login (except for public paths and API paths)
  // API paths should handle their own authorization and return 401
  if (!isAuthenticated && !isPublicPath && !isApiPath) {
    return context.redirect("/login");
  }

  return next();
});
