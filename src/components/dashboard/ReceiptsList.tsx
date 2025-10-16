import type { ReceiptListDto } from "@/types";
import { ReceiptListItem } from "./ReceiptListItem";

interface ReceiptsListProps {
  receipts: ReceiptListDto[];
  onDelete?: (receiptId: string) => Promise<void>;
}

export function ReceiptsList({ receipts, onDelete }: ReceiptsListProps) {
  return (
    <div className="space-y-4" role="list" aria-label="Lista paragonów">
      {receipts.map((receipt) => (
        <div key={receipt.id} role="listitem">
          <ReceiptListItem receipt={receipt} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
