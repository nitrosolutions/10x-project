import { useState, useEffect } from "react";
import type { ReceiptListDto } from "@/types";

interface UseDashboardReturn {
  currentMonth: Date;
  receipts: ReceiptListDto[];
  isLoading: boolean;
  error: string | null;
  handlePreviousMonth: () => void;
  handleNextMonth: () => void;
  isNextDisabled: boolean;
}

export function useDashboard(): UseDashboardReturn {
  // Inicjalizacja miesiąca z parametru URL lub bieżącego miesiąca
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (typeof window === "undefined") {
      return new Date();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const monthParam = urlParams.get("month");

    if (monthParam) {
      // Format: YYYY-MM
      const [year, month] = monthParam.split("-");
      if (year && month) {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        // Walidacja czy data jest poprawna
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return new Date();
  });

  const [receipts, setReceipts] = useState<ReceiptListDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcja formatująca datę do YYYY-MM
  const formatMonthParam = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Sprawdzenie, czy można nawigować do przodu
  const isNextDisabled = (): boolean => {
    const now = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    return currentYear >= nowYear && currentMonthNum >= nowMonth;
  };

  // Funkcja do nawigacji do poprzedniego miesiąca
  const handlePreviousMonth = (): void => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Funkcja do nawigacji do następnego miesiąca
  const handleNextMonth = (): void => {
    if (isNextDisabled()) return;

    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Efekt pobierający dane z API przy zmianie miesiąca
  useEffect(() => {
    const fetchReceipts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const monthParam = formatMonthParam(currentMonth);
        const response = await fetch(`/api/receipts?month=${monthParam}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych");
        }

        const data: ReceiptListDto[] = await response.json();
        setReceipts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się załadować danych. Spróbuj ponownie później.");
        setReceipts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [currentMonth]);

  return {
    currentMonth,
    receipts,
    isLoading,
    error,
    handlePreviousMonth,
    handleNextMonth,
    isNextDisabled: isNextDisabled(),
  };
}
