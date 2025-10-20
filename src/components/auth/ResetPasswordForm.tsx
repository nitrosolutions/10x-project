/* src/components/auth/ResetPasswordForm.tsx */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Zgodnie ze specyfikacją - zawsze zwraca 200
      if (!response.ok) {
        throw new Error("Błąd podczas wysyłania emaila");
      }

      setIsSuccess(true);
      toast.success("Email został wysłany");
    } catch {
      toast.error("Nie udało się wysłać emaila. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Sprawdź swoją skrzynkę</h2>
          <p className="text-sm text-muted-foreground">
            Jeśli konto z podanym adresem email istnieje, wysłaliśmy na nie link do resetowania hasła.
          </p>
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Resetuj hasło</h2>
        <p className="text-sm text-muted-foreground">Podaj adres email powiązany z Twoim kontem</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="twoj@email.pl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
          Zaloguj się
        </a>
      </div>
    </div>
  );
}
