import { Page, expect } from '@playwright/test';

/**
 * Base Page class for Page Object Model pattern
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async getTitle() {
    return this.page.title();
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.page.waitForLoadState(state);
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/screenshots/${name}.png` });
  }

  async fillInput(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async getText(selector: string) {
    return this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return this.page.isVisible(selector);
  }

  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector);
  }

  // ============================================
  // data-testid based methods (preferred pattern)
  // ============================================

  /**
   * Locate element by data-testid attribute
   * @param testId The value of data-testid
   * @returns Locator for the element
   */
  protected getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  /**
   * Click element by data-testid
   * @param testId The value of data-testid
   */
  async clickByTestId(testId: string) {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input element by data-testid
   * @param testId The value of data-testid
   * @param text Text to fill
   */
  async fillByTestId(testId: string, text: string) {
    await this.getByTestId(testId).fill(text);
  }

  /**
   * Get text content from element by data-testid
   * @param testId The value of data-testid
   * @returns Text content or null
   */
  async getTextByTestId(testId: string) {
    return await this.getByTestId(testId).textContent();
  }

  /**
   * Check if element is visible by data-testid
   * @param testId The value of data-testid
   * @returns true if visible, false otherwise
   */
  async isVisibleByTestId(testId: string) {
    return await this.getByTestId(testId).isVisible();
  }

  /**
   * Wait for element to be visible by data-testid
   * @param testId The value of data-testid
   */
  async waitForTestId(testId: string) {
    await this.page.getByTestId(testId).waitFor({ state: 'visible' });
  }

  /**
   * Check if element is enabled by data-testid
   * @param testId The value of data-testid
   * @returns true if enabled, false otherwise
   */
  async isEnabledByTestId(testId: string) {
    return await this.getByTestId(testId).isEnabled();
  }

  /**
   * Get element's input value by data-testid
   * @param testId The value of data-testid
   * @returns Input value or null
   */
  async getInputValueByTestId(testId: string) {
    return await this.getByTestId(testId).inputValue();
  }

  /**
   * Verify element is visible by data-testid
   * @param testId The value of data-testid
   */
  async expectVisibleByTestId(testId: string) {
    await expect(this.getByTestId(testId)).toBeVisible();
  }

  /**
   * Verify element is hidden by data-testid
   * @param testId The value of data-testid
   */
  async expectHiddenByTestId(testId: string) {
    await expect(this.getByTestId(testId)).toBeHidden();
  }

  /**
   * Verify element is enabled by data-testid
   * @param testId The value of data-testid
   */
  async expectEnabledByTestId(testId: string) {
    await expect(this.getByTestId(testId)).toBeEnabled();
  }

  /**
   * Verify element is disabled by data-testid
   * @param testId The value of data-testid
   */
  async expectDisabledByTestId(testId: string) {
    await expect(this.getByTestId(testId)).toBeDisabled();
  }

  /**
   * Verify element contains text by data-testid
   * @param testId The value of data-testid
   * @param text Text to verify
   */
  async expectTextByTestId(testId: string, text: string | RegExp) {
    await expect(this.getByTestId(testId)).toContainText(text);
  }

  /**
   * Verify element has value by data-testid
   * @param testId The value of data-testid
   * @param value Value to verify
   */
  async expectValueByTestId(testId: string, value: string) {
    await expect(this.getByTestId(testId)).toHaveValue(value);
  }

  /**
   * Wait for URL to match
   * @param urlPattern URL pattern or RegExp
   */
  async expectUrlMatch(urlPattern: string | RegExp) {
    await expect(this.page).toHaveURL(urlPattern);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForNavigation();
  }
}
