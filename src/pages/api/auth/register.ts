import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { registerSchema } from "@/lib/schemas/auth.schema";

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
    const validation = registerSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Create Supabase server instance with proper cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up with email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      const errorMessage = error.message || "";

      // Check for duplicate email errors (different Supabase versions/modes may return different messages)
      if (
        errorMessage.toLowerCase().includes("already registered") ||
        errorMessage.toLowerCase().includes("duplicate") ||
        errorMessage.toLowerCase().includes("već postoji") ||
        errorMessage.toLowerCase().includes("user already exists")
      ) {
        return new Response(
          JSON.stringify({
            error: "Ten email jest już zarejestrowany",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: errorMessage || "Rejestracja nie powiodła się",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Successfully registered
    return new Response(
      JSON.stringify({
        success: true,
        message: "Rejestracja pomyślna. Zostałeś automatycznie zalogowany.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("Register error:", error);

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
