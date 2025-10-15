import { useState } from "react";
import { Plus, ScanLine, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  const handleAddManually = () => {
    setOpen(false);
    window.location.href = "/receipts/new";
  };

  const handleScan = () => {
    setOpen(false);
    window.location.href = "/receipts/scan";
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon-lg"
            className="size-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Dodaj paragon"
          >
            <Plus className="size-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" sideOffset={8} className="w-56 p-2">
          <div className="flex flex-col gap-1" role="menu" aria-label="Opcje dodawania paragonu">
            <button
              onClick={handleScan}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="menuitem"
              aria-label="Skanuj paragon"
            >
              <ScanLine className="size-5 shrink-0" />
              <span className="font-medium">Skanuj paragon</span>
            </button>
            <button
              onClick={handleAddManually}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="menuitem"
              aria-label="Dodaj ręcznie"
            >
              <FileEdit className="size-5 shrink-0" />
              <span className="font-medium">Dodaj ręcznie</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
