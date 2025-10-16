import { useDashboard } from "@/components/hooks/useDashboard";
import { useStats } from "@/components/hooks/useStats";
import { MonthNavigator } from "./MonthNavigator";
import { StatsChart } from "./StatsChart";
import { ReceiptsList } from "./ReceiptsList";
import { EmptyState } from "./EmptyState";
import { FloatingActionButton } from "./FloatingActionButton";

export function DashboardView() {
  const {
    currentMonth,
    receipts,
    isLoading,
    error,
    handlePreviousMonth,
    handleNextMonth,
    isNextDisabled,
    deleteReceipt,
  } = useDashboard();

  // Formatowanie miesiąca do YYYY-MM
  const monthParam = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  // Pobieranie statystyk dla wybranego miesiąca
  const { stats, isLoading: statsLoading } = useStats(monthParam);

  // Stan ładowania
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="sr-only">Ładowanie...</span>
            </div>
            <p className="text-sm text-muted-foreground">Ładowanie paragonów...</p>
          </div>
        </div>
      </div>
    );
  }

  // Stan błędu
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          isNextDisabled={isNextDisabled}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="text-6xl text-destructive">⚠️</div>
            <h3 className="text-lg font-semibold">Wystąpił błąd</h3>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <div className="pt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stan główny
  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          isNextDisabled={isNextDisabled}
        />

        {/* Wykres statystyk - wyświetlamy tylko gdy są paragony */}
        {receipts.length > 0 && <StatsChart stats={stats} isLoading={statsLoading} />}

        {/* Lista paragonów lub empty state */}
        {receipts.length === 0 ? <EmptyState /> : <ReceiptsList receipts={receipts} onDelete={deleteReceipt} />}
      </div>
      <FloatingActionButton />
    </>
  );
}
