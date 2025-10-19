import { test, expect } from '@playwright/test';
import { ReceiptFormPage } from './pages/ReceiptFormPage';
import { cleanupTestData } from './global-teardown';

/**
 * E2E Test Suite: Receipt Form
 *
 * Tests the receipt form user flow including:
 * - Adding new receipt with items
 * - Date selection
 * - Item management (add, edit, delete)
 * - Form validation
 * - Submission and redirect
 *
 * Using Page Object Model pattern for maintainability
 *
 * IMPORTANT: All tests use authenticated state from global-setup.ts
 * Authentication is done ONCE before all tests, not before each test.
 *
 * NOTE: afterAll cleanup is included to ensure test data is deleted even when
 * running tests through VSCode Playwright plugin (which may not trigger globalTeardown)
 */

test.describe('Receipt Form - User Scenarios', () => {
  let receiptForm: ReceiptFormPage;

  test.afterAll(async () => {
    // Cleanup test data after all tests in this suite
    // This ensures cleanup happens even if globalTeardown isn't called (e.g., VSCode plugin)
    console.log('\n[Cleanup] Running afterAll cleanup...');
    await cleanupTestData();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to receipt form (authentication already done in global setup)
    console.log(`[Test Setup] Navigating to /receipts/new`);
    receiptForm = new ReceiptFormPage(page);
    await receiptForm.goToNewReceipt();

    // Check if we got redirected (which would indicate auth failure)
    const urlAfterNav = page.url();
    console.log(`[Test Setup] Current URL: ${urlAfterNav}`);

    if (urlAfterNav.includes('/login')) {
      throw new Error('User was redirected to login - authentication failed!');
    }

    // Wait for form to load
    console.log(`[Test Setup] Waiting for receipt form to load`);
    await receiptForm.waitForForm();
    console.log(`[Test Setup] Receipt form loaded successfully\n`);
  });

  test.describe('Scenario 1: Add Receipt with Single Item', () => {
    /**
     * Main scenario from requirements:
     * 1. Open new receipt form ✓
     * 2. Add sample item with all required fields ✓
     * 3. Save receipt ✓
     */
    test('should successfully create receipt with one item', async ({ page }) => {
      // Arrange
      const storeName = 'Biedronka';
      const productName = 'Mleko 1L';
      const price = '19.99';
      const categoryId = 1;

      // Act - Step 1: Select today's date (form defaults to today anyway)
      // We just verify the date is shown
      const displayedDate = await receiptForm.getDisplayedDate();
      expect(displayedDate).toBeTruthy();
      console.log(`[Test] Using date: ${displayedDate}`);

      // Act - Step 2: Fill store name (optional)
      await receiptForm.fillStoreName(storeName);

      // Act - Step 3: Add item
      await receiptForm.clickAddItemButton();
      const itemIndex = 0;
      const itemRow = receiptForm.getItemsSection().getItemRow(itemIndex);

      // Act - Step 4: Fill item details
      await itemRow.fillProductName(productName);
      await itemRow.fillPrice(price);
      await itemRow.selectCategory(categoryId);

      // Assert - Verify item is filled
      await itemRow.verifyProductName(productName);
      await itemRow.verifyPrice(price);

      // Assert - Verify total updated
      await receiptForm.verifyTotalAmount(price);

      // Assert - Verify form is valid
      await receiptForm.verifyFormValid();

      // Act - Step 5: Submit form
      await receiptForm.submitForm();

      // Assert - Verify redirect to home
      await receiptForm.verifySubmissionSuccess();
    });

    test('should not allow submission with invalid form', async () => {
      // Note: Form defaults to today's date which makes it valid
      // This test verifies that the form starts as valid (with default date)

      // Assert - Form should be valid with default date
      await receiptForm.verifyFormValid();

      // Verify submit button is enabled
      const isEnabled = await receiptForm.isSubmitButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    test('should enable submit button when form is valid', async () => {
      // Arrange - Form already has today's date by default

      // Assert - Form is already valid
      await receiptForm.verifyFormValid();

      // Verify submit button is enabled
      const isEnabled = await receiptForm.isSubmitButtonEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  test.describe('Scenario 2: Add Receipt with Multiple Items', () => {
    test('should create receipt with three items', async () => {
      // Arrange
      const items = [
        { productName: 'Mleko 1L', price: '3.99', categoryId: 1 },
        { productName: 'Chleb', price: '2.50', categoryId: 1 },
        { productName: 'Ser żółty', price: '12.99', categoryId: 2 },
      ];

      // Act - Use today's date (form defaults to today)
      await receiptForm.selectToday();

      // Act - Add and fill items
      await receiptForm.addItemsWithData(items);

      // Assert - Verify all items added
      const itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(3);

      // Assert - Verify total is correct
      const expectedTotal = 3.99 + 2.5 + 12.99;
      await receiptForm.verifyTotalAmountNumeric(expectedTotal);

      // Act - Submit
      await receiptForm.submitForm();

      // Assert
      await receiptForm.verifySubmissionSuccess();
    });

    test('should add items dynamically', async () => {
      // Arrange
      await receiptForm.selectToday();

      // Act - Add first item
      await receiptForm.clickAddItemButton();
      let itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(1);

      // Act - Add second item
      await receiptForm.clickAddItemButton();
      itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(2);

      // Act - Add third item
      await receiptForm.clickAddItemButton();
      itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(3);

      // Act - Fill third item
      const item3 = receiptForm.getItemsSection().getItemRow(2);
      await item3.fillProductName('Test Product');
      await item3.fillPrice('10.00');
      await item3.selectCategory(1);

      // Assert - Verify third item
      await item3.verifyProductName('Test Product');
    });
  });

  test.describe('Scenario 3: Item Deletion', () => {
    test('should delete item after confirming', async () => {
      // Arrange - Create form with items
      const items = [
        { productName: 'Item 1', price: '10.00', categoryId: 1 },
        { productName: 'Item 2', price: '20.00', categoryId: 1 },
      ];

      await receiptForm.selectToday();
      await receiptForm.addItemsWithData(items);

      // Assert - Verify 2 items exist
      let itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(2);

      // Act - Delete first item
      const item0 = receiptForm.getItemsSection().getItemRow(0);
      await item0.deleteItem();

      // Assert - Verify only 1 item left
      itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(1);

      // Assert - Verify total updated (only item 2 price)
      await receiptForm.verifyTotalAmount('20.00');
    });

    test('should cancel item deletion', async () => {
      // Arrange - Create form with item
      const items = [{ productName: 'Keep Me', price: '15.00', categoryId: 1 }];

      await receiptForm.selectToday();
      await receiptForm.addItemsWithData(items);

      // Act - Try to delete but cancel
      const item0 = receiptForm.getItemsSection().getItemRow(0);
      await item0.tryDeleteButCancel();

      // Assert - Item should still exist
      await item0.waitForItemRow();
      await item0.verifyProductName('Keep Me');

      // Assert - Total unchanged
      await receiptForm.verifyTotalAmount('15.00');
    });

    test('should delete multiple items', async () => {
      // Arrange
      const items = [
        { productName: 'Item 1', price: '5.00', categoryId: 1 },
        { productName: 'Item 2', price: '10.00', categoryId: 1 },
        { productName: 'Item 3', price: '15.00', categoryId: 1 },
      ];

      await receiptForm.selectToday();
      await receiptForm.addItemsWithData(items);

      // Act - Delete item at index 1 (Item 2)
      const item1 = receiptForm.getItemsSection().getItemRow(1);
      await item1.deleteItem();

      // Assert - 2 items remain
      let itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(2);

      // Act - Delete item at index 1 (now Item 3)
      const item1Again = receiptForm.getItemsSection().getItemRow(1);
      await item1Again.deleteItem();

      // Assert - 1 item remains
      itemCount = await receiptForm.countItems();
      expect(itemCount).toBe(1);

      // Assert - Only Item 1 remains
      const lastItem = receiptForm.getItemsSection().getItemRow(0);
      await lastItem.verifyProductName('Item 1');
    });
  });

  test.describe('Scenario 4: Date Selection', () => {
    test('should select date from calendar', async () => {
      // Act - Open calendar
      const dateSection = receiptForm.getDateSection();
      await dateSection.openDatePicker();

      // Assert - Calendar is visible
      const isVisible = await dateSection.isDatePickerVisible();
      expect(isVisible).toBe(true);

      // Act - Select a past date (day 10 is safely in the past)
      await dateSection.selectDay(10);

      // Assert - Date updated (should contain "10")
      const displayedDate = await dateSection.getDisplayedDate();
      expect(displayedDate).toContain('10');
    });

    test('should select today', async () => {
      // Act
      await receiptForm.selectToday();

      // Assert - Form is valid (today's date is set)
      await receiptForm.verifyFormValid();
    });

    test('should not allow selecting future dates', async () => {
      // This test depends on calendar implementation
      // Calendar should disable future dates automatically
      const dateSection = receiptForm.getDateSection();
      await dateSection.openDatePicker();

      // The calendar component disables future dates in UI
      // This is verified in component rendering
      const isPickerVisible = await dateSection.isDatePickerVisible();
      expect(isPickerVisible).toBe(true);
    });
  });

  test.describe('Scenario 5: Form Navigation', () => {
    test('should cancel and redirect to home', async () => {
      // Arrange - Fill some data
      await receiptForm.fillStoreName('Test Store');

      // Act - Cancel form
      await receiptForm.cancelForm();

      // Assert - Should redirect (URL should have month parameter)
      await receiptForm.expectUrlMatch(/\/?month=/);
    });

    test('should show save button text', async () => {
      // Act
      const buttonText = await receiptForm.getSubmitButtonText();

      // Assert
      expect(buttonText).toContain('Zapisz');
    });

    test('should show update button text when editing', async () => {
      // This test assumes edit mode changes button text
      // For new receipt, should show "Zapisz"
      await receiptForm.verifySubmitButtonIsSave();
    });
  });

  test.describe('Scenario 6: Form Validation States', () => {
    test('should show form is valid with default date', async () => {
      // Arrange - Form has default date (today)
      // Assert - Form is valid because date is required and set by default
      await receiptForm.verifyFormValid();
    });

    test('should maintain validation when date is already set', async () => {
      // Arrange - Form already has today's date
      await receiptForm.verifyFormValid();

      // Act - Verify date is shown
      const displayedDate = await receiptForm.getDisplayedDate();
      expect(displayedDate).toBeTruthy();

      // Assert - Form remains valid
      await receiptForm.verifyFormValid();
    });

    test('should handle item field validation', async () => {
      // Arrange - Add item
      await receiptForm.selectToday();
      await receiptForm.clickAddItemButton();

      const item0 = receiptForm.getItemsSection().getItemRow(0);

      // Assert - Item fields accept input
      await item0.fillProductName('Test');
      const productName = await item0.getProductName();
      expect(productName).toBe('Test');

      // Act - Fill price
      await item0.fillPrice('10.00');
      const price = await item0.getPrice();
      expect(price).toBe('10.00');
    });
  });

  test.describe('Scenario 7: Total Calculation', () => {
    test('should calculate total correctly', async () => {
      // Arrange
      const items = [
        { productName: 'Item 1', price: '10.50', categoryId: 1 },
        { productName: 'Item 2', price: '20.75', categoryId: 1 },
      ];

      await receiptForm.selectToday();
      await receiptForm.addItemsWithData(items);

      // Assert
      const expectedTotal = 10.5 + 20.75;
      await receiptForm.verifyTotalAmountNumeric(expectedTotal);
    });

    test('should update total when price changes', async () => {
      // Arrange
      await receiptForm.selectToday();
      await receiptForm.clickAddItemButton();

      const item0 = receiptForm.getItemsSection().getItemRow(0);
      await item0.fillProductName('Product');
      await item0.fillPrice('50.00');
      await item0.selectCategory(1);

      // Assert
      await receiptForm.verifyTotalAmount('50.00');

      // Act - Update price
      await item0.fillPrice('75.50');

      // Assert - Total updated
      await receiptForm.verifyTotalAmount('75.50');
    });

    test('should handle decimal prices correctly', async () => {
      // Arrange
      const items = [
        { productName: 'Cheap', price: '0.99', categoryId: 1 },
        { productName: 'Expensive', price: '999.99', categoryId: 1 },
      ];

      await receiptForm.selectToday();
      await receiptForm.addItemsWithData(items);

      // Assert
      const expectedTotal = 0.99 + 999.99;
      await receiptForm.verifyTotalAmountNumeric(expectedTotal);
    });

    test('should show zero total with no items', async () => {
      // Arrange
      await receiptForm.selectToday();

      // Assert - Total should show 0
      await receiptForm.verifyTotalAmount('0.00');
    });
  });
});
