import type { ReceiptListDto } from "@/types";

interface ReceiptListItemProps {
  receipt: ReceiptListDto;
}

export function ReceiptListItem({ receipt }: ReceiptListItemProps) {
  // Formatowanie daty do czytelnego formatu
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatowanie kwoty do formatu walutowego
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };

  return (
    <a
      href={`/receipts/${receipt.id}`}
      className="block p-4 border rounded-lg hover:bg-accent hover:border-accent-foreground/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{formatDate(receipt.purchase_date)}</span>
            {receipt.store_name && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground truncate">{receipt.store_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="text-base font-semibold">{formatAmount(receipt.total_amount)}</span>
        </div>
      </div>
    </a>
  );
}
