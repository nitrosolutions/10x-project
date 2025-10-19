import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Receipt Date Selection Section
 * Handles date picker interaction for receipt purchase date
 *
 * Test IDs:
 * - receipt-date-trigger: Button to open date picker
 * - receipt-date-calendar: Calendar popover content
 */
export class ReceiptDateSection extends BasePage {
  // Test ID constants
  private readonly DATE_TRIGGER = "receipt-date-trigger";
  private readonly DATE_CALENDAR = "receipt-date-calendar";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the date picker
   */
  async openDatePicker() {
    await this.clickByTestId(this.DATE_TRIGGER);
    // Wait for the calendar to appear (Radix Popover renders as portal)
    // Radix Calendar component renders with specific class or we can wait for month grid
    await this.page.waitForTimeout(300); // Wait for animation

    // Wait for calendar month view to be visible (more reliable than role)
    await this.page.locator('[role="grid"]').first().waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Verify date picker is visible
   */
  async isDatePickerVisible() {
    return await this.page
      .locator('[role="grid"]')
      .first()
      .isVisible()
      .catch(() => false);
  }

  /**
   * Get the currently displayed date from trigger button
   * Format: "PPP" in Polish locale (e.g., "15 października 2024")
   */
  async getDisplayedDate() {
    return await this.getTextByTestId(this.DATE_TRIGGER);
  }

  /**
   * Verify the displayed date contains expected text
   * @param dateText Expected date text (partial match)
   */
  async verifyDisplayedDate(dateText: string) {
    await this.expectTextByTestId(this.DATE_TRIGGER, dateText);
  }

  /**
   * Select a specific day from the calendar
   * @param day Day number (1-31)
   */
  async selectDay(day: number) {
    // Open calendar if not already open
    const isVisible = await this.isDatePickerVisible();
    if (!isVisible) {
      await this.openDatePicker();
    }

    // Wait a bit for calendar to fully render
    await this.page.waitForTimeout(300);

    // Find the day button in the calendar grid
    // Radix UI Calendar renders days as buttons within a grid
    const calendar = this.page.locator('[role="grid"]').first();

    // Strategy 1: Find button with exact text match within the grid
    let dayButton = calendar.getByRole("gridcell").getByRole("button", { name: String(day), exact: true });

    // Check if button exists
    const count = await dayButton.count();

    if (count === 0) {
      // Strategy 2: Find any button in gridcell containing the day number
      console.log(`[DatePicker] Could not find gridcell button with exact name "${day}", trying flexible match...`);
      dayButton = calendar.locator(`button:has-text("${day}")`).first();
    }

    // Click the button
    await dayButton.click();
  }

  /**
   * Select a date using date string (YYYY-MM-DD format)
   * This is a convenience method that calculates the day from the date
   * @param dateString Date in YYYY-MM-DD format (e.g., "2024-10-15")
   */
  async selectDate(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDate();
    await this.selectDay(day);
  }

  /**
   * Select today's date
   * Note: The form defaults to today, so we just verify it's set
   */
  async selectToday() {
    // Form already defaults to today's date, so we just verify it's showing a date
    const displayedDate = await this.getDisplayedDate();
    if (!displayedDate || displayedDate.includes("Wybierz datę")) {
      // Only open calendar if no date is selected
      const today = new Date();
      await this.selectDay(today.getDate());
    }
    // Otherwise, today is already selected by default
  }

  /**
   * Select a date relative to today
   * @param daysOffset Number of days from today (negative for past, positive for future)
   */
  async selectRelativeDate(daysOffset: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    await this.selectDay(targetDate.getDate());
  }

  /**
   * Close the date picker (by clicking trigger again or clicking outside)
   */
  async closeDatePicker() {
    if (await this.isDatePickerVisible()) {
      await this.clickByTestId(this.DATE_TRIGGER);
    }
  }

  /**
   * Verify date picker is not visible
   */
  async verifyDatePickerClosed() {
    const isVisible = await this.isDatePickerVisible();
    if (isVisible) {
      throw new Error("Expected date picker to be closed, but it is visible");
    }
  }

  /**
   * Wait for date calendar to appear
   */
  async waitForDateCalendar() {
    await this.page.locator('[role="grid"]').first().waitFor({ state: "visible" });
  }
}
