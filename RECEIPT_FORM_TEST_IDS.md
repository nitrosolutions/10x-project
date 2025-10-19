# Receipt Form - Test IDs Documentation

## Overview
This document provides a comprehensive guide to the `data-test-id` attributes added to the Receipt Form components for testing the scenario:
1. Open new receipt form
2. Add sample item with all required fields
3. Save receipt

## Components Updated
- [ReceiptForm.tsx](src/components/receipts/ReceiptForm.tsx)
- [ReceiptItemRow.tsx](src/components/receipts/ReceiptItemRow.tsx)

---

## Test Scenario Flow

```
User Journey:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Open Receipt Form (new receipt view)                         │
│    └─> receipt-form-container                                  │
│                                                                 │
│ 2. Fill Receipt Date (required)                                │
│    └─> receipt-date-trigger → receipt-date-calendar           │
│                                                                 │
│ 3. Fill Store Name (optional)                                  │
│    └─> receipt-store-name-input                               │
│                                                                 │
│ 4. Add Receipt Item                                            │
│    └─> receipt-add-item-button                                │
│                                                                 │
│ 5. Fill Item Details (required)                               │
│    └─> receipt-item-row-0                                     │
│       ├─> receipt-item-row-0-product-name-input              │
│       ├─> receipt-item-row-0-price-input                     │
│       └─> receipt-item-row-0-category-select                 │
│           └─> receipt-item-row-0-category-option-{id}        │
│                                                                 │
│ 6. Verify Total Calculation                                   │
│    └─> receipt-total → receipt-total-amount                   │
│                                                                 │
│ 7. Submit Receipt                                             │
│    └─> receipt-submit-button                                 │
│                                                                 │
│ Alternative: Cancel Receipt                                  │
│    └─> receipt-cancel-button                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## ReceiptForm.tsx - Test IDs

### Container & Form Structure

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Main container div | `receipt-form-container` | Container for entire form | Top-level element |
| Form element | `receipt-form` | Form wrapper | Contains all form fields |

### Date Field Section

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Date trigger button | `receipt-date-trigger` | Button to open date picker | Shows formatted date |
| Date calendar popover | `receipt-date-calendar` | Calendar component | Contains date selection |

**Test Example:**
```javascript
// Open date picker
await page.click('[data-test-id="receipt-date-trigger"]');

// Calendar appears
await expect(page.locator('[data-test-id="receipt-date-calendar"]')).toBeVisible();

// Select date (calendar has native date buttons)
await page.click('button[name="day"]:has-text("15")'); // Select 15th
```

### Store Name Field

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Store name input | `receipt-store-name-input` | Text input for store | Optional field |

**Test Example:**
```javascript
// Fill store name
await page.fill('[data-test-id="receipt-store-name-input"]', 'Biedronka');

// Verify value
await expect(page.locator('[data-test-id="receipt-store-name-input"]')).toHaveValue('Biedronka');
```

### Items Section

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Items container section | `receipt-items-section` | Section wrapper | Contains items list and add button |
| Add item button | `receipt-add-item-button` | Button to add new item | Variant: outline |
| Items list wrapper | `receipt-items-list` | Container for item rows | Visible only when items exist |
| Item row (dynamic) | `receipt-item-row-{index}` | Individual item container | Example: `receipt-item-row-0`, `receipt-item-row-1` |

**Test Example:**
```javascript
// Click add item button
await page.click('[data-test-id="receipt-add-item-button"]');

// Verify items list appears
await expect(page.locator('[data-test-id="receipt-items-list"]')).toBeVisible();

// Verify first item row appears
await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();
```

### Total Section

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Total container | `receipt-total` | Total section wrapper | Shows "Suma:" label |
| Total amount | `receipt-total-amount` | Amount value | Formatted: "XX.XX zł" |

**Test Example:**
```javascript
// Verify total displays
const totalAmount = page.locator('[data-test-id="receipt-total-amount"]');
await expect(totalAmount).toContainText('zł');

// Check total value
const totalText = await totalAmount.textContent();
expect(parseFloat(totalText)).toBe(19.99);
```

### Action Buttons

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Cancel button | `receipt-cancel-button` | Redirects to home | Variant: outline |
| Submit button | `receipt-submit-button` | Saves/Updates receipt | Disabled if form invalid |

**Test Example:**
```javascript
// Verify submit button is disabled initially
await expect(page.locator('[data-test-id="receipt-submit-button"]')).toBeDisabled();

