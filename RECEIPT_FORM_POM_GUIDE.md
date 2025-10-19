# Receipt Form - Page Object Model (POM) Guide

## Overview

This guide documents the Page Object Model implementation for testing the Receipt Form feature using Playwright E2E tests.

**Location:** `src/__tests__/e2e/pages/`

**Main Components:**
- `BasePage.ts` - Base class with common methods and data-testid helpers
- `ReceiptFormPage.ts` - Main receipt form page object
- `ReceiptDateSection.ts` - Date picker section
- `ReceiptItemsSection.ts` - Items management section
- `ReceiptItemRowSection.ts` - Individual item row

**Test Suite:** `src/__tests__/e2e/receipt-form.spec.ts`

---

## Architecture Overview

```
BasePage (Abstract)
    ↓
ReceiptFormPage (Main Page Object)
    ├─ ReceiptDateSection (Composition)
    └─ ReceiptItemsSection (Composition)
        └─ ReceiptItemRowSection (Per Item)
```

### Pattern Benefits

- **Maintainability**: Changes to UI selectors only need to update one place
- **Readability**: Tests read like business logic, not technical selectors
- **Reusability**: Common methods in BasePage, specific logic in sub-sections
- **Encapsulation**: Each section handles its own concerns
- **Type Safety**: Full TypeScript support with IDE autocomplete

---

## BasePage - Utility Base Class

**File:** [BasePage.ts](src/__tests__/e2e/pages/BasePage.ts)

Core functionality provided by BasePage:

### Navigation Methods

```typescript
async goto(path: string = '/');          // Navigate to URL
async getTitle();                        // Get page title
async waitForLoadState(state);           // Wait for page load state
async screenshot(name: string);          // Take screenshot
```

### data-testid Based Methods (Preferred)

```typescript
// Locators
protected getByTestId(testId: string);   // Get locator by test ID

// Actions
async clickByTestId(testId: string);
async fillByTestId(testId: string, text: string);

// Queries
async getTextByTestId(testId: string);
async isVisibleByTestId(testId: string);
async isEnabledByTestId(testId: string);
async getInputValueByTestId(testId: string);

// Waits
async waitForTestId(testId: string);

// Assertions (expect methods)
async expectVisibleByTestId(testId: string);
async expectHiddenByTestId(testId: string);
async expectEnabledByTestId(testId: string);
async expectDisabledByTestId(testId: string);
async expectTextByTestId(testId: string, text);
async expectValueByTestId(testId: string, value);

// Navigation assertions
async expectUrlMatch(urlPattern);
async waitForNavigation();
```

**Usage Example:**

```typescript
// Old way (brittle CSS selectors)
await page.click('.receipt-form button[type="submit"]');

// New way (using data-testid)
await receiptForm.clickByTestId('receipt-submit-button');
```

---

## ReceiptFormPage - Main Page Object

**File:** [ReceiptFormPage.ts](src/__tests__/e2e/pages/ReceiptFormPage.ts)

Main entry point for testing the entire receipt form.

### Composition

```typescript
constructor(page: Page) {
  this.dateSection = new ReceiptDateSection(page);
  this.itemsSection = new ReceiptItemsSection(page);
}
```

### Navigation

```typescript
// Navigate to new receipt form
async goToNewReceipt();

// Navigate to edit existing receipt
async goToEditReceipt(receiptId: string);

// Verify form is loaded
async isFormVisible();
async waitForForm();
```

### Section Access

```typescript
// Get sub-section objects for detailed control
getDateSection(): ReceiptDateSection;
getItemsSection(): ReceiptItemsSection;

// Convenience methods that delegate to sub-sections
async openDatePicker();
async selectDate(dateString: string);
async selectToday();
async getDisplayedDate();
async clickAddItemButton();
async addItemWithData(productName, price, categoryId);
async countItems();
```

### Store Name Field

```typescript
async fillStoreName(storeName: string);
async getStoreName(): string;
async verifyStoreName(expectedName: string);
async clearStoreName();
```

### Total Section

```typescript
async getTotalAmount(): string;              // "19.99 zł"
async verifyTotalAmount(expectedAmount);     // "19.99" or RegExp
async getTotalAmountNumeric(): number;       // 19.99
async verifyTotalAmountNumeric(expectedAmount: number);
```

### Form Validation

```typescript
async isSubmitButtonEnabled(): boolean;
async isSubmitButtonDisabled(): boolean;
async verifyFormValid();
async verifyFormInvalid();
async waitForFormValid();
```

### Form Actions

