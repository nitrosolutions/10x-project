/* src/components/hooks/useAuthSubmission.ts */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { RegisterFormData, LoginFormData } from "@/lib/schemas/auth.schema";
import { submitRegister, submitLogin } from "@/lib/services/authService";

interface UseAuthSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectUrl?: string;
  redirectDelay?: number;
  successMessage?: string;
}

/**
 * Custom hook to manage authentication form submission
 * Handles loading state, error handling, toast notifications, and redirects
 *
 * @example
 * const { isSubmitting, submitRegisterForm } = useAuthSubmission({
 *   successMessage: "Konto utworzone!",
 * });
 *
 * const onSubmit = async (data: RegisterFormData) => {
 *   await submitRegisterForm(data);
 * };
 */
export function useAuthSubmission(options: UseAuthSubmissionOptions = {}) {
  const {
    onSuccess,
    onError,
    redirectUrl = "/",
    redirectDelay = 2000,
    successMessage = "Operacja zakończona pomyślnie",
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitAuthForm = useCallback(
    async (data: RegisterFormData | LoginFormData, type: "register" | "login") => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result =
          type === "register"
            ? await submitRegister(data as RegisterFormData)
            : await submitLogin(data as LoginFormData);

        // Show success message
        toast.success(result.message || successMessage);

        // Call optional success handler
        onSuccess?.();

        // Redirect after delay
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, redirectDelay);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nieznany błąd");
        setError(error);

        // Show error message
        toast.error(error.message);

        // Call optional error handler
        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess, onError, redirectUrl, redirectDelay, successMessage]
  );

  const submitRegisterForm = useCallback(
    (data: RegisterFormData) => submitAuthForm(data, "register"),
    [submitAuthForm]
  );

  const submitLoginForm = useCallback((data: LoginFormData) => submitAuthForm(data, "login"), [submitAuthForm]);

  return {
    isSubmitting,
    error,
    submitRegisterForm,
    submitLoginForm,
  };
}
