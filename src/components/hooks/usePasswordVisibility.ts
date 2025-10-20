/* src/components/hooks/usePasswordVisibility.ts */
import { useState, useCallback } from "react";

type VisibilityState = Record<string, boolean>;

/**
 * Custom hook to manage password field visibility state
 * Supports multiple password fields with independent visibility toggle
 *
 * @example
 * const { isVisible, toggleVisibility } = usePasswordVisibility();
 *
 * <Input type={isVisible("password") ? "text" : "password"} />
 * <Button onClick={() => toggleVisibility("password")}>
 *   {isVisible("password") ? <EyeOff /> : <Eye />}
 * </Button>
 */
export function usePasswordVisibility() {
  const [visibility, setVisibility] = useState<VisibilityState>({});

  const toggleVisibility = useCallback((field: string) => {
    setVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const isVisible = useCallback(
    (field: string) => {
      return visibility[field] ?? false;
    },
    [visibility]
  );

  return { isVisible, toggleVisibility };
}
