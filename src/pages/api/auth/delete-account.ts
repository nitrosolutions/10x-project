import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { deleteAccountSchema } from "@/lib/schemas/auth.schema";

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
    const validation = deleteAccountSchema.safeParse(body);

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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Nie jesteś zalogowany",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify password by attempting to sign in with current email and provided password
    // This ensures the user is confirming their identity
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || "",
      password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          error: "Hasło jest niepoprawne",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get service role key from environment variables (server-side only)
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      return new Response(
        JSON.stringify({
          error: "Konfiguracja serwera - brak uprawnień do usunięcia konta",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create admin Supabase client with service role key
    const supabaseAdmin = createClient(import.meta.env.SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, delete all user's receipts and related data
    // This bypasses RLS policies by using admin client
    const { error: deleteReceiptsError } = await supabaseAdmin.from("receipts").delete().eq("user_id", user.id);

    if (deleteReceiptsError) {
      console.error("Delete receipts error:", deleteReceiptsError);
      return new Response(
        JSON.stringify({
          error: deleteReceiptsError.message || "Nie udało się usunąć danych użytkownika",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Now delete the user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Delete user error:", deleteError);
      return new Response(
        JSON.stringify({
          error: deleteError.message || "Nie udało się usunąć konta",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Successfully deleted account
    return new Response(
      JSON.stringify({
        success: true,
        message: "Konto zostało usunięte",
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
    console.error("Delete account error:", error);

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
