export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl text-muted-foreground">📋</div>
        <h3 className="text-lg font-semibold">Brak paragonów</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Nie masz jeszcze żadnych paragonów w tym miesiącu. Dodaj pierwszy paragon, aby rozpocząć śledzenie wydatków.
        </p>
        <div className="pt-4">
          <a
            href="/receipts/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Dodaj pierwszy paragon
          </a>
        </div>
      </div>
    </div>
  );
}