```typescript
async clickCancelButton();
async clickSubmitButton();
async submitForm();
async cancelForm();
async getSubmitButtonText(): string;
async verifySubmitButtonIsSave();           // "Zapisz"
async verifySubmitButtonIsUpdate();         // "Zaktualizuj"
async isSubmitButtonLoading(): boolean;
```

### Complete Workflows

```typescript
// Fill entire form at once
async fillForm(data: {
  date?: string;
  storeName?: string;
  items?: Array<{productName, price, categoryId}>;
});

// Create receipt with data and submit
async createReceipt(data: {
  date?: string;
  storeName?: string;
  items: Array<{productName, price, categoryId}>;
});

// Create with minimum required fields
async createMinimalReceipt(date?: string);

// Verify successful submission
async verifySubmissionSuccess();

// Take form screenshot
async takeFormScreenshot(name: string);
```

### Example Usage

```typescript
test('should create receipt', async ({ page }) => {
  const receiptForm = new ReceiptFormPage(page);

  // Navigate and wait
  await receiptForm.goToNewReceipt();
  await receiptForm.waitForForm();

  // Fill form
  await receiptForm.selectToday();
  await receiptForm.fillStoreName('Biedronka');
  await receiptForm.addItemWithData('Mleko', '3.99', 1);

  // Verify
  await receiptForm.verifyFormValid();
  await receiptForm.verifyTotalAmount('3.99');

  // Submit
  await receiptForm.submitForm();
  await receiptForm.verifySubmissionSuccess();
});
```

---

## ReceiptDateSection - Date Picker

**File:** [ReceiptDateSection.ts](src/__tests__/e2e/pages/ReceiptDateSection.ts)

Handles date picker interaction and date selection.

### Methods

```typescript
// Opening/closing
async openDatePicker();
async closeDatePicker();
async isDatePickerVisible(): boolean;
async verifyDatePickerClosed();
async waitForDateCalendar();

// Selection
async selectDay(day: number);                  // 1-31
async selectDate(dateString: string);          // "2024-10-15"
async selectToday();
async selectRelativeDate(daysOffset: number);  // -1 for yesterday

// Verification
async getDisplayedDate(): string;
async verifyDisplayedDate(dateText: string);
```

### Example Usage

```typescript
const dateSection = receiptForm.getDateSection();

// Select specific date
await dateSection.selectDate('2024-10-15');

// Select relative to today
await dateSection.selectRelativeDate(-1);  // Yesterday

// Verify displayed
const date = await dateSection.getDisplayedDate();
expect(date).toContain('15');
```

---

## ReceiptItemsSection - Items Management

**File:** [ReceiptItemsSection.ts](src/__tests__/e2e/pages/ReceiptItemsSection.ts)

Manages the collection of receipt items.

### Methods

```typescript
// Section visibility
async isItemsSectionVisible(): boolean;
async waitForItemsSection();

// Adding items
async clickAddItemButton();
async addItem();
async addItems(count: number);
async addItemWithData(productName, price, categoryId);
async addItemsWithData(items: Array<{productName, price, categoryId}>);

// Item access
getItemRow(index: number): ReceiptItemRowSection;

// List queries
async isItemsListVisible(): boolean;
async waitForItemsList();
async verifyItemVisible(index: number);
async countItems(): number;
async verifyItemCount(expectedCount: number);

// Item data
async getAllItemsData();

// Cleanup
async deleteAllItems();
```

### Example Usage

```typescript
const itemsSection = receiptForm.getItemsSection();

// Add multiple items at once
const items = [
  { productName: 'Mleko', price: '3.99', categoryId: 1 },
  { productName: 'Chleb', price: '2.50', categoryId: 1 },
  { productName: 'Ser', price: '12.99', categoryId: 2 },
];
await itemsSection.addItemsWithData(items);

// Verify count
const count = await itemsSection.countItems();
expect(count).toBe(3);

// Get specific item
const item0 = itemsSection.getItemRow(0);
await item0.fillProductName('New Name');

// Get all data
const allData = await itemsSection.getAllItemsData();
```

---

## ReceiptItemRowSection - Individual Item

**File:** [ReceiptItemRowSection.ts](src/__tests__/e2e/pages/ReceiptItemRowSection.ts)

Handles individual receipt item form fields.

### Methods

#### Visibility

```typescript
async isItemRowVisible(): boolean;
async waitForItemRow();
```

#### Product Name

```typescript
async fillProductName(productName: string);
async getProductName(): string;
async verifyProductName(expectedName: string);
```

#### Price

```typescript
async fillPrice(price: string | number);
async getPrice(): string;
async verifyPrice(expectedPrice: string);
async clearPrice();
```

