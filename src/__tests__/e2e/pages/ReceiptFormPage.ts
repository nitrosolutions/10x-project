import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ReceiptDateSection } from "./ReceiptDateSection";
import { ReceiptItemsSection } from "./ReceiptItemsSection";

/**
 * Receipt Form Page Object Model
 * Main page object for testing the receipt form (new/edit receipt)
 *
 * Composition:
 * - ReceiptDateSection: Handles date picker
 * - ReceiptItemsSection: Handles items management
 *
 * Test IDs:
 * - receipt-form-container: Main form container
 * - receipt-form: Form element
 * - receipt-store-name-input: Store name field
 * - receipt-total: Total section
 * - receipt-total-amount: Total amount display
 * - receipt-cancel-button: Cancel button
 * - receipt-submit-button: Submit button
 */
export class ReceiptFormPage extends BasePage {
  // Test ID constants
  private readonly FORM_CONTAINER = "receipt-form-container";
  private readonly FORM = "receipt-form";
  private readonly STORE_NAME_INPUT = "receipt-store-name-input";
  private readonly TOTAL_SECTION = "receipt-total";
  private readonly TOTAL_AMOUNT = "receipt-total-amount";
  private readonly CANCEL_BUTTON = "receipt-cancel-button";
  private readonly SUBMIT_BUTTON = "receipt-submit-button";

  // Sub-sections
  private dateSection: ReceiptDateSection;
  private itemsSection: ReceiptItemsSection;

  constructor(page: Page) {
    super(page);
    this.dateSection = new ReceiptDateSection(page);
    this.itemsSection = new ReceiptItemsSection(page);
  }

  /**
   * Navigate to the new receipt form
   */
  async goToNewReceipt() {
    await this.goto("/receipts/new");
  }

  /**
   * Navigate to edit receipt form
   * @param receiptId Receipt ID to edit
   */
  async goToEditReceipt(receiptId: string) {
    await this.goto(`/receipts/${receiptId}/edit`);
  }

  /**
   * Verify form is loaded and visible
   */
  async isFormVisible() {
    return await this.isVisibleByTestId(this.FORM_CONTAINER);
  }

  /**
   * Wait for form to load and React to hydrate
   */
  async waitForForm() {
    await this.waitForTestId(this.FORM_CONTAINER);

    // Wait for React hydration - check if add item button is interactive
    const addButton = this.page.getByTestId("receipt-add-item-button");
    await addButton.waitFor({ state: "attached", timeout: 5000 }).catch(() => {
      // Button might not exist yet, that's ok
    });

    // Give React time to fully hydrate event handlers
    await this.page.waitForTimeout(1000);
  }

  // ====== Date Section Access ======

  /**
   * Get the date section sub-object
   * @returns ReceiptDateSection instance
   */
  getDateSection() {
    return this.dateSection;
  }

  /**
   * Convenience method: Open date picker
   */
  async openDatePicker() {
    return await this.dateSection.openDatePicker();
  }

  /**
   * Convenience method: Select date
   */
  async selectDate(dateString: string) {
    return await this.dateSection.selectDate(dateString);
  }

  /**
   * Convenience method: Select today
   */
  async selectToday() {
    return await this.dateSection.selectToday();
  }

  /**
   * Convenience method: Get displayed date
   */
  async getDisplayedDate() {
    return await this.dateSection.getDisplayedDate();
  }

  // ====== Items Section Access ======

  /**
   * Get the items section sub-object
   * @returns ReceiptItemsSection instance
   */
  getItemsSection() {
    return this.itemsSection;
  }

  /**
   * Convenience method: Click add item button
   */
  async clickAddItemButton() {
    return await this.itemsSection.clickAddItemButton();
  }

  /**
   * Convenience method: Add item with data
   */
  async addItemWithData(productName: string, price: string | number, categoryId: number) {
    return await this.itemsSection.addItemWithData(productName, price, categoryId);
  }

  /**
   * Convenience method: Add multiple items
   */
  async addItemsWithData(
    items: {
      productName: string;
      price: string | number;
      categoryId: number;
    }[]
  ) {
    return await this.itemsSection.addItemsWithData(items);
  }

  /**
   * Convenience method: Get item count
   */
  async countItems() {
    return await this.itemsSection.countItems();
  }

  // ====== Store Name Field ======

  /**
   * Fill store name
   * @param storeName Name of the store
   */
  async fillStoreName(storeName: string) {
    await this.fillByTestId(this.STORE_NAME_INPUT, storeName);
  }

  /**
   * Get store name value
   */
  async getStoreName() {
    return await this.getInputValueByTestId(this.STORE_NAME_INPUT);
  }

  /**
   * Verify store name has expected value
   * @param expectedName Expected store name
   */
  async verifyStoreName(expectedName: string) {
    await this.expectValueByTestId(this.STORE_NAME_INPUT, expectedName);
  }

  /**
   * Clear store name field
   */
  async clearStoreName() {
    await this.getByTestId(this.STORE_NAME_INPUT).clear();
  }

  // ====== Total Section ======

