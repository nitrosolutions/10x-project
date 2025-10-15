export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl text-muted-foreground">📋</div>
        <h3 className="text-lg font-semibold">Brak paragonów</h3>
        <p className="text-sm text-muted-foreground max-w-md">Nie masz jeszcze żadnych paragonów w tym miesiącu.</p>
      </div>
    </div>
  );
}
