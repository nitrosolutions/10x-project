/* src/components/receipts/ReceiptItemRow.tsx */
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { CategoryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ReceiptItemRowProps {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  categories: CategoryDto[];
  onRemove: () => void;
  canRemove: boolean;
}

export function ReceiptItemRow({ index, form, categories, onRemove, canRemove }: ReceiptItemRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    onRemove();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="relative border border-border rounded-lg p-4">
      {/* Remove Button - positioned in top right corner on the border */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="absolute -top-3 right-3 h-7 w-7 rounded-full bg-background border border-border text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Product Name - 40% width on desktop */}
        <div className="md:col-span-5">
          <FormField
            control={form.control}
            name={`items.${index}.product_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa produktu</FormLabel>
                <FormControl>
                  <Input placeholder="np. Mleko" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price - 20% width on desktop */}
        <div className="md:col-span-3">
          <FormField
            control={form.control}
            name={`items.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cena (zł)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category - 30% width on desktop */}
        <div className="md:col-span-4">
          <FormField
            control={form.control}
            name={`items.${index}.category_id`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategoria</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę pozycję?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja spowoduje usunięcie pozycji z paragonu. Dane będą utracone po zapisaniu zmian.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
