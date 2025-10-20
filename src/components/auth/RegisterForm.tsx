/* src/components/auth/RegisterForm.tsx */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth.schema";
import { usePasswordVisibility } from "@/components/hooks/usePasswordVisibility";
import { useAuthSubmission } from "@/components/hooks/useAuthSubmission";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function RegisterForm() {
  // Password visibility management
  const { isVisible, toggleVisibility } = usePasswordVisibility();

  // Auth submission management
  const { isSubmitting, submitRegisterForm } = useAuthSubmission({
    successMessage: "Konto utworzone! Zostaniesz zalogowany.",
  });

  // Form state and validation
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Simple submission handler
  const onSubmit = async (data: RegisterFormData) => {
    await submitRegisterForm(data);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Utwórz konto</h2>
        <p className="text-sm text-muted-foreground">Wprowadź swoje dane, aby rozpocząć</p>
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasło</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={isVisible("password") ? "text" : "password"} placeholder="••••••••" {...field} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility("password")}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Min. 8 znaków, duża litera, mała litera, cyfra i znak specjalny
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Powtórz hasło</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={isVisible("confirmPassword") ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => toggleVisibility("confirmPassword")}
                    >
                      {isVisible("confirmPassword") ? (
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

          <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="w-full">
            {isSubmitting ? "Tworzenie konta..." : "Utwórz konto"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a href="/login" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
          Zaloguj się
        </a>
      </div>
    </div>
  );
}
