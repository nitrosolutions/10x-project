import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { passwordSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

// Schema for update password (tylko password, bez confirmPassword - to sprawdza frontend)
const updatePasswordApiSchema = z.object({
  password: passwordSchema,
});

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
    const validation = updatePasswordApiSchema.safeParse(body);

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

    const { password } = validation.data;

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Get current user session (should be set by recovery token from email)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Nie jesteś zalogowany lub token wygasł. Spróbuj ponownie zresetować hasło.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("Update password error:", updateError);

      const errorMessage = updateError.message || "";

      // Provide user-friendly error messages for common cases
      let userFriendlyMessage = errorMessage;
      if (errorMessage.toLowerCase().includes("same") || errorMessage.toLowerCase().includes("identical")) {
        userFriendlyMessage = "Nowe hasło musi być inne niż poprzednie hasło";
      }

      return new Response(
        JSON.stringify({
          error: userFriendlyMessage || "Nie udało się zaktualizować hasła",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Successfully updated password
    return new Response(
      JSON.stringify({
        success: true,
        message: "Hasło zostało pomyślnie zaktualizowane",
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
    console.error("Update password error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
