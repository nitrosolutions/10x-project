import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Receipt Item Row Section
 * Handles individual receipt item form fields and deletion
 *
 * Test IDs (with {index} = 0-based index):
 * - receipt-item-row-{index}: Container for item
 * - receipt-item-row-{index}-product-name-input: Product name field
 * - receipt-item-row-{index}-price-input: Price field
 * - receipt-item-row-{index}-category-select: Category select trigger
 * - receipt-item-row-{index}-category-option-{id}: Category option
 * - receipt-item-row-{index}-delete-button: Delete item button
 * - receipt-item-row-{index}-delete-dialog: Delete confirmation dialog
 * - receipt-item-row-{index}-delete-dialog-cancel: Cancel deletion
 * - receipt-item-row-{index}-delete-dialog-confirm: Confirm deletion
 */
export class ReceiptItemRowSection extends BasePage {
  private readonly itemIndex: number;

  constructor(page: Page, itemIndex: number) {
    super(page);
    this.itemIndex = itemIndex;
  }

  // Test ID templates (computed properties)
  private get ITEM_ROW() {
    return `receipt-item-row-${this.itemIndex}`;
  }

  private get PRODUCT_NAME_INPUT() {
    return `receipt-item-row-${this.itemIndex}-product-name-input`;
  }

  private get PRICE_INPUT() {
    return `receipt-item-row-${this.itemIndex}-price-input`;
  }

  private get CATEGORY_SELECT() {
    return `receipt-item-row-${this.itemIndex}-category-select`;
  }

  private get DELETE_BUTTON() {
    return `receipt-item-row-${this.itemIndex}-delete-button`;
  }

  private get DELETE_DIALOG() {
    return `receipt-item-row-${this.itemIndex}-delete-dialog`;
  }

  private get DELETE_DIALOG_CANCEL() {
    return `receipt-item-row-${this.itemIndex}-delete-dialog-cancel`;
  }

  private get DELETE_DIALOG_CONFIRM() {
    return `receipt-item-row-${this.itemIndex}-delete-dialog-confirm`;
  }

  /**
   * Verify the item row is visible
   */
  async isItemRowVisible() {
    return await this.isVisibleByTestId(this.ITEM_ROW);
  }

  /**
   * Wait for item row to be visible
   */
  async waitForItemRow() {
    await this.waitForTestId(this.ITEM_ROW);
  }

  // ====== Product Name Field ======

  /**
   * Fill product name
   * @param productName Name of the product
   */
  async fillProductName(productName: string) {
    // Wait for the input to be visible first (React needs time to render new row)
    await this.waitForTestId(this.PRODUCT_NAME_INPUT);
    await this.fillByTestId(this.PRODUCT_NAME_INPUT, productName);
  }

  /**
   * Get the current product name value
   */
  async getProductName() {
    return await this.getInputValueByTestId(this.PRODUCT_NAME_INPUT);
  }

  /**
   * Verify product name has expected value
   * @param expectedName Expected product name
   */
  async verifyProductName(expectedName: string) {
    await this.expectValueByTestId(this.PRODUCT_NAME_INPUT, expectedName);
  }

  // ====== Price Field ======

  /**
   * Fill price
   * @param price Price value (e.g., "19.99")
   */
  async fillPrice(price: string | number) {
    const priceStr = String(price);
    await this.waitForTestId(this.PRICE_INPUT);
    await this.fillByTestId(this.PRICE_INPUT, priceStr);
  }

  /**
   * Get the current price value
   */
  async getPrice() {
    return await this.getInputValueByTestId(this.PRICE_INPUT);
  }

  /**
   * Verify price has expected value
   * @param expectedPrice Expected price as string
   */
  async verifyPrice(expectedPrice: string) {
    await this.expectValueByTestId(this.PRICE_INPUT, expectedPrice);
  }

  /**
   * Clear price field (set to empty)
   */
  async clearPrice() {
    await this.getByTestId(this.PRICE_INPUT).clear();
  }

  // ====== Category Select ======

  /**
   * Open category select dropdown
   */
  async openCategorySelect() {
    await this.clickByTestId(this.CATEGORY_SELECT);
  }

  /**
   * Select a category by ID
   * @param categoryId Category ID number
   */
  async selectCategory(categoryId: number) {
    // Wait for select to be ready
    await this.waitForTestId(this.CATEGORY_SELECT);

    // Open dropdown if not already open
    await this.openCategorySelect();

    // Wait for option to appear and click it
    const optionTestId = `receipt-item-row-${this.itemIndex}-category-option-${categoryId}`;
    await this.waitForTestId(optionTestId);
    await this.clickByTestId(optionTestId);
  }

  /**
   * Get currently selected category text
   */
  async getSelectedCategory() {
    return await this.getTextByTestId(this.CATEGORY_SELECT);
  }

  /**
   * Verify a category option exists
   * @param categoryId Category ID number
   */
  async verifyCategoryOptionExists(categoryId: number) {
    const optionTestId = `receipt-item-row-${this.itemIndex}-category-option-${categoryId}`;
    await this.expectVisibleByTestId(optionTestId);
  }

  /**
   * Get all available category options
   * (Returns the locators for all category options)
   */
  async getCategoryOptions() {
    const selectTrigger = this.getByTestId(this.CATEGORY_SELECT);
    return selectTrigger.locator('[data-test-id*="category-option-"]');
  }

  // ====== Delete Functionality ======

  /**
   * Click delete button
   */
  async clickDeleteButton() {
    await this.clickByTestId(this.DELETE_BUTTON);
  }

  /**
   * Verify delete confirmation dialog is visible
   */
  async isDeleteDialogVisible() {
    return await this.isVisibleByTestId(this.DELETE_DIALOG);
  }

  /**
   * Wait for delete dialog to appear
   */
  async waitForDeleteDialog() {
    await this.waitForTestId(this.DELETE_DIALOG);
  }

  /**
   * Cancel item deletion
   */
  async cancelDeletion() {
    await this.clickByTestId(this.DELETE_DIALOG_CANCEL);
  }

  /**
   * Confirm item deletion
   */
  async confirmDeletion() {
    await this.clickByTestId(this.DELETE_DIALOG_CONFIRM);
  }

  /**
   * Delete item and confirm
   * (Convenience method that clicks delete and confirms)
   */
  async deleteItem() {
    await this.clickDeleteButton();
    await this.waitForDeleteDialog();
    await this.confirmDeletion();
  }

  /**
   * Try to delete but cancel
   * (Convenience method for deletion cancel scenario)
   */
  async tryDeleteButCancel() {
    await this.clickDeleteButton();
    await this.waitForDeleteDialog();
    await this.cancelDeletion();
  }

  /**
   * Verify dialog is closed
   */
  async verifyDeleteDialogClosed() {
    await this.expectHiddenByTestId(this.DELETE_DIALOG);
  }

  // ====== Composite Operations ======

  /**
   * Fill all item fields at once
   * @param productName Product name
   * @param price Price value
   * @param categoryId Category ID
   */
  async fillItemComplete(productName: string, price: string | number, categoryId: number) {
    await this.fillProductName(productName);
    await this.fillPrice(price);
    await this.selectCategory(categoryId);
  }

  /**
   * Verify all item fields have expected values
   * @param productName Expected product name
   * @param price Expected price
   */
  async verifyItemFields(productName: string, price: string) {
    await this.verifyProductName(productName);
    await this.verifyPrice(price);
  }

  /**
   * Get all item data as object
   */
  async getItemData() {
    return {
      productName: await this.getProductName(),
      price: await this.getPrice(),
      category: await this.getSelectedCategory(),
    };
  }
}
