/* src/lib/services/authService.ts */
import { z } from "zod";
import type { RegisterFormData, LoginFormData } from "@/lib/schemas/auth.schema";

// Define response schemas for type safety
const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: authUserSchema,
});

const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: authUserSchema,
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Parse error response from API
 */
async function parseAuthErrorResponse(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    const errorMessage = data.error || data.message || "Nieznany błąd";
    const error = new Error(errorMessage) as Error & { statusCode?: number };
    error.statusCode = response.status;
    return error;
  } catch {
    return new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

/**
 * Submit registration form data to the API
 * @throws Error if registration fails
 */
export async function submitRegister(data: RegisterFormData): Promise<RegisterResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await parseAuthErrorResponse(response);
    throw error;
  }

  const responseData = await response.json();

  // Validate response structure
  const validated = registerResponseSchema.safeParse(responseData);

  if (!validated.success) {
    throw new Error("Nieprawidłowy format odpowiedzi serwera");
  }

  return validated.data;
}

/**
 * Submit login form data to the API
 * @throws Error if login fails
 */
export async function submitLogin(data: LoginFormData): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await parseAuthErrorResponse(response);
    throw error;
  }

  const responseData = await response.json();
  const validated = loginResponseSchema.safeParse(responseData);

  if (!validated.success) {
    throw new Error("Nieprawidłowy format odpowiedzi serwera");
  }

  return validated.data;
}
