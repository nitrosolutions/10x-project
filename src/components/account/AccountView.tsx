/* src/components/account/AccountView.tsx */
import { useState } from "react";
import { Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface AccountViewProps {
  userEmail: string;
}

export default function AccountView({ userEmail }: AccountViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia konta</h1>
        <p className="text-sm text-muted-foreground">Zarządzaj swoim kontem i danymi</p>
      </div>

      {/* User Info Section */}
      <div className="space-y-4">
        <div className="relative rounded-lg border p-4">
          {/* Delete Account Button - positioned in top right corner */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="absolute -top-3 right-3 h-7 w-7 rounded-full bg-background border border-border text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Usuń konto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
              <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
    </div>
  );
}
