/* src/components/auth/LoginForm.tsx */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth.schema";
import { usePasswordVisibility } from "@/components/hooks/usePasswordVisibility";
import { useAuthSubmission } from "@/components/hooks/useAuthSubmission";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  // Password visibility management
  const { isVisible, toggleVisibility } = usePasswordVisibility();

  // Auth submission management
  const { isSubmitting, submitLoginForm } = useAuthSubmission({
    successMessage: "Zalogowano pomyślnie",
  });

  // Form state and validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Simple submission handler
  const onSubmit = async (data: LoginFormData) => {
    await submitLoginForm(data);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Zaloguj się</h2>
        <p className="text-sm text-muted-foreground">Wprowadź swoje dane, aby kontynuować</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="twoj@email.pl" data-testid="login-email-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasło</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={isVisible("password") ? "text" : "password"}
                      placeholder="••••••••"
                      data-testid="login-password-input"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility("password")}
                      data-testid="login-toggle-password-visibility"
                    >
                      {isVisible("password") ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="w-full"
            data-testid="login-submit-button"
          >
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4 text-center text-sm">
        <a href="/reset-password" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
          Zapomniałeś hasła?
        </a>

        <div className="text-muted-foreground">
          Nie masz konta?{" "}
          <a href="/register" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
            Zarejestruj się
          </a>
        </div>
      </div>
    </div>
  );
}