#### Category

```typescript
async openCategorySelect();
async selectCategory(categoryId: number);
async getSelectedCategory(): string;
async verifyCategoryOptionExists(categoryId: number);
```

#### Deletion

```typescript
async clickDeleteButton();
async isDeleteDialogVisible(): boolean;
async waitForDeleteDialog();
async cancelDeletion();
async confirmDeletion();
async deleteItem();                    // Click + confirm
async tryDeleteButCancel();            // Click + cancel
async verifyDeleteDialogClosed();
```

#### Composite Operations

```typescript
async fillItemComplete(productName, price, categoryId);
async verifyItemFields(productName, price);
async getItemData(): Object;
```

### Example Usage

```typescript
const item0 = itemsSection.getItemRow(0);

// Fill all fields
await item0.fillItemComplete('Mleko 1L', '19.99', 1);

// Verify values
await item0.verifyProductName('Mleko 1L');
await item0.verifyPrice('19.99');

// Delete with confirmation
await item0.deleteItem();

// Delete with cancel
await item0.tryDeleteButCancel();

// Get all data
const data = await item0.getItemData();
// { productName: 'Mleko 1L', price: '19.99', category: 'Mleczne' }
```

---

## Writing Tests with POM

### Test Structure (Arrange, Act, Assert)

```typescript
test('should create receipt with item', async ({ page }) => {
  // Arrange - Create page object and navigate
  const receiptForm = new ReceiptFormPage(page);
  await receiptForm.goToNewReceipt();
  await receiptForm.waitForForm();

  // Act - Perform user actions
  await receiptForm.selectToday();
  await receiptForm.fillStoreName('Biedronka');
  await receiptForm.addItemWithData('Mleko', '3.99', 1);

  // Assert - Verify expected outcomes
  await receiptForm.verifyFormValid();
  await receiptForm.verifyTotalAmount('3.99');

  // Act - Continue with more actions
  await receiptForm.submitForm();

  // Assert - Final verification
  await receiptForm.verifySubmissionSuccess();
});
```

### Best Practices

#### 1. Use High-Level Methods

```typescript
// ✓ Good - Uses high-level methods
await receiptForm.createReceipt({
  date: '2024-10-15',
  storeName: 'Biedronka',
  items: [{ productName: 'Mleko', price: '3.99', categoryId: 1 }],
});

// ✗ Avoid - Direct page interaction
await page.click('[data-testid="receipt-date-trigger"]');
await page.fill('[data-testid="receipt-store-name-input"]', 'Biedronka');
```

#### 2. Test Business Logic, Not Implementation

```typescript
// ✓ Good - Tests the user workflow
test('should create receipt and redirect', async ({ page }) => {
  const form = new ReceiptFormPage(page);
  await form.goToNewReceipt();
  await form.createReceipt({ items: [/*...*/] });
  await form.verifySubmissionSuccess();
});

// ✗ Avoid - Tests internal implementation
test('should set form state', async ({ page }) => {
  // Testing React state instead of user behavior
});
```

#### 3. Use Composition Over Inheritance

```typescript
// ✓ Good - Use sub-sections
const dateSection = receiptForm.getDateSection();
await dateSection.selectDate('2024-10-15');

// Rather than spreading all methods in main object
```

#### 4. Encapsulate Complex Workflows

```typescript
// ✓ Good - Complex workflow is a single method
await receiptForm.createReceipt({ /* ... */ });

// ✗ Avoid - Repeating workflow steps in each test
await receiptForm.selectDate(...);
await receiptForm.fillStoreName(...);
await receiptForm.addItems(...);
await receiptForm.fillItem(...);
```

#### 5. Use Data-Testid Only

```typescript
// ✓ Good - Resilient to UI changes
await receiptForm.clickByTestId('receipt-submit-button');

// ✗ Avoid - Brittle selectors
await page.click('button:has-text("Zapisz")');
await page.click('.form-actions button:last-child');
```

---

## Test Scenarios Covered

### [receipt-form.spec.ts](src/__tests__/e2e/receipt-form.spec.ts)

The test suite includes 7 main scenario groups with 20+ individual tests:

**Scenario 1: Add Receipt with Single Item**
- ✓ Create receipt with one item successfully
- ✓ Prevent submission with invalid form
- ✓ Enable submit when form becomes valid

**Scenario 2: Add Receipt with Multiple Items**
- ✓ Create receipt with three items
- ✓ Add items dynamically

**Scenario 3: Item Deletion**
- ✓ Delete item after confirming
- ✓ Cancel item deletion
- ✓ Delete multiple items

