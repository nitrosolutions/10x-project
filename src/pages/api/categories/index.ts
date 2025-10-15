/* src/pages/api/categories/index.ts */
import type { APIRoute } from "astro";
import type { CategoryDto } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Supabase client not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data, error } = await supabase.from("categories").select("*").order("order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch categories" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data as CategoryDto[]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
