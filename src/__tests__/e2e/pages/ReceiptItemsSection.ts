import { BasePage } from "./BasePage";
import { ReceiptItemRowSection } from "./ReceiptItemRowSection";

/**
 * Receipt Items Section
 * Manages the collection of receipt items and item operations
 *
 * Test IDs:
 * - receipt-items-section: Items section container
 * - receipt-add-item-button: Button to add new item
 * - receipt-items-list: Container for all item rows
 */
export class ReceiptItemsSection extends BasePage {
  // Test ID constants
  private readonly ITEMS_SECTION = "receipt-items-section";
  private readonly ADD_ITEM_BUTTON = "receipt-add-item-button";
  private readonly ITEMS_LIST = "receipt-items-list";

  /**
   * Verify items section is visible
   */
  async isItemsSectionVisible() {
    return await this.isVisibleByTestId(this.ITEMS_SECTION);
  }

  /**
   * Wait for items section
   */
  async waitForItemsSection() {
    await this.waitForTestId(this.ITEMS_SECTION);
  }

  // ====== Add Item Operations ======

  /**
   * Click "Add Item" button and wait for item to be added
   */
  async clickAddItemButton() {
    // Get current count before clicking
    const beforeCount = await this.countItems();

    // Click the button
    await this.clickByTestId(this.ADD_ITEM_BUTTON);

    // Wait for the new item row to appear
    // The new item will have index = beforeCount
    const newItemTestId = `receipt-item-row-${beforeCount}`;

    try {
      await this.page.getByTestId(newItemTestId).waitFor({ state: "visible", timeout: 5000 });
    } catch {
      // Debug: Take screenshot for debugging
      await this.page.screenshot({ path: `./test-results/add-item-failed-${Date.now()}.png` });
      console.error(`[ItemsSection] Failed to add item. Expected ${newItemTestId} to appear.`);
      throw new Error(`Failed to add item row ${beforeCount}. Item did not appear after clicking add button.`);
    }
  }

  /**
   * Add a new item and return the item row section
   * @returns ReceiptItemRowSection for the newly added item (index 0 or next available)
   */
  async addItem() {
    await this.clickAddItemButton();
    // Return a new item section for index 0 (you may need to adjust based on current count)
    return new ReceiptItemRowSection(this.page, 0);
  }

  /**
   * Add multiple items
   * @param count Number of items to add
   * @returns Array of ReceiptItemRowSection objects
   */
  async addItems(count: number) {
    const items: ReceiptItemRowSection[] = [];
    for (let i = 0; i < count; i++) {
      await this.clickAddItemButton();
      items.push(new ReceiptItemRowSection(this.page, i));
    }
    return items;
  }

  /**
   * Get item row section by index
   * @param index Zero-based index of the item
   * @returns ReceiptItemRowSection for the item at given index
   */
  getItemRow(index: number) {
    return new ReceiptItemRowSection(this.page, index);
  }

  /**
   * Verify items list is visible
   * (visible when at least one item exists)
   */
  async isItemsListVisible() {
    return await this.isVisibleByTestId(this.ITEMS_LIST);
  }

  /**
   * Wait for items list to appear
   */
  async waitForItemsList() {
    await this.waitForTestId(this.ITEMS_LIST);
  }

  /**
   * Verify item at index is visible
   * @param index Zero-based index of the item
   */
  async verifyItemVisible(index: number) {
    const itemRow = this.getItemRow(index);
    await itemRow.waitForItemRow();
  }

  /**
   * Count visible items in the list
   * (Note: This counts items by checking if item-row-{index} exists)
   * @returns Number of visible items
   */
  async countItems() {
    let count = 0;
    let itemVisible = true;

    while (itemVisible) {
      const itemRow = this.getItemRow(count);
      itemVisible = await itemRow.isItemRowVisible();
      if (itemVisible) {
        count++;
      }
    }

    return count;
  }

  /**
   * Verify specific number of items exist
   * @param expectedCount Expected number of items
   */
  async verifyItemCount(expectedCount: number) {
    const count = await this.countItems();
    if (count !== expectedCount) {
      throw new Error(`Expected ${expectedCount} items, but found ${count}`);
    }
  }

  // ====== Composite Operations ======

  /**
   * Add item with all fields filled
   * @param productName Product name
   * @param price Price value
   * @param categoryId Category ID
   * @returns The added item row section
   */
  async addItemWithData(productName: string, price: string | number, categoryId: number) {
    const itemIndex = await this.countItems();
    await this.clickAddItemButton();

    const itemRow = new ReceiptItemRowSection(this.page, itemIndex);
    await itemRow.waitForItemRow();
    await itemRow.fillItemComplete(productName, price, categoryId);

    return itemRow;
  }

  /**
   * Add multiple items with data
   * @param items Array of item data {productName, price, categoryId}
   */
  async addItemsWithData(
    items: {
      productName: string;
      price: string | number;
      categoryId: number;
    }[]
  ) {
    const addedItems: ReceiptItemRowSection[] = [];

    for (const item of items) {
      const itemIndex = await this.countItems();
      await this.clickAddItemButton();

      const itemRow = new ReceiptItemRowSection(this.page, itemIndex);
      await itemRow.waitForItemRow();
      await itemRow.fillItemComplete(item.productName, item.price, item.categoryId);

      addedItems.push(itemRow);
    }

    return addedItems;
  }

  /**
   * Delete all items
   * (Useful for cleanup or testing deletion workflow)
   */
  async deleteAllItems() {
    let count = await this.countItems();
    while (count > 0) {
      const itemRow = this.getItemRow(0);
      await itemRow.deleteItem();
      count = await this.countItems();
    }
  }

  /**
   * Get data from all items
   * @returns Array of item data objects
   */
  async getAllItemsData() {
    const count = await this.countItems();
    const itemsData = [];

    for (let i = 0; i < count; i++) {
      const itemRow = this.getItemRow(i);
      const data = await itemRow.getItemData();
      itemsData.push(data);
    }

    return itemsData;
  }
}