// Fill required fields...

// Submit button enabled
await expect(page.locator('[data-test-id="receipt-submit-button"]')).toBeEnabled();

// Click submit
await page.click('[data-test-id="receipt-submit-button"]');
```

---

## ReceiptItemRow.tsx - Test IDs

### Item Row Container

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Item row wrapper | `receipt-item-row-{index}` | Container for item fields | Passed from ReceiptForm |

**Note:** `{index}` is replaced with actual index (0, 1, 2, etc.)

### Product Name Field

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Product name input | `{item-id}-product-name-input` | Text input for product name | Required field |

**Example:** `receipt-item-row-0-product-name-input`

**Test Example:**
```javascript
// Fill product name
await page.fill('[data-test-id="receipt-item-row-0-product-name-input"]', 'Mleko');

// Verify value
await expect(page.locator('[data-test-id="receipt-item-row-0-product-name-input"]')).toHaveValue('Mleko');
```

### Price Field

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Price input | `{item-id}-price-input` | Number input for price | Required field, min 0 |

**Example:** `receipt-item-row-0-price-input`

**Test Example:**
```javascript
// Fill price
await page.fill('[data-test-id="receipt-item-row-0-price-input"]', '19.99');

// Verify value
await expect(page.locator('[data-test-id="receipt-item-row-0-price-input"]')).toHaveValue('19.99');

// Verify total updates
await expect(page.locator('[data-test-id="receipt-total-amount"]')).toContainText('19.99');
```

### Category Select Field

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Category select trigger | `{item-id}-category-select` | Button to open category dropdown | Required field |
| Category option (dynamic) | `{item-id}-category-option-{cat-id}` | Individual category option | Example: `receipt-item-row-0-category-option-1` |

**Examples:**
- `receipt-item-row-0-category-select`
- `receipt-item-row-0-category-option-1`
- `receipt-item-row-0-category-option-2`

**Test Example:**
```javascript
// Open category select
await page.click('[data-test-id="receipt-item-row-0-category-select"]');

// Click category option (assuming category ID is 2)
await page.click('[data-test-id="receipt-item-row-0-category-option-2"]');

// Verify selection
await expect(page.locator('[data-test-id="receipt-item-row-0-category-select"]')).toContainText('Kategoria');
```

### Delete Button

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Delete button | `{item-id}-delete-button` | Trash icon button | Only visible if `canRemove=true` |

**Example:** `receipt-item-row-0-delete-button`

**Test Example:**
```javascript
// Click delete button
await page.click('[data-test-id="receipt-item-row-0-delete-button"]');

// Verify dialog opens
await expect(page.locator('[data-test-id="receipt-item-row-0-delete-dialog"]')).toBeVisible();
```

### Delete Confirmation Dialog

| Element | Test ID | Purpose | Notes |
|---------|---------|---------|-------|
| Dialog content | `{item-id}-delete-dialog` | Alert dialog for deletion confirmation | Shows on delete click |
| Cancel button | `{item-id}-delete-dialog-cancel` | Cancels deletion | Closes dialog |
| Confirm button | `{item-id}-delete-dialog-confirm` | Confirms deletion | Removes item from list |

**Examples:**
- `receipt-item-row-0-delete-dialog`
- `receipt-item-row-0-delete-dialog-cancel`
- `receipt-item-row-0-delete-dialog-confirm`

**Test Example:**
```javascript
// Click delete button
await page.click('[data-test-id="receipt-item-row-0-delete-button"]');

// Dialog appears
await expect(page.locator('[data-test-id="receipt-item-row-0-delete-dialog"]')).toBeVisible();

// Option 1: Cancel deletion
await page.click('[data-test-id="receipt-item-row-0-delete-dialog-cancel"]');
await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();

// Option 2: Confirm deletion
await page.click('[data-test-id="receipt-item-row-0-delete-button"]');
await page.click('[data-test-id="receipt-item-row-0-delete-dialog-confirm"]');
await expect(page.locator('[data-test-id="receipt-item-row-0"]')).not.toBeVisible();
```

---

## Complete E2E Test Scenario

### Main Scenario: Add Receipt with Item

```javascript
import { test, expect } from '@playwright/test';

