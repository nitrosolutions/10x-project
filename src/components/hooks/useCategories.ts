import { useState, useEffect } from "react";
import type { CategoryDto } from "@/types";

interface UseCategoriesReturn {
  categories: CategoryDto[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook do pobierania listy kategorii wydatków
 *
 * @returns Kategorie, stan ładowania i potencjalny błąd
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać kategorii");
        }

        const data: CategoryDto[] = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się załadować kategorii");
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
  };
}