  /**
   * Get total amount text (e.g., "19.99 zł")
   */
  async getTotalAmount() {
    return await this.getTextByTestId(this.TOTAL_AMOUNT);
  }

  /**
   * Verify total amount contains expected value
   * @param expectedAmount Expected amount (can be partial, e.g., "19.99")
   */
  async verifyTotalAmount(expectedAmount: string | RegExp) {
    await this.expectTextByTestId(this.TOTAL_AMOUNT, expectedAmount);
  }

  /**
   * Extract numeric value from total amount
   * @returns Number value of total (e.g., 19.99)
   */
  async getTotalAmountNumeric() {
    const totalText = await this.getTotalAmount();
    if (!totalText) return 0;
    // Extract number from "19.99 zł" format
    const match = totalText.match(/(\d+\.\d+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Verify total amount equals expected numeric value
   * @param expectedAmount Expected numeric total
   */
  async verifyTotalAmountNumeric(expectedAmount: number) {
    const actual = await this.getTotalAmountNumeric();
    if (Math.abs(actual - expectedAmount) > 0.01) {
      throw new Error(`Expected total ${expectedAmount}, but got ${actual}`);
    }
  }

  // ====== Form Validation ======

  /**
   * Verify submit button is enabled
   */
  async isSubmitButtonEnabled() {
    return await this.isEnabledByTestId(this.SUBMIT_BUTTON);
  }

  /**
   * Verify submit button is disabled
   */
  async isSubmitButtonDisabled() {
    return !(await this.isSubmitButtonEnabled());
  }

  /**
   * Verify form is valid (submit button enabled)
   */
  async verifyFormValid() {
    await this.expectEnabledByTestId(this.SUBMIT_BUTTON);
  }

  /**
   * Verify form is invalid (submit button disabled)
   */
  async verifyFormInvalid() {
    await this.expectDisabledByTestId(this.SUBMIT_BUTTON);
  }

  /**
   * Wait until form is valid
   */
  async waitForFormValid() {
    let isValid = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isValid && attempts < maxAttempts) {
      isValid = await this.isSubmitButtonEnabled();
      if (!isValid) {
        await this.page.waitForTimeout(100);
      }
      attempts++;
    }

    if (!isValid) {
      throw new Error("Form did not become valid within timeout");
    }
  }

  // ====== Form Actions ======

  /**
   * Click cancel button
   */
  async clickCancelButton() {
    await this.clickByTestId(this.CANCEL_BUTTON);
  }

  /**
   * Click submit button
   */
  async clickSubmitButton() {
    await this.clickByTestId(this.SUBMIT_BUTTON);
  }

  /**
   * Submit the form
   */
  async submitForm() {
    await this.clickSubmitButton();
  }

  /**
   * Cancel the form
   */
  async cancelForm() {
    await this.clickCancelButton();
  }

  /**
   * Get submit button text
   */
  async getSubmitButtonText() {
    return await this.getTextByTestId(this.SUBMIT_BUTTON);
  }

  /**
   * Verify submit button shows "Zapisz" (Save)
   */
  async verifySubmitButtonIsSave() {
    await this.expectTextByTestId(this.SUBMIT_BUTTON, "Zapisz");
  }

  /**
   * Verify submit button shows "Zaktualizuj" (Update)
   */
  async verifySubmitButtonIsUpdate() {
    await this.expectTextByTestId(this.SUBMIT_BUTTON, "Zaktualizuj");
  }

  /**
   * Verify submit button is in loading state
   */
  async isSubmitButtonLoading() {
    const text = await this.getSubmitButtonText();
    return text?.includes("ując") === true || text?.includes("owanie") === true;
  }

  // ====== Complete Workflows ======

  /**
   * Fill entire form with data
   * @param data Form data
   */
  async fillForm(data: {
    date?: string;
    storeName?: string;
    items?: {
      productName: string;
      price: string | number;
      categoryId: number;
    }[];
  }) {
    if (data.date) {
      await this.selectDate(data.date);
    }

    if (data.storeName) {
      await this.fillStoreName(data.storeName);
    }

    if (data.items && data.items.length > 0) {
      await this.addItemsWithData(data.items);
    }
  }

  /**
   * Create receipt with data and submit
   * @param data Receipt data
   */
  async createReceipt(data: {
    date?: string;
    storeName?: string;
    items: {
      productName: string;
      price: string | number;
      categoryId: number;
    }[];
  }) {
    await this.fillForm(data);
    await this.waitForFormValid();
    await this.submitForm();
  }

  /**
   * Fill minimum required fields and submit
   * (At least date is required)
   */
  async createMinimalReceipt(date?: string) {
    if (date) {
      await this.selectDate(date);
    } else {
      await this.selectToday();
    }

    await this.waitForFormValid();
    await this.submitForm();
  }

  /**
   * Verify successful submission (redirect to home with month parameter)
   */
  async verifySubmissionSuccess() {
    await this.expectUrlMatch(/\/?month=\d{4}-\d{2}/);
  }

  /**
   * Take screenshot of the form
   * @param name Screenshot name
   */
  async takeFormScreenshot(name: string) {
    await this.screenshot(`receipt-form-${name}`);
  }
}
