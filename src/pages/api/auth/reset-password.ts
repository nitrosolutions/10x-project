import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Validate input with Zod
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email } = validation.data;

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get the origin from the request to construct the redirect URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/update-password`;

    // Send password reset email
    // Note: This will always return success to prevent email enumeration attacks
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // IMPORTANT: Always return 200 to prevent email enumeration
    // (zgodnie ze specyfikacją - US-014)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli konto z podanym adresem email istnieje, link resetujący został wysłany",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Reset password error:", error);

    // Still return 200 to prevent information leakage
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli konto z podanym adresem email istnieje, link resetujący został wysłany",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
