import type { ReceiptListDto } from "@/types";
import { ReceiptListItem } from "./ReceiptListItem";

interface ReceiptsListProps {
  receipts: ReceiptListDto[];
}

export function ReceiptsList({ receipts }: ReceiptsListProps) {
  return (
    <div className="space-y-3" role="list" aria-label="Lista paragonów">
      {receipts.map((receipt) => (
        <div key={receipt.id} role="listitem">
          <ReceiptListItem receipt={receipt} />
        </div>
      ))}
    </div>
  );
}