**Scenario 4: Date Selection**
- ✓ Select date from calendar
- ✓ Select today
- ✓ Prevent selecting future dates

**Scenario 5: Form Navigation**
- ✓ Cancel and redirect to home
- ✓ Show save button text
- ✓ Show update button text when editing

**Scenario 6: Form Validation States**
- ✓ Show errors for empty fields
- ✓ Update validation on field changes
- ✓ Handle item field validation

**Scenario 7: Total Calculation**
- ✓ Calculate total correctly
- ✓ Update total when price changes
- ✓ Handle decimal prices
- ✓ Show zero total with no items

---

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npm run test:e2e receipt-form
```

### Run Specific Test

```bash
npx playwright test receipt-form.spec.ts -g "should create receipt"
```

### Run in UI Mode (Recommended for Development)

```bash
npx playwright test receipt-form.spec.ts --ui
```

### Debug Single Test

```bash
npx playwright test receipt-form.spec.ts -g "specific test" --debug
```

### Show Test Report

```bash
npx playwright show-report
```

---

## Migration Guide: Adding to Existing Tests

### Step 1: Import Page Object

```typescript
import { ReceiptFormPage } from './pages/ReceiptFormPage';
```

### Step 2: Create Instance

```typescript
test.beforeEach(async ({ page }) => {
  receiptForm = new ReceiptFormPage(page);
  await receiptForm.goToNewReceipt();
  await receiptForm.waitForForm();
});
```

### Step 3: Use Methods Instead of Direct selectors

**Before:**
```typescript
await page.click('[data-testid="receipt-add-item-button"]');
await page.fill('[data-testid="receipt-item-row-0-product-name-input"]', 'Mleko');
await page.click('[data-testid="receipt-submit-button"]');
```

**After:**
```typescript
await receiptForm.clickAddItemButton();
const item = receiptForm.getItemsSection().getItemRow(0);
await item.fillProductName('Mleko');
await receiptForm.submitForm();
```

---

## Extending the POM

### Adding New Sub-Section

1. Create new file: `src/__tests__/e2e/pages/NewSection.ts`
2. Extend `BasePage`
3. Implement specific methods
4. Add to main page object composition

```typescript
export class NewSection extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async someMethod() {
    await this.clickByTestId('test-id');
  }
}
```

### Adding New Methods to Existing Section

Simply add methods following the pattern:

```typescript
async methodName() {
  // Use this.clickByTestId, this.fillByTestId, etc.
  await this.clickByTestId('some-test-id');
}
```

### Adding New Test IDs

1. Add `data-test-id` to component in `src/components/`
2. Create method in corresponding POM class
3. Add test coverage in `receipt-form.spec.ts`

---

## Troubleshooting

### Locator Not Found

```
Error: locator.click: Target page, context or browser has been closed
```

**Solution:** Ensure page is navigated and form is loaded:
```typescript
await receiptForm.goToNewReceipt();
await receiptForm.waitForForm();
```

### Timeout Waiting for Element

```
Error: Target page, context or browser has been closed
```

**Solution:** Use explicit waits:
```typescript
await receiptForm.waitForItemsList();
await receiptForm.getItemsSection().waitForItemRow();
```

### Test Data Inconsistency

**Solution:** Use fresh page object instance per test:
```typescript
test.beforeEach(async ({ page }) => {
  receiptForm = new ReceiptFormPage(page);
  // Fresh instance for each test
});
```

---

## Performance Tips

1. **Use High-Level Methods** - Reduces number of interactions
2. **Parallel Execution** - Tests run independently
3. **Shared Browser Context** - Tests can share browser context
4. **Selective Screenshots** - Only on failures or specific steps

---

## Version History

- **v1.0** (2024-10-19)
  - Initial POM implementation
  - 5 main page object classes
  - 20+ test scenarios
  - Full API documentation

---

## Related Files

- [RECEIPT_FORM_TEST_IDS.md](RECEIPT_FORM_TEST_IDS.md) - Test ID documentation
- [RECEIPT_FORM_TEST_IDS_MAP.txt](RECEIPT_FORM_TEST_IDS_MAP.txt) - Test ID hierarchy map
- [.ai/rules/playwright-e2e-testing.md](.ai/rules/playwright-e2e-testing.md) - E2E testing guidelines

---

## Questions & Support

For questions about the POM pattern or specific tests, refer to:
1. Individual class documentation (comments in source files)
2. Test examples in `receipt-form.spec.ts`
3. Playwright documentation: https://playwright.dev/docs/pom
