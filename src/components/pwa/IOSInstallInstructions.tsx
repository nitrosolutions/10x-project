import { Share, Plus, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IOSInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IOSInstallInstructions({ open, onOpenChange }: IOSInstallInstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Zainstaluj PortfelIO na iOS</DialogTitle>
          <DialogDescription>Wykonaj poniższe kroki, aby dodać aplikację do ekranu głównego</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Krok 1 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Share className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">1. Naciśnij przycisk "Udostępnij"</h4>
              <p className="text-sm text-muted-foreground">
                Znajdziesz go na pasku narzędzi Safari (ikona kwadratu ze strzałką w górę)
              </p>
            </div>
          </div>

          {/* Krok 2 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Plus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">2. Wybierz "Dodaj do ekranu początkowego"</h4>
              <p className="text-sm text-muted-foreground">
                Przewiń w dół w menu i znajdź opcję "Dodaj do ekranu początkowego"
              </p>
            </div>
          </div>

          {/* Krok 3 */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Home className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">3. Potwierdź dodanie</h4>
              <p className="text-sm text-muted-foreground">
                Naciśnij "Dodaj" w prawym górnym rogu. Ikona PortfelIO pojawi się na ekranie głównym!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 mt-2">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Wskazówka:</strong> Po instalacji możesz używać PortfelIO jak natywnej aplikacji - bez paska
            adresu przeglądarki!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
