import { useState } from "react";
import type { ReceiptListDto } from "@/types";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReceiptListItemProps {
  receipt: ReceiptListDto;
  onDelete?: (id: string) => Promise<void>;
}

export function ReceiptListItem({ receipt, onDelete }: ReceiptListItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(receipt.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Błąd jest już obsłużony w useDashboard
      // Nie zamykamy dialogu, aby użytkownik widział komunikat o błędzie
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
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
    <>
      <div className="relative border border-border rounded-lg">
        <a
          href={`/receipts/${receipt.id}`}
          className="block p-4 hover:bg-accent hover:border-accent-foreground/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
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

        {/* Delete Button - positioned in top right corner on the border */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="absolute -top-3 right-3 h-7 w-7 rounded-full bg-background border border-border text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten paragon?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja spowoduje usunięcie paragonu. Dane będą utracone trwale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
