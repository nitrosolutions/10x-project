/* src/lib/schemas/auth.schema.ts */
import { z } from "zod";

// Wspólna walidacja email
export const emailSchema = z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email");

// Wspólna walidacja hasła - wymaga minimum 8 znaków, dużej litery, małej litery, cyfry i znaku specjalnego
export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną dużą literę")
  .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/\\]/, "Hasło musi zawierać co najmniej jeden znak specjalny");

// Schema dla logowania
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Schema dla rejestracji
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Powtórzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

// Schema dla resetowania hasła
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Schema dla aktualizacji hasła
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Powtórzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

// Schema dla usuwania konta
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane do potwierdzenia"),
});

// Typy wywnioskowane z schematów
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
