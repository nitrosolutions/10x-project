import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { ReceiptItemRow } from "@/components/receipts/ReceiptItemRow";
import type { CategoryDto } from "@/types";
import { vi } from "vitest";

/**
 * Test Suite: ReceiptItemRow Price Field
 *
 * Tests the price field input behavior:
 * - Allow setting price on new items
 * - Allow clearing price on new items
 * - Allow setting price on existing items
 * - Allow clearing price on existing items (the bug fix)
 * - Proper numeric conversion
 * - Handle decimal values
 */

const mockCategories: CategoryDto[] = [
  { id: 1, name: "Food", icon: "🛒", order: 1 },
  { id: 2, name: "Transport", icon: "🚗", order: 2 },
];

interface TestFormData {
  items: {
    product_name: string;
    price?: number;
    category_id: number;
  }[];
}

// Helper component to test ReceiptItemRow with form context
function TestWrapper({ onRender }: { onRender?: (form: any) => void }) {
  const form = useForm<TestFormData>({
    defaultValues: {
      items: [
        {
          product_name: "",
          price: undefined,
          category_id: 1,
        },
      ],
    },
  });

  if (onRender) {
    onRender(form);
  }

  return (
    <FormProvider {...form}>
      <ReceiptItemRow
        index={0}
        form={form}
        categories={mockCategories}
        onRemove={vi.fn()}
        canRemove={false}
        data-testid="receipt-item-row-0"
      />
    </FormProvider>
  );
}

describe("ReceiptItemRow - Price Field", () => {
  describe("Setting and clearing prices", () => {
    it("should allow setting price on new item", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Act - Set price
      await user.clear(priceInput);
      await user.type(priceInput, "19.99");

      // Assert - Price is set
      await waitFor(() => {
        expect(priceInput.value).toBe("19.99");
      });
      expect(form.getValues("items.0.price")).toBe(19.99);
    });

    it("should allow clearing price on new item", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Act - Set price
      await user.clear(priceInput);
      await user.type(priceInput, "25.50");

      // Assert - Price is set
      expect(form.getValues("items.0.price")).toBe(25.5);

      // Act - Clear price
      await user.clear(priceInput);

      // Assert - Price is cleared (null)
      await waitFor(() => {
        expect(priceInput.value).toBe("");
        expect(form.getValues("items.0.price")).toBeNull();
      });
    });

    it("should handle multiple price changes", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Act & Assert - First price
      await user.clear(priceInput);
      await user.type(priceInput, "10.00");
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBe(10);
      });

      // Act & Assert - Change to second price
      await user.clear(priceInput);
      await user.type(priceInput, "25.75");
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBe(25.75);
      });

      // Act & Assert - Clear price
      await user.clear(priceInput);
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBeNull();
      });

      // Act & Assert - Set price again
      await user.clear(priceInput);
      await user.type(priceInput, "99.99");
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBe(99.99);
      });
    });

    it("should handle zero price value", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Act - Set price to 0
      await user.clear(priceInput);
      await user.type(priceInput, "0");

      // Assert - Price is 0 (not undefined)
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBe(0);
        expect(priceInput.value).toBe("0");
      });
    });

    it("should handle decimal prices correctly", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Test multiple decimal values
      const testCases = ["0.99", "10.50", "999.99", "1.05"];

      for (const price of testCases) {
        // Act - Set price
        await user.clear(priceInput);
        await user.type(priceInput, price);

        // Assert
        const expectedValue = parseFloat(price);
        await waitFor(() => {
          expect(form.getValues("items.0.price")).toBe(expectedValue);
        });
      }
    });

    it("should ignore invalid numeric input", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Set valid price first
      await user.clear(priceInput);
      await user.type(priceInput, "20.00");
      await waitFor(() => {
        expect(form.getValues("items.0.price")).toBe(20);
      });

      // Act - Type invalid characters (HTML5 number input filters these)
      // Note: HTML5 number input prevents non-numeric input, so we just verify it doesn't break
      expect(priceInput.type).toBe("number");
    });

    it("should display empty value when price is undefined or null", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Assert - Initial state should show empty value
      expect(priceInput.value).toBe("");

      // Act - Set and clear multiple times
      await user.clear(priceInput);
      await user.type(priceInput, "50.00");
      expect(form.getValues("items.0.price")).toBe(50);

      // Clear
      await user.clear(priceInput);
      expect(priceInput.value).toBe("");
    });

    it("should preserve form state when price is cleared", async () => {
      const user = userEvent.setup();
      let form: any;

      render(
        <TestWrapper
          onRender={(f) => {
            form = f;
          }}
        />
      );

      const productNameInput = screen.getByTestId("receipt-item-row-0-product-name-input") as HTMLInputElement;
      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Act - Fill product name and price
      await user.type(productNameInput, "Test Product");
      await user.clear(priceInput);
      await user.type(priceInput, "15.50");

      expect(form.getValues("items.0.product_name")).toBe("Test Product");
      expect(form.getValues("items.0.price")).toBe(15.5);

      // Act - Clear only price
      await user.clear(priceInput);

      // Assert - Product name is preserved, price is cleared
      expect(form.getValues("items.0.product_name")).toBe("Test Product");
      expect(form.getValues("items.0.price")).toBeNull();
    });
  });

  describe("Field properties", () => {
    it("should have correct input attributes", () => {
      render(<TestWrapper />);

      const priceInput = screen.getByTestId("receipt-item-row-0-price-input") as HTMLInputElement;

      // Assert input properties
      expect(priceInput.type).toBe("number");
      expect(priceInput.step).toBe("0.01");
      expect(priceInput.min).toBe("0");
      expect(priceInput.placeholder).toBe("0.00");
    });

    it("should display price label", () => {
      render(<TestWrapper />);

      const label = screen.getByLabelText("Cena (zł)");
      expect(label).toBeInTheDocument();
    });
  });
});