test('should add receipt with item and save successfully', async ({ page }) => {
  // Navigate to new receipt page
  await page.goto('/receipts/new');

  // Verify form loads
  await expect(page.locator('[data-test-id="receipt-form"]')).toBeVisible();

  // ✓ Step 1: Fill Purchase Date
  await page.click('[data-test-id="receipt-date-trigger"]');
  await expect(page.locator('[data-test-id="receipt-date-calendar"]')).toBeVisible();
  // Select 15th of current month (adjust selector based on actual calendar)
  await page.click('button:has-text("15")');

  // ✓ Step 2: Fill Store Name (optional)
  await page.fill('[data-test-id="receipt-store-name-input"]', 'Biedronka');

  // ✓ Step 3: Add Item
  await page.click('[data-test-id="receipt-add-item-button"]');
  await expect(page.locator('[data-test-id="receipt-items-list"]')).toBeVisible();
  await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();

  // ✓ Step 4: Fill Item Details
  // 4a. Product Name
  await page.fill(
    '[data-test-id="receipt-item-row-0-product-name-input"]',
    'Mleko 1L'
  );

  // 4b. Price
  await page.fill(
    '[data-test-id="receipt-item-row-0-price-input"]',
    '3.99'
  );

  // 4c. Category
  await page.click('[data-test-id="receipt-item-row-0-category-select"]');
  // Assuming category with id=1 exists
  await page.click('[data-test-id="receipt-item-row-0-category-option-1"]');

  // ✓ Step 5: Verify Total
  const totalAmount = await page.locator('[data-test-id="receipt-total-amount"]').textContent();
  expect(totalAmount).toContain('3.99 zł');

  // ✓ Step 6: Submit Form
  const submitButton = page.locator('[data-test-id="receipt-submit-button"]');
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // ✓ Verify Success
  // Should redirect to home page with month parameter
  await expect(page).toHaveURL(/\/?month=\d{4}-\d{2}/);
});
```

### Alternative Scenarios

#### Scenario 2: Delete Item Before Saving
```javascript
test('should delete item and update total', async ({ page }) => {
  await page.goto('/receipts/new');

  // Add two items
  await page.click('[data-test-id="receipt-add-item-button"]');
  await page.click('[data-test-id="receipt-add-item-button"]');

  // Verify two items exist
  await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();
  await expect(page.locator('[data-test-id="receipt-item-row-1"]')).toBeVisible();

  // Delete first item
  await page.click('[data-test-id="receipt-item-row-0-delete-button"]');
  await page.click('[data-test-id="receipt-item-row-0-delete-dialog-confirm"]');

  // Verify first item removed
  await expect(page.locator('[data-test-id="receipt-item-row-0"]')).not.toBeVisible();

  // Remaining item becomes index 0
  await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();
});
```

#### Scenario 3: Cancel Item Deletion
```javascript
test('should cancel item deletion', async ({ page }) => {
  await page.goto('/receipts/new');

  // Add item
  await page.click('[data-test-id="receipt-add-item-button"]');
  await page.fill('[data-test-id="receipt-item-row-0-product-name-input"]', 'Test');

  // Try to delete but cancel
  await page.click('[data-test-id="receipt-item-row-0-delete-button"]');
  await page.click('[data-test-id="receipt-item-row-0-delete-dialog-cancel"]');

  // Verify item still exists
  await expect(page.locator('[data-test-id="receipt-item-row-0"]')).toBeVisible();
  await expect(
    page.locator('[data-test-id="receipt-item-row-0-product-name-input"]')
  ).toHaveValue('Test');
});
```

#### Scenario 4: Cancel Form (without saving)
```javascript
test('should cancel receipt form', async ({ page }) => {
  await page.goto('/receipts/new');

  // Fill some data
  await page.fill('[data-test-id="receipt-store-name-input"]', 'Biedronka');

  // Click cancel
  await page.click('[data-test-id="receipt-cancel-button"]');

  // Should redirect to home
  await expect(page).toHaveURL(/^\//);
});
```

---

## Test ID Naming Convention

```
receipt-{component}-{field|section}-{action|type}
       └─ domain    └─ logical part    └─ descriptive

Examples:
receipt-form-container              (container)
receipt-date-trigger                (interactive element - button)
receipt-date-calendar               (content - calendar)
receipt-store-name-input            (form field - input)
receipt-add-item-button             (action button)
receipt-item-row-{index}            (component with index)
receipt-item-row-0-product-name-input  (nested component field)
receipt-item-row-0-category-option-1   (dynamic option with ID)
receipt-item-row-0-delete-dialog    (modal/dialog container)
receipt-total-amount                (computed/display value)
receipt-submit-button               (primary action button)
```

### Naming Rules
1. **Prefix:** Always start with `receipt-`
2. **Component Level:** Use logical component names (`form`, `date`, `item-row`, etc.)
3. **Field/Section:** Specify the field (`product-name`, `category`, `total`, etc.)
4. **Index:** For arrays, append `-{index}` (0-based)
5. **Sub-elements:** Combine with hyphens (`category-select`, `delete-button`)
6. **Dynamic IDs:** Include identifier (`category-option-{id}`)

---

## Integration with Testing Frameworks

### Playwright (E2E)
```javascript
// Find element
const element = page.locator('[data-test-id="receipt-submit-button"]');

// Assertions
await expect(element).toBeVisible();
await expect(element).toBeEnabled();
await expect(element).toContainText('Zapisz');
```

### Vitest + Testing Library (Unit)
```javascript
import { render, screen } from '@testing-library/react';
import ReceiptForm from '@/components/receipts/ReceiptForm';

test('renders receipt form', () => {
  render(<ReceiptForm categories={[]} />);

  const form = screen.getByTestId('receipt-form');
  expect(form).toBeInTheDocument();

  const submitBtn = screen.getByTestId('receipt-submit-button');
  expect(submitBtn).toBeInTheDocument();
});
```

### Cypress (Alternative)
```javascript
describe('Receipt Form', () => {
  it('should save receipt', () => {
    cy.visit('/receipts/new');
    cy.get('[data-test-id="receipt-form"]').should('be.visible');
    cy.get('[data-test-id="receipt-submit-button"]').click();
  });
});
```

---

## Maintenance Notes

### When Adding New Features
1. Follow the naming convention consistently
2. Add both parent and child `data-test-id` attributes
3. Update this documentation
4. Create corresponding test cases

### When Modifying Components
1. Update `data-test-id` if HTML structure changes
2. Ensure backward compatibility with existing tests
3. Update documentation if test IDs change

### Common Pitfalls
- ❌ Don't use dynamic values that aren't stable (timestamps, random IDs)
- ❌ Don't include implementation details in test IDs
- ❌ Don't duplicate test IDs
- ✅ Use semantic, readable names
- ✅ Keep test IDs stable across refactors
- ✅ Document dynamic parts clearly (e.g., `{index}`)

---

## Quick Reference Table

| Scenario | Test IDs | Dependencies |
|----------|----------|--------------|
| Open form | `receipt-form-container`, `receipt-form` | Page load |
| Select date | `receipt-date-trigger`, `receipt-date-calendar` | Calendar library |
| Enter store | `receipt-store-name-input` | Form field |
| Add item | `receipt-add-item-button`, `receipt-items-list` | Form state |
| Fill item | `receipt-item-row-0-product-name-input`, `.price-input`, `.category-select` | ReceiptItemRow |
| Delete item | `receipt-item-row-0-delete-button`, `.delete-dialog`, `.delete-dialog-confirm` | AlertDialog |
| Check total | `receipt-total-amount` | Calculate function |
| Submit | `receipt-submit-button` | Form validation |
| Cancel | `receipt-cancel-button` | Router |

---

## Files Modified

1. **[ReceiptForm.tsx](src/components/receipts/ReceiptForm.tsx)**
   - Added 9 `data-test-id` attributes
   - Root container, form, date field, store field, items section, total, buttons

2. **[ReceiptItemRow.tsx](src/components/receipts/ReceiptItemRow.tsx)**
   - Updated interface to accept `data-test-id` prop
   - Added 8+ `data-test-id` attributes per item
   - Row container, product field, price field, category field (with options), delete button, delete dialog

---

## Version History

- **v1.0** (2024-10-19)
  - Initial test IDs implementation for receipt form scenario
  - 17+ unique test IDs across two components
  - Complete documentation with examples
