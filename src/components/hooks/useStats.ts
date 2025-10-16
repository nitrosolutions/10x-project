import { useState, useEffect, useCallback } from "react";
import type { StatsDto } from "@/types";

interface UseStatsReturn {
  stats: StatsDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook do pobierania statystyk wydatków dla wybranego miesiąca
 *
 * @param month - Miesiąc w formacie YYYY-MM
 * @returns Obraz ze statystykami, stanem ładowania i potencjalnym błędem
 */
export function useStats(month: string): UseStatsReturn {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stats?month=${month}`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać statystyk");
      }

      const data: StatsDto = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się załadować statystyk");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
