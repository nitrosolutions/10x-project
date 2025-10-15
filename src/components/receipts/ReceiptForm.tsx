/* src/components/receipts/ReceiptForm.tsx */
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import type { CategoryDto } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReceiptItemRow } from "./ReceiptItemRow";

// Schema walidacji z zod
const receiptItemSchema = z.object({
  id: z.string(),
  product_name: z.string().min(1, "Nazwa produktu jest wymagana"),
  price: z
    .number({
      required_error: "Cena jest wymagana",
      invalid_type_error: "Cena musi być liczbą",
    })
    .positive("Cena musi być większa od zera")
    .optional()
    .or(z.number().positive("Cena musi być większa od zera")),
  category_id: z.number({
    required_error: "Kategoria jest wymagana",
    invalid_type_error: "Kategoria jest wymagana",
  }),
});

const receiptFormSchema = z.object({
  purchase_date: z.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    },
    { message: "Data zakupu nie może być z przyszłości" }
  ),
  store_name: z.string().optional(),
  items: z.array(receiptItemSchema).optional(),
});

// ViewModel types wywnioskowane z schematu zod
type ReceiptViewModel = z.infer<typeof receiptFormSchema>;

interface ReceiptFormProps {
  categories: CategoryDto[];
}

export default function ReceiptForm({ categories }: ReceiptFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReceiptViewModel>({
    resolver: zodResolver(receiptFormSchema),
    mode: "onChange",
    defaultValues: {
      purchase_date: new Date(),
      store_name: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: ReceiptViewModel) => {
    setIsLoading(true);

    try {
      // Transformacja z ViewModel do DTO
      const createDto = {
        purchase_date: data.purchase_date.toISOString().split("T")[0],
        store_name: data.store_name || undefined,
        items: data.items?.map((item) => ({
          product_name: item.product_name,
          price: item.price,
          category_id: item.category_id,
        })),
      };

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createDto),
      });

      if (!response.ok) {
        throw new Error("Failed to save receipt");
      }

      toast.success("Paragon został zapisany");
      // Przekierowanie do widoku miesięcznego
      window.location.href = "/";
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    append({
      id: crypto.randomUUID(),
      product_name: "",
      price: undefined,
      category_id: categories[0]?.id || 0,
    });
  };

  // Obliczanie sumy
  const calculateTotal = () => {
    return fields.reduce((sum, _, index) => {
      const priceValue = form.watch(`items.${index}.price`);
      const price = typeof priceValue === "number" ? priceValue : 0;
      return sum + price;
    }, 0);
  };

  const total = calculateTotal();

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date and Store Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Date Field */}
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data zakupu</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store Name Field */}
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa sklepu (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Biedronka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Items list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pozycje paragonu (opcjonalnie)</h2>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                + Dodaj pozycję
              </Button>
            </div>
            {fields.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <p>Brak pozycji na paragonie</p>
                <p className="text-sm mt-1">Kliknij "Dodaj pozycję" aby dodać produkty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <ReceiptItemRow
                      index={index}
                      form={form}
                      categories={categories}
                      onRemove={() => remove(index)}
                      canRemove={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Suma:</span>
            <span>{total.toFixed(2)} zł</span>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
            {isLoading ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
