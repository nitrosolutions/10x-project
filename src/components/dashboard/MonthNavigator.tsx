import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  isNextDisabled: boolean;
}

export function MonthNavigator({ currentMonth, onPreviousMonth, onNextMonth, isNextDisabled }: MonthNavigatorProps) {
  // Formatowanie nazwy miesiąca
  const formatMonthName = (date: Date): string => {
    return date.toLocaleDateString("pl-PL", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <Button variant="outline" size="icon" onClick={onPreviousMonth} aria-label="Poprzedni miesiąc">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <h2 className="text-2xl font-semibold capitalize">{formatMonthName(currentMonth)}</h2>

      <Button
        variant="outline"
        size="icon"
        onClick={onNextMonth}
        disabled={isNextDisabled}
        aria-label="Następny miesiąc"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
